'use client';

interface TheorySectionProps {
    content: {
        sections: {
            title: { de: string; en: string; vi: string };
            content: string;
            table?: {
                headers: string[];
                rows: string[][];
            };
        }[];
    };
}

import { usePronunciation } from '@/hooks/usePronunciation';
import { Button } from '@/components/ui/Button'; // Assuming Button exists for simple click

interface TheorySectionProps {
    content: {
        sections: {
            title: { de: string; en: string; vi: string };
            content: string;
            table?: {
                headers: string[];
                rows: string[][];
            };
        }[];
    };
}

export const TheorySection = ({ content }: TheorySectionProps) => {
    const { speak } = usePronunciation();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {content.sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-2 mb-2 border-l-4 border-blue-500 pl-3">
                        <h3 className="text-xl font-bold text-gray-800">
                            {section.title.vi}
                            <span className="text-sm font-normal text-gray-500 ml-2">({section.title.de})</span>
                        </h3>
                        <button
                            onClick={() => speak(section.title.de)}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Nghe phát âm"
                        >
                            🔊
                        </button>
                    </div>

                    <div className="prose max-w-none text-gray-600 mb-4">
                        <p>{section.content}</p>
                    </div>

                    {section.table && (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        {section.table.headers.map((header, hIdx) => (
                                            <th key={hIdx} className="px-6 py-3">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.table.rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="bg-white border-b hover:bg-gray-50">
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} className={`px-6 py-4 ${cIdx === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                                    <div className="flex items-center gap-2">
                                                        {cell}
                                                        {/* Assume 1st column is German word/phrase */}
                                                        {cIdx === 0 && (
                                                            <button
                                                                onClick={() => speak(cell)}
                                                                className="opacity-20 hover:opacity-100 transition-opacity"
                                                                title="Nghe"
                                                            >
                                                                🔊
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
