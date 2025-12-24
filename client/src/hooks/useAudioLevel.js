/**
 * useAudioLevel Hook
 * Detects if an audio stream has sound above a threshold (speaking detection)
 * 
 * @param {MediaStream} stream - Audio stream to analyze
 * @returns {boolean} Whether the user is currently speaking
 */
import { useEffect, useState } from 'react';
import { AUDIO_ANALYSIS } from '../config/rtc.config';

export const useAudioLevel = (stream) => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!stream?.getAudioTracks().length) {
            setIsSpeaking(false);
            return;
        }

        let audioContext;
        let analyser;
        let microphone;
        let processor;

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
        } catch (err) {
            console.error('[AudioLevel] Analysis error:', err);
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

    return isSpeaking;
};
