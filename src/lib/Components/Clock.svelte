<!-- src/lib/Components/Clock.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import RotaryWheel from './RotaryWheel.svelte';
    import { fade } from 'svelte/transition';

    let now = new Date();
    let offsetHours = 0;
    let interval;
    
    // Style State
    let isDigitalMode = false;
    let clickTimer = null;

    onMount(() => {
        interval = setInterval(() => { now = new Date(); }, 1000);
    });

    onDestroy(() => { clearInterval(interval); });

    $: displayTime = new Date(now.getTime() + (offsetHours * 60 * 60 * 1000));
    $: hours = displayTime.getHours().toString().padStart(2, '0');
    $: minutes = displayTime.getMinutes().toString().padStart(2, '0');
    $: seconds = displayTime.getSeconds().toString().padStart(2, '0');

    function handleRotate(event) {
        offsetHours += event.detail.direction;
    }

    function handleInteraction() {
        if (clickTimer) {
            // DOUBLE CLICK -> Toggle Style
            clearTimeout(clickTimer);
            clickTimer = null;
            isDigitalMode = !isDigitalMode;
        } else {
            // SINGLE CLICK -> Reset Time
            clickTimer = setTimeout(() => {
                offsetHours = 0;
                clickTimer = null;
            }, 250);
        }
    }
</script>

<div class="clock-wrapper">
    <RotaryWheel on:rotate={handleRotate}>
        
        <button class="clock-face" on:click={handleInteraction} class:digital={isDigitalMode}>
            
            <div class="time-group">
                <span class="hhmm">{hours}{isDigitalMode ? ':' : ' '}{minutes}</span>
                <span class="ss">{seconds}</span>
            </div>

            <div class="status">
                {#if offsetHours === 0}
                    <span class="local" in:fade>LOCAL</span>
                {:else}
                    <span class="offset" in:fade>{offsetHours > 0 ? '+' : ''}{offsetHours} HRS</span>
                {/if}
            </div>

        </button>

    </RotaryWheel>
</div>

<style>
    .clock-face {
        pointer-events: auto;
        background: none; border: none; cursor: pointer;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: rgba(255, 255, 255, 0.9);
        transition: all 0.3s ease;
    }

    .time-group { display: flex; align-items: baseline; gap: 5px; font-variant-numeric: tabular-nums; }
    
    /* Standard Style */
    .hhmm { font-size: 3rem; font-weight: 200; letter-spacing: -2px; }
    .ss { font-size: 1.2rem; opacity: 0.6; width: 1.8rem; text-align: left; }

    /* Digital Style Variant */
    .clock-face.digital .hhmm {
        font-family: 'Courier New', Courier, monospace;
        font-weight: 600;
        letter-spacing: 0px;
        text-shadow: 0 0 10px rgba(0, 255, 0, 0.4); /* Retro Green Glow */
        color: #aaffaa;
    }
    .clock-face.digital .ss {
        font-family: 'Courier New', Courier, monospace;
        color: #aaffaa;
    }

    .status { height: 20px; margin-top: 5px; font-size: 0.75rem; letter-spacing: 2px; font-weight: 600; }
    .local { color: #4CAF50; opacity: 0.8; }
    .offset { color: #FF9800; }
</style>