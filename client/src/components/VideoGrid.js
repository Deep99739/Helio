/**
 * VideoGrid Component
 * Displays video feeds for participants with active video
 * Plays audio for participants with video off via hidden audio elements
 */
import React, { useEffect, useRef, useState, memo } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { AUDIO_ANALYSIS } from '../config/rtc.config';

// Hidden audio player for audio-only participants
const AudioOnlyPlayer = memo(({ stream }) => {
    const audioRef = useRef();

    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay style={{ display: 'none' }} />;
});

// Video player with speaking indicator
const VideoPlayer = memo(({ stream, username, isMuted, isLocal }) => {
    const videoRef = useRef();
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Speaking detection
    useEffect(() => {
        if (!stream?.getAudioTracks().length) return;

        let audioContext, analyser, microphone, processor;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            processor = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = AUDIO_ANALYSIS.smoothingTimeConstant;
            analyser.fftSize = AUDIO_ANALYSIS.fftSize;

            microphone.connect(analyser);
            analyser.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                const average = array.reduce((a, b) => a + b, 0) / array.length;
                setIsSpeaking(average > AUDIO_ANALYSIS.speakingThreshold);
            };
        } catch {
            // Audio analysis not critical
        }

        return () => {
            try {
                processor?.disconnect();
                analyser?.disconnect();
                microphone?.disconnect();
                if (audioContext?.state !== 'closed') audioContext.close();
            } catch {
                // Cleanup errors are non-critical
            }
        };
    }, [stream]);

    const displayName = username.length > 12 ? `${username.substring(0, 10)}...` : username;

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            overflow: 'hidden',
            border: `2px solid ${isSpeaking ? '#4ade80' : '#333'}`,
            boxShadow: isSpeaking ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none',
            transition: 'border 0.2s, box-shadow 0.2s'
        }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: isLocal ? 'scaleX(-1)' : 'none'
                }}
            />

            <div style={{
                position: 'absolute',
                bottom: '6px',
                left: '6px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                {isMuted ? <MicOff size={10} color="#f87171" /> : <Mic size={10} color="#4ade80" />}
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}{isLocal ? ' (You)' : ''}
                </span>
            </div>
        </div>
    );
});

const VideoGrid = ({ localStream, peers, clients, user, isMicMuted, isVideoMuted }) => {
    // Combine all participants with streams
    const allParticipants = [
        {
            socketId: 'local',
            username: user?.username || 'You',
            stream: localStream,
            isLocal: true,
            isMicMuted,
            isVideoMuted
        },
        ...Object.entries(peers).map(([socketId, peer]) => ({
            socketId,
            username: clients.find(c => c.socketId === socketId)?.username || 'Guest',
            stream: peer.stream,
            isLocal: false,
            isMicMuted: peer.isMicMuted,
            isVideoMuted: peer.isVideoMuted
        }))
    ].filter(p => p.stream);

    const videoParticipants = allParticipants.filter(p => !p.isVideoMuted);
    const audioOnlyParticipants = allParticipants.filter(p => p.isVideoMuted && !p.isLocal);

    const getHeight = (count) => {
        if (count === 1) return '140px';
        if (count <= 4) return '90px';
        return '70px';
    };

    return (
        <>
            {/* Hidden audio players */}
            {audioOnlyParticipants.map(p => (
                <AudioOnlyPlayer key={`audio-${p.socketId}`} stream={p.stream} />
            ))}

            {/* Video grid */}
            {videoParticipants.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '10px',
                    backgroundColor: '#1e1e1e',
                    borderBottom: '1px solid #333'
                }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Video Call
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: videoParticipants.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                        gap: '6px'
                    }}>
                        {videoParticipants.map(p => (
                            <div
                                key={p.socketId}
                                style={{
                                    height: getHeight(videoParticipants.length),
                                    borderRadius: '6px',
                                    overflow: 'hidden'
                                }}
                            >
                                <VideoPlayer
                                    stream={p.stream}
                                    username={p.username}
                                    isMuted={p.isMicMuted}
                                    isLocal={p.isLocal}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default memo(VideoGrid);
