/**
 * WebRTC Configuration
 * Centralized configuration for WebRTC peer connections
 */

export const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export const MEDIA_CONSTRAINTS = {
    audio: true,
    video: true
};

export const AUDIO_ANALYSIS = {
    fftSize: 1024,
    smoothingTimeConstant: 0.8,
    speakingThreshold: 10
};
