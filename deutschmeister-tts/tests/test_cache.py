"""Cache regression tests without downloading Piper models or API dependencies."""
import ast
from concurrent.futures import ThreadPoolExecutor
import hashlib
from pathlib import Path
import tempfile
import threading
import unittest


class CacheTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.namespace = {
            'Path': Path, 'tempfile': tempfile, 'hashlib': hashlib,
            '_cache_write_lock': threading.Lock(),
            'TTS_CACHE_DIR': Path(self.directory.name),
            'model_for_voice': lambda voice: f'model-{voice}',
            'LENGTH_SCALE': 1, 'NOISE_W_SCALE': 1, 'SENTENCE_SILENCE_SEC': 1,
        }
        source = Path(__file__).resolve().parents[1] / 'app' / 'main.py'
        tree = ast.parse(source.read_text(encoding='utf-8'))
        functions = [node for node in tree.body if isinstance(node, ast.FunctionDef)
                     and node.name in {'normalize_text', 'cache_path', 'write_cache'}]
        exec(compile(ast.Module(body=functions, type_ignores=[]), str(source), 'exec'), self.namespace)

    def test_german_case_has_distinct_audio_cache(self):
        cache_path = self.namespace['cache_path']
        self.assertNotEqual(cache_path('Weg', 'male'), cache_path('weg', 'male'))
        self.assertEqual(cache_path('  Guten\n Tag ', 'male'), cache_path('Guten Tag', 'male'))
        self.assertNotEqual(cache_path('Guten Tag', 'male'), cache_path('Guten Tag', 'female'))

    def test_parallel_writers_leave_one_complete_file_and_no_temporary_files(self):
        cached = Path(self.directory.name) / 'same.mp3'
        payloads = [bytes([index]) * 10000 for index in range(16)]
        with ThreadPoolExecutor(max_workers=8) as executor:
            list(executor.map(lambda audio: self.namespace['write_cache'](cached, audio), payloads))
        self.assertIn(cached.read_bytes(), payloads)
        self.assertEqual(list(cached.parent.glob('*.tmp')), [])


if __name__ == '__main__':
    unittest.main()
