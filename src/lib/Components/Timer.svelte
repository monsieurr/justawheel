<!-- src/lib/Components/Timer.svelte -->
<script>
    import { onDestroy } from 'svelte';
    import RotaryWheel from './RotaryWheel.svelte';
    import { playClick } from '../audio'; // Re-using audio for alarm

    // State
    let duration = 0; // Total seconds
    let remaining = 0; // Seconds left
    let status = 'IDLE'; // 'IDLE', 'RUNNING', 'PAUSED', 'DONE'
    let interval;
    
    // Click handling helpers
    let clickTimer = null;

    // Formatting MM:SS
    $: minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    $: seconds = (remaining % 60).toString().padStart(2, '0');

    // The Wheel Logic
    function handleRotate(event) {
        // Only allow changing time if not running
        if (status === 'RUNNING') return;
        
        // 1 tick = 10 seconds change
        const change = event.detail.direction * 10;
        
        let newDuration = duration + change;
        if (newDuration < 0) newDuration = 0;
        
        duration = newDuration;
        remaining = newDuration;
        
        // If we were done or paused, rotating resets to idle state with new time
        if (status === 'DONE' || status === 'PAUSED') status = 'IDLE';
    }

    // Interaction Logic (1 click = Start/Pause, 2 click = Reset)
    function handleInteraction() {
        if (clickTimer) {
            // DOUBLE CLICK DETECTED
            clearTimeout(clickTimer);
            clickTimer = null;
            handleReset();
        } else {
            // Wait 250ms to see if it's a double click
            clickTimer = setTimeout(() => {
                toggleTimer();
                clickTimer = null;
            }, 250);
        }
    }

    function toggleTimer() {
        if (duration === 0) return; // Can't start 0

        if (status === 'IDLE' || status === 'PAUSED') {
            startCountdown();
        } else if (status === 'RUNNING') {
            pauseCountdown();
        } else if (status === 'DONE') {
            status = 'IDLE'; // Dismiss alarm
        }
    }

    function handleReset() {
        pauseCountdown();
        status = 'IDLE';
        remaining = duration; // Reset to the last set time (useful for pomodoro)
        // If you prefer clearing to 0 completely, use: duration = 0; remaining = 0;
    }

    function startCountdown() {
        status = 'RUNNING';
        clearInterval(interval);
        interval = setInterval(() => {
            if (remaining > 0) {
                remaining--;
            } else {
                finishCountdown();
            }
        }, 1000);
    }

    function pauseCountdown() {
        status = 'PAUSED';
        clearInterval(interval);
    }

    function finishCountdown() {
        status = 'DONE';
        clearInterval(interval);
        // Little alarm burst
        let alarmCount = 0;
        const alarmInterval = setInterval(() => {
            playClick();
            alarmCount++;
            if (alarmCount > 5 || status !== 'DONE') clearInterval(alarmInterval);
        }, 200);
    }

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<div class="timer-wrapper">
    <RotaryWheel on:rotate={handleRotate}>
        <button class="timer-face" on:click={handleInteraction}>
            
            <div class="time-display" class:blink={status === 'PAUSED'} class:alert={status === 'DONE'}>
                {minutes}:{seconds}
            </div>

            <div class="status-label">
                {#if status === 'IDLE'}
                    {#if duration === 0} SET TIME {:else} READY {/if}
                {:else if status === 'RUNNING'}
                    RUNNING
                {:else if status === 'PAUSED'}
                    PAUSED
                {:else if status === 'DONE'}
                    DONE
                {/if}
            </div>

        </button>
    </RotaryWheel>
</div>

<style>
    .timer-face {
        pointer-events: auto; /* <--- ADD THIS LINE */
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
    }

    .time-display {
        font-size: 3.5rem;
        font-weight: 200;
        font-variant-numeric: tabular-nums;
        letter-spacing: -2px;
        transition: color 0.3s;
    }

    /* Visual Feedback States */
    .time-display.blink {
        animation: blinker 1s linear infinite;
        opacity: 0.7;
    }

    .time-display.alert {
        color: #ff3e00; /* Svelte Orange Alert */
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .status-label {
        font-size: 0.8rem;
        letter-spacing: 3px;
        opacity: 0.5;
        margin-top: 5px;
        height: 1rem;
    }

    @keyframes blinker {
        50% { opacity: 0.3; }
    }

    @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
    }
</style>