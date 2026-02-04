<!-- src/lib/Components/Timer.svelte -->
<script>
    import { onDestroy } from 'svelte';
    import RotaryWheel from './RotaryWheel.svelte';
    import { playClick } from '../audio';

    let duration = 0;
    let remaining = 0;
    let status = 'IDLE';
    let interval;
    
    let trailSegments = [];
    let clickTimer = null;
    let wheelRotation = 0; // Track wheel position independently

    $: minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    $: seconds = (remaining % 60).toString().padStart(2, '0');

    function handleRotate(event) {
        if (status === 'RUNNING') return;
        
        const change = event.detail.direction * 10;
        let newDuration = duration + change;
        if (newDuration < 0) newDuration = 0;
        
        duration = newDuration;
        remaining = newDuration;
        
        if (status === 'DONE' || status === 'PAUSED') status = 'IDLE';
    }

    function handleInteraction() {
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            handleReset();
        } else {
            clickTimer = setTimeout(() => {
                toggleTimer();
                clickTimer = null;
            }, 250);
        }
    }

    function toggleTimer() {
        if (duration === 0) return;

        if (status === 'IDLE' || status === 'PAUSED') {
            startCountdown();
        } else if (status === 'RUNNING') {
            pauseCountdown();
        } else if (status === 'DONE') {
            status = 'IDLE';
        }
    }

    function handleReset() {
        pauseCountdown();
        status = 'IDLE';
        remaining = duration;
        trailSegments = [];
    }

    function startCountdown() {
        status = 'RUNNING';
        clearInterval(interval);
        
        interval = setInterval(() => {
            if (remaining > 0) {
                // Calculate how much to rotate (360deg / total seconds)
                const degreesPerSecond = duration > 0 ? 360 / duration : 0;
                wheelRotation += degreesPerSecond;
                
                // Add trail at current position
                trailSegments = [...trailSegments, {
                    angle: wheelRotation,
                    id: Date.now() + Math.random()
                }];
                
                if (trailSegments.length > 100) {
                    trailSegments = trailSegments.slice(-100);
                }
                
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
        trailSegments = [];
        
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
    <RotaryWheel 
        on:rotate={handleRotate} 
        locked={status === 'RUNNING'}
        rotation={status === 'RUNNING' ? wheelRotation : null}
        showTrail={status === 'RUNNING'}
        trailSegments={trailSegments}
    >
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
    .timer-wrapper {
        position: relative;
    }

    .timer-face {
        pointer-events: auto;
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

    .time-display.blink {
        animation: blinker 1s linear infinite;
        opacity: 0.7;
    }

    .time-display.alert {
        color: #ff3e00;
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