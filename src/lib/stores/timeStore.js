// src/lib/stores/timerStore.js
import { writable } from 'svelte/store';
import { playClick } from '../audio';

// Load initial state from LocalStorage or default
const stored = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('zen-timer')) : null;
const initialState = stored || {
    status: 'IDLE', // IDLE, RUNNING, PAUSED, DONE
    duration: 0,    // Total time set
    remaining: 0,   // Time left
    endTime: null   // Timestamp when it should finish (for accurate background counting)
};

function createTimer() {
    const { subscribe, set, update } = writable(initialState);
    let interval;

    // Helper to save to LS
    const save = (state) => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('zen-timer', JSON.stringify(state));
        }
    };

    return {
        subscribe,
        
        // Add time (via Wheel)
        addTime: (seconds) => update(s => {
            if (s.status === 'RUNNING') return s; // Lock when running
            const newDur = Math.max(0, s.duration + seconds);
            const newState = { ...s, duration: newDur, remaining: newDur, status: 'IDLE' };
            save(newState);
            return newState;
        }),

        // Set absolute time (via Radial Menu)
        setTime: (seconds) => update(s => {
            const newState = { ...s, duration: seconds, remaining: seconds, status: 'IDLE' };
            save(newState);
            return newState;
        }),

        start: () => update(s => {
            if (s.remaining <= 0) return s;
            
            // Calculate exact end time to handle browser throttling/tab switching
            const end = Date.now() + (s.remaining * 1000);
            
            // Start the interval
            clearInterval(interval);
            interval = setInterval(() => {
                const now = Date.now();
                const left = Math.ceil((end - now) / 1000);

                if (left <= 0) {
                    timer.finish();
                } else {
                    update(state => {
                        const next = { ...state, remaining: left };
                        save(next); // Save every tick (optional, maybe too frequent, but safe)
                        return next;
                    });
                }
            }, 1000);

            const newState = { ...s, status: 'RUNNING', endTime: end };
            save(newState);
            return newState;
        }),

        pause: () => update(s => {
            clearInterval(interval);
            const newState = { ...s, status: 'PAUSED', endTime: null };
            save(newState);
            return newState;
        }),

        reset: () => update(s => {
            clearInterval(interval);
            // Reset to 0 (or strictly reset to duration if you prefer)
            const newState = { ...s, status: 'IDLE', duration: 0, remaining: 0, endTime: null };
            save(newState);
            return newState;
        }),

        finish: () => update(s => {
            clearInterval(interval);
            
            // Alarm burst
            let count = 0;
            const burst = setInterval(() => {
                playClick();
                count++;
                if (count > 5) clearInterval(burst);
            }, 200);

            const newState = { ...s, status: 'DONE', remaining: 0, endTime: null };
            save(newState);
            return newState;
        })
    };
}

export const timer = createTimer();