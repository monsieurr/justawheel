// src/lib/audio.js

// 1. Global variable to store the context
let audioCtx = null;

// 2. The missing export that causes the error
export const initAudio = () => {
    // If context exists, just make sure it's running (Fixes iOS issues)
    if (audioCtx) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return;
    }

    // Create the context only once
    const AudioContext = window.AudioContext || window['webkitAudioContext'];
    if (!AudioContext) return;

    audioCtx = new AudioContext();
};

export const playClick = () => {
    // If something tries to play before clicking, initialize silently
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Sound Design: "Tick"
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.02);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.03);
};