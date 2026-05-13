'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { speakingRoomsApi } from '@/lib/api/speakingRooms';

export type CallState = 'idle' | 'connecting' | 'in-call' | 'failed';

interface Params {
  socket: Socket | null;
  roomId: string;
  currentUserId: string;
  remoteUserId: string | null;
}

interface Return {
  callState: CallState;
  isMuted: boolean;
  localVoiceEnabled: boolean;
  remoteReady: boolean;
  audioLevel: number;
  remoteAudioLevel: number;
  startCall: () => void;
  stopCall: () => void;
  retryCall: () => void;
  toggleMute: () => void;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  error: string | null;
  callDurationSec: number;
}

/**
 * Auto-connecting WebRTC voice call hook.
 *
 * As soon as both `socket` and `remoteUserId` are present, this hook initiates
 * a peer connection without any user action. To avoid both peers creating an
 * offer at the same time ("SDP glare"), we deterministically pick a caller by
 * lexicographic comparison of userIds — the smaller id is the caller.
 *
 * User control surface: only mute/unmute. There is no Call or Hangup button.
 * Leaving the room (or partner leaving) tears the connection down.
 */
export function useWebRTCCall({ socket, roomId, currentUserId, remoteUserId }: Params): Return {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const peerUserIdRef = useRef<string | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartedAtRef = useRef<number | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<{ fromUserId: string; sdp: RTCSessionDescriptionInit } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Each setupPeerConnection invocation gets a monotonically increasing id.
  // After every await, the setup checks it still owns the latest id; if a
  // newer invocation has started (StrictMode double-mount, Fast Refresh,
  // remote partner change), the older setup aborts and releases its mic.
  const setupIdRef = useRef(0);

  const cleanup = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callStartedAtRef.current = null;
    setCallDurationSec(0);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
    peerUserIdRef.current = null;
    pendingIceRef.current = [];
    setAudioLevel(0);
    setRemoteAudioLevel(0);
    setIsMuted(false);
  }, []);

  const startMeterLoop = useCallback(() => {
    const local = localAnalyserRef.current;
    const remote = remoteAnalyserRef.current;
    if (!local && !remote) return;
    const localBuf = new Uint8Array(local?.frequencyBinCount ?? 0);
    const remoteBuf = new Uint8Array(remote?.frequencyBinCount ?? 0);

    const tick = () => {
      if (local) {
        local.getByteFrequencyData(localBuf);
        let sum = 0;
        for (let i = 0; i < localBuf.length; i++) sum += localBuf[i] ?? 0;
        setAudioLevel(sum / localBuf.length / 255);
      }
      if (remote) {
        remote.getByteFrequencyData(remoteBuf);
        let sum = 0;
        for (let i = 0; i < remoteBuf.length; i++) sum += remoteBuf[i] ?? 0;
        setRemoteAudioLevel(sum / remoteBuf.length / 255);
      }
      if (pcRef.current) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const setupPeerConnection = useCallback(
    async (peerUserId: string, asCaller: boolean) => {
      const myId = ++setupIdRef.current;
      const isCurrent = () => myId === setupIdRef.current;
      console.log(`[WebRTC] setupPeerConnection #${myId} as ${asCaller ? 'CALLER' : 'CALLEE'} for peer ${peerUserId}`);
      setError(null);
      peerUserIdRef.current = peerUserId;
      setCallState('connecting');
      try {
        // 1. Fetch config + acquire mic BEFORE creating the PC so that when
        //    we assign pcRef.current, the connection is already track-ready.
        //    This closes the race where a remote offer arrives before our
        //    PC is set up.
        const { iceServers } = await speakingRoomsApi.getIceConfig();
        if (!isCurrent()) { console.log(`[WebRTC] #${myId} stale after ICE fetch, aborting`); return; }
        console.log('[WebRTC] ICE servers:', iceServers);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isCurrent()) {
          console.log(`[WebRTC] #${myId} stale after getUserMedia, releasing mic`);
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        console.log('[WebRTC] Got local audio stream');

        const pc = new RTCPeerConnection({ iceServers });
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const ctx = new AudioContext();
        const localSrc = ctx.createMediaStreamSource(stream);
        const localAnalyser = ctx.createAnalyser();
        localAnalyser.fftSize = 256;
        localSrc.connect(localAnalyser);

        pc.ontrack = (ev) => {
          const remoteStream = ev.streams[0];
          if (!remoteStream) return;
          console.log('[WebRTC] Got remote track');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(() => {});
          }
          const remoteSrc = ctx.createMediaStreamSource(remoteStream);
          const remoteAnalyser = ctx.createAnalyser();
          remoteAnalyser.fftSize = 256;
          remoteSrc.connect(remoteAnalyser);
          remoteAnalyserRef.current = remoteAnalyser;
          startMeterLoop();
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate && socketRef.current) {
            socketRef.current.emit('webrtc:ice', {
              roomId,
              toUserId: peerUserId,
              candidate: ev.candidate.toJSON(),
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          const s = pc.iceConnectionState;
          console.log('[WebRTC] ICE state:', s);
          if (s === 'connected' || s === 'completed') {
            setCallState('in-call');
            if (!callStartedAtRef.current) {
              callStartedAtRef.current = Date.now();
              callTimerRef.current = setInterval(() => {
                if (callStartedAtRef.current) {
                  setCallDurationSec(Math.floor((Date.now() - callStartedAtRef.current) / 1000));
                }
              }, 1000);
            }
          } else if (s === 'failed') {
            setError('Không kết nối được. Có thể cần TURN server cho mạng này.');
            setCallState('failed');
          } else if (s === 'disconnected' || s === 'closed') {
            setCallState('idle');
          }
        };

        pc.onconnectionstatechange = () => {
          console.log('[WebRTC] Connection state:', pc.connectionState);
        };

        // Now commit refs — listeners see a fully wired PC.
        pcRef.current = pc;
        localStreamRef.current = stream;
        audioCtxRef.current = ctx;
        localAnalyserRef.current = localAnalyser;

        startMeterLoop();

        if (asCaller) {
          console.log(`[WebRTC] #${myId} CALLER creating offer`);
          const offer = await pc.createOffer();
          if (!isCurrent()) { pc.close(); return; }
          await pc.setLocalDescription(offer);
          if (!isCurrent()) { pc.close(); return; }
          socketRef.current?.emit('webrtc:offer', { roomId, toUserId: peerUserId, sdp: offer });
        } else {
          console.log(`[WebRTC] #${myId} CALLEE waiting for offer`);
          // Drain any offer that arrived before our PC was ready.
          const pending = pendingOfferRef.current;
          if (pending && pending.fromUserId === peerUserId) {
            console.log(`[WebRTC] #${myId} draining buffered offer`);
            pendingOfferRef.current = null;
            await pc.setRemoteDescription(pending.sdp);
            if (!isCurrent()) { pc.close(); return; }
            for (const c of pendingIceRef.current) {
              try { await pc.addIceCandidate(c); } catch { /* ignore */ }
            }
            pendingIceRef.current = [];
            const answer = await pc.createAnswer();
            if (!isCurrent()) { pc.close(); return; }
            await pc.setLocalDescription(answer);
            socketRef.current?.emit('webrtc:answer', { roomId, toUserId: peerUserId, sdp: answer });
          }
        }
      } catch (err) {
        const e = err as Error;
        console.error('[WebRTC] Setup error:', e);
        if (e.name === 'NotAllowedError') setError('Cần cấp quyền microphone để vào cuộc gọi.');
        else if (e.name === 'NotFoundError') setError('Không tìm thấy microphone.');
        else setError(e.message || 'Lỗi không xác định khi kết nối.');
        cleanup();
        setCallState('failed');
      }
    },
    [roomId, cleanup, startMeterLoop],
  );

  const toggleMute = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    const next = !isMuted;
    tracks.forEach((t) => (t.enabled = !next));
    setIsMuted(next);
  }, [isMuted]);

  // Wire signaling listeners once per socket.
  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    const onWebRTCReady = ({ fromUserId }: { fromUserId: string }) => {
      if (fromUserId === remoteUserId) setRemoteReady(true);
    };
    const onWebRTCOffer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (fromUserId !== remoteUserId) return;
      console.log('[WebRTC] Received offer from', fromUserId);
      const pc = pcRef.current;
      // PC not ready yet (mic permission still pending) — buffer the offer so
      // setupPeerConnection can drain it once getUserMedia resolves.
      if (!pc) {
        console.log('[WebRTC] PC not ready, buffering offer');
        pendingOfferRef.current = { fromUserId, sdp };
        return;
      }
      await pc.setRemoteDescription(sdp);
      for (const c of pendingIceRef.current) {
        try { await pc.addIceCandidate(c); } catch { /* ignore */ }
      }
      pendingIceRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { roomId, toUserId: fromUserId, sdp: answer });
    };
    const onWebRTCAnswer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (fromUserId !== remoteUserId) return;
      console.log('[WebRTC] Received answer');
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      for (const c of pendingIceRef.current) {
        try { await pc.addIceCandidate(c); } catch { /* ignore */ }
      }
      pendingIceRef.current = [];
    };
    const onWebRTCIce = async ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (fromUserId !== remoteUserId) return;
      const pc = pcRef.current;
      if (!candidate) return;
      // Buffer ICE if remote description not yet applied.
      if (!pc || !pc.remoteDescription) {
        pendingIceRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // ignore
      }
    };

    socket.on('webrtc:ready', onWebRTCReady);
    socket.on('webrtc:offer', onWebRTCOffer);
    socket.on('webrtc:answer', onWebRTCAnswer);
    socket.on('webrtc:ice', onWebRTCIce);
    return () => {
      socket.off('webrtc:ready', onWebRTCReady);
      socket.off('webrtc:offer', onWebRTCOffer);
      socket.off('webrtc:answer', onWebRTCAnswer);
      socket.off('webrtc:ice', onWebRTCIce);
    };
  }, [socket, roomId, remoteUserId]);

  useEffect(() => {
    setRemoteReady(false);
    pendingOfferRef.current = null;
    pendingIceRef.current = [];
  }, [remoteUserId]);

  const startCall = useCallback(() => {
    if (!socketRef.current || !roomId || !remoteUserId) return;
    setError(null);
    setLocalVoiceEnabled(true);
    socketRef.current.emit('webrtc:ready', { roomId, toUserId: remoteUserId });
  }, [remoteUserId, roomId]);

  const stopCall = useCallback(() => {
    setupIdRef.current++;
    cleanup();
    setLocalVoiceEnabled(false);
    setCallState('idle');
    setError(null);
  }, [cleanup]);

  const retryCall = useCallback(() => {
    if (!remoteUserId) return;
    setupIdRef.current++;
    cleanup();
    setError(null);
    setCallState('idle');
    setLocalVoiceEnabled(true);
    setRetryNonce((n) => n + 1);
    socketRef.current?.emit('webrtc:ready', { roomId, toUserId: remoteUserId });
  }, [cleanup, remoteUserId, roomId]);

  // Start a peer connection only after the local user enables voice.
  // The setupId guard inside setupPeerConnection ensures only the latest
  // invocation wins under StrictMode/Fast-Refresh double-mounting.
  useEffect(() => {
    if (!socket || !remoteUserId || !currentUserId || !localVoiceEnabled) {
      setupIdRef.current++;
      cleanup();
      setCallState('idle');
      return;
    }
    if (peerUserIdRef.current === remoteUserId && pcRef.current) {
      return;
    }
    cleanup();
    const asCaller = currentUserId < remoteUserId;
    setupPeerConnection(remoteUserId, asCaller);
    return () => {
      setupIdRef.current++;
      cleanup();
    };
  }, [socket, remoteUserId, currentUserId, localVoiceEnabled, retryNonce, setupPeerConnection, cleanup]);

  return {
    callState,
    isMuted,
    localVoiceEnabled,
    remoteReady,
    audioLevel,
    remoteAudioLevel,
    startCall,
    stopCall,
    retryCall,
    toggleMute,
    remoteAudioRef,
    error,
    callDurationSec,
  };
}
