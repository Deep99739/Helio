/**
 * useWebRTC Hook
 * Manages WebRTC peer connections for real-time audio/video communication
 * 
 * @param {string} roomId - The room identifier
 * @param {object} user - User object with username
 * @param {React.RefObject} socketRef - Reference to socket instance
 * @param {boolean} socketInitialized - Whether socket is ready
 * 
 * @returns {object} WebRTC state and controls
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ACTIONS } from '../config/Actions';
import { RTC_CONFIG, MEDIA_CONSTRAINTS } from '../config/rtc.config';

export const useWebRTC = (roomId, user, socketRef, socketInitialized) => {
    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [mediaReady, setMediaReady] = useState(false);

    const peersRef = useRef({});
    const localStreamRef = useRef(null);
    const pendingOffersRef = useRef([]);
    const pendingIceCandidatesRef = useRef({});

    // Initialize local media stream
    useEffect(() => {
        let mounted = true;

        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);

                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                localStreamRef.current = stream;
                setLocalStream(stream);
                setMediaReady(true);
            } catch (err) {
                console.error('[WebRTC] Failed to get media:', err);
            }
        };

        initMedia();

        return () => {
            mounted = false;
            localStreamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    // Add queued ICE candidates after remote description is set
    const addQueuedIceCandidates = useCallback((socketId, pc) => {
        const candidates = pendingIceCandidatesRef.current[socketId] || [];
        candidates.forEach(async (candidate) => {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('[WebRTC] ICE candidate error:', err);
            }
        });
        delete pendingIceCandidatesRef.current[socketId];
    }, []);

    // Create and configure RTCPeerConnection
    const createPeerConnection = useCallback((remoteSocketId, isInitiator) => {
        const socket = socketRef?.current;
        if (!socket || !localStreamRef.current) return null;

        // Reuse existing connection
        if (peersRef.current[remoteSocketId]?.pc) {
            return peersRef.current[remoteSocketId].pc;
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);

        // Add local tracks
        localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
        });

        // ICE candidate handling
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit(ACTIONS.RTC_ICE_CANDIDATE, {
                    targetSocketId: remoteSocketId,
                    candidate: event.candidate
                });
            }
        };

        // Connection state - broadcast mute status when connected
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                socket.emit(ACTIONS.MUTE_STATUS_CHANGE, {
                    roomId,
                    isMicMuted: !localStreamRef.current?.getAudioTracks()[0]?.enabled,
                    isVideoMuted: !localStreamRef.current?.getVideoTracks()[0]?.enabled
                });
            }
        };

        // Remote track handling
        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            const peerData = { ...peersRef.current[remoteSocketId], stream: remoteStream, pc };

            peersRef.current[remoteSocketId] = peerData;
            setPeers(prev => ({ ...prev, [remoteSocketId]: peerData }));
        };

        // Store connection
        peersRef.current[remoteSocketId] = { pc, stream: null };
        setPeers(prev => ({ ...prev, [remoteSocketId]: { pc, stream: null } }));

        // Create and send offer if initiator
        if (isInitiator) {
            pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    socket.emit(ACTIONS.RTC_OFFER, {
                        targetSocketId: remoteSocketId,
                        offer: pc.localDescription
                    });
                })
                .catch(err => console.error('[WebRTC] Offer error:', err));
        }

        return pc;
    }, [socketRef, roomId]);

    // Process incoming offer
    const processOffer = useCallback(async (senderSocketId, offer) => {
        const socket = socketRef?.current;
        if (!socket || !localStreamRef.current) return;

        let pc = peersRef.current[senderSocketId]?.pc || createPeerConnection(senderSocketId, false);
        if (!pc) return;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            addQueuedIceCandidates(senderSocketId, pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit(ACTIONS.RTC_ANSWER, {
                targetSocketId: senderSocketId,
                answer: pc.localDescription
            });
        } catch (err) {
            console.error('[WebRTC] Offer processing error:', err);
        }
    }, [socketRef, createPeerConnection, addQueuedIceCandidates]);

    // Process pending offers when media ready
    useEffect(() => {
        if (!mediaReady || pendingOffersRef.current.length === 0) return;

        pendingOffersRef.current.forEach(({ senderSocketId, offer }) => {
            processOffer(senderSocketId, offer);
        });
        pendingOffersRef.current = [];
    }, [mediaReady, processOffer]);

    // Socket event handlers
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket || !roomId || !socketInitialized) return;

        const handleNewPeer = ({ socketId }) => {
            if (socketId !== socket.id && localStreamRef.current) {
                createPeerConnection(socketId, true);
            }
        };

        const handleOffer = async ({ senderSocketId, offer }) => {
            if (!localStreamRef.current) {
                pendingOffersRef.current.push({ senderSocketId, offer });
                return;
            }
            await processOffer(senderSocketId, offer);
        };

        const handleAnswer = async ({ senderSocketId, answer }) => {
            const pc = peersRef.current[senderSocketId]?.pc;
            if (pc?.signalingState === 'have-local-offer') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    addQueuedIceCandidates(senderSocketId, pc);
                } catch (err) {
                    console.error('[WebRTC] Answer error:', err);
                }
            }
        };

        const handleIceCandidate = async ({ senderSocketId, candidate }) => {
            const pc = peersRef.current[senderSocketId]?.pc;
            if (pc?.remoteDescription) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('[WebRTC] ICE error:', err);
                }
            } else {
                pendingIceCandidatesRef.current[senderSocketId] =
                    pendingIceCandidatesRef.current[senderSocketId] || [];
                pendingIceCandidatesRef.current[senderSocketId].push(candidate);
            }
        };

        const handleMuteStatus = ({ socketId, isMicMuted, isVideoMuted }) => {
            setPeers(prev => ({
                ...prev,
                [socketId]: { ...prev[socketId], isMicMuted, isVideoMuted }
            }));
        };

        const handleDisconnect = ({ socketId }) => {
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].pc?.close();
                delete peersRef.current[socketId];
                delete pendingIceCandidatesRef.current[socketId];
                setPeers(prev => {
                    const { [socketId]: _, ...rest } = prev;
                    return rest;
                });
            }
        };

        socket.on(ACTIONS.JOINED, handleNewPeer);
        socket.on(ACTIONS.RTC_OFFER, handleOffer);
        socket.on(ACTIONS.RTC_ANSWER, handleAnswer);
        socket.on(ACTIONS.RTC_ICE_CANDIDATE, handleIceCandidate);
        socket.on(ACTIONS.MUTE_STATUS_CHANGE, handleMuteStatus);
        socket.on(ACTIONS.DISCONNECTED, handleDisconnect);

        return () => {
            socket.off(ACTIONS.JOINED, handleNewPeer);
            socket.off(ACTIONS.RTC_OFFER, handleOffer);
            socket.off(ACTIONS.RTC_ANSWER, handleAnswer);
            socket.off(ACTIONS.RTC_ICE_CANDIDATE, handleIceCandidate);
            socket.off(ACTIONS.MUTE_STATUS_CHANGE, handleMuteStatus);
            socket.off(ACTIONS.DISCONNECTED, handleDisconnect);
        };
    }, [socketInitialized, roomId, createPeerConnection, processOffer, addQueuedIceCandidates]);

    // Media controls
    const toggleAudio = useCallback(() => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack && socketRef?.current) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMicMuted(!audioTrack.enabled);
            socketRef.current.emit(ACTIONS.MUTE_STATUS_CHANGE, {
                roomId,
                isMicMuted: !audioTrack.enabled,
                isVideoMuted
            });
        }
    }, [roomId, isVideoMuted, socketRef]);

    const toggleVideo = useCallback(() => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack && socketRef?.current) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoMuted(!videoTrack.enabled);
            socketRef.current.emit(ACTIONS.MUTE_STATUS_CHANGE, {
                roomId,
                isMicMuted,
                isVideoMuted: !videoTrack.enabled
            });
        }
    }, [roomId, isMicMuted, socketRef]);

    return {
        localStream,
        peers,
        toggleAudio,
        toggleVideo,
        isMicMuted,
        isVideoMuted
    };
};
