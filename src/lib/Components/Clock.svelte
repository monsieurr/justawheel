<!-- src/lib/Components/Clock.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import RotaryWheel from './RotaryWheel.svelte';
    import { fade } from 'svelte/transition';
    
    let now = new Date();
    let offsetHours = 0;
    let interval;
    
    let displayMode = 'DIGITAL';
    let clickTimer = null;
    
    onMount(() => {
        interval = setInterval(() => { now = new Date(); }, 1000);
    });
    
    onDestroy(() => { clearInterval(interval); });
    
    $: displayTime = new Date(now.getTime() + (offsetHours * 60 * 60 * 1000));
    $: hours = displayTime.getHours().toString().padStart(2, '0');
    $: minutes = displayTime.getMinutes().toString().padStart(2, '0');
    $: seconds = displayTime.getSeconds().toString().padStart(2, '0');
    
    $: hoursAngle = ((displayTime.getHours() % 12) + displayTime.getMinutes() / 60) * 30;
    $: minutesAngle = (displayTime.getMinutes() + displayTime.getSeconds() / 60) * 6;
    $: secondsAngle = displayTime.getSeconds() * 6;
    
    function handleRotate(event) {
        offsetHours += event.detail.direction;
    }
    
    function handleInteraction() {
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            
            if (displayMode === 'DIGITAL') displayMode = 'ANALOG';
            else if (displayMode === 'ANALOG') displayMode = 'MINIMAL';
            else displayMode = 'DIGITAL';
            
        } else {
            clickTimer = setTimeout(() => {
                offsetHours = 0;
                clickTimer = null;
            }, 250);
        }
    }
</script>

<div class="clock-wrapper">
    <RotaryWheel on:rotate={handleRotate}>
        
        <button class="clock-face" on:click={handleInteraction}>
            
            {#if displayMode === 'DIGITAL'}
                <div class="digital-display" in:fade>
                    <div class="time-group">
                        <span class="hhmm">{hours}:{minutes}</span>
                        <span class="ss">{seconds}</span>
                    </div>
                </div>
                
            {:else if displayMode === 'ANALOG'}
                <div class="analog-display" in:fade>
                    <div class="clock-numbers">
                        {#each [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as num, i}
                            <div 
                                class="number" 
                                style="transform: rotate({i * 30}deg) translateY(-110px) rotate(-{i * 30}deg)"
                            >
                                {num}
                            </div>
                        {/each}
                    </div>
                    
                    <div class="center-dot"></div>
                    <div class="needle hour-hand" style="transform: rotate({hoursAngle}deg)"></div>
                    <div class="needle minute-hand" style="transform: rotate({minutesAngle}deg)"></div>
                    <div class="needle second-hand" style="transform: rotate({secondsAngle}deg)"></div>
                </div>
                
            {:else}
                <div class="analog-display minimal" in:fade>
                    <div class="clock-ticks">
                        {#each Array(12) as _, i}
                            <div 
                                class="tick" 
                                class:major={i % 3 === 0}
                                style="transform: rotate({i * 30}deg) translateY(-125px)"
                            ></div>
                        {/each}
                    </div>
                    
                    <div class="center-dot"></div>
                    <div class="needle hour-hand" style="transform: rotate({hoursAngle}deg)"></div>
                    <div class="needle minute-hand" style="transform: rotate({minutesAngle}deg)"></div>
                    <div class="needle second-hand" style="transform: rotate({secondsAngle}deg)"></div>
                </div>
            {/if}
            
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
    .clock-wrapper {
        position: relative;
    }
    
    .clock-face {
        pointer-events: auto;
        background: none; 
        border: none; 
        cursor: pointer;
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        color: rgba(255, 255, 255, 0.9);
        transition: all 0.3s ease;
        position: relative;
        width: 100%;
        height: 100%;
    }
    
    .digital-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }
    
    .time-group { 
        display: flex; 
        align-items: baseline; 
        gap: 5px; 
        font-variant-numeric: tabular-nums; 
    }
    
    .hhmm { 
        font-size: 3rem; 
        font-weight: 200; 
        letter-spacing: -2px; 
    }
    
    .ss { 
        font-size: 1.2rem; 
        opacity: 0.6; 
        width: 1.8rem; 
        text-align: left; 
    }
    
    .analog-display {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 260px;
        height: 260px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .clock-numbers {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    
    .number {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 1.3rem;
        font-weight: 300;
        transform-origin: center;
        opacity: 0.6;
    }
    
    .clock-ticks {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    
    .tick {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 2px;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        transform-origin: center;
    }
    
    .tick.major {
        height: 15px;
        width: 3px;
        background: rgba(255, 255, 255, 0.6);
    }
    
    .center-dot {
        position: absolute;
        width: 12px;
        height: 12px;
        background: #ff3e00;
        border-radius: 50%;
        z-index: 10;
        box-shadow: 0 0 10px rgba(255, 62, 0, 0.5);
    }
    
    .needle {
        position: absolute;
        bottom: 50%;
        left: 50%;
        transform-origin: bottom center;
        border-radius: 2px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .hour-hand {
        width: 6px;
        height: 70px;
        background: rgba(255, 255, 255, 0.9);
        margin-left: -3px;
    }
    
    .minute-hand {
        width: 4px;
        height: 100px;
        background: rgba(255, 255, 255, 0.9);
        margin-left: -2px;
    }
    
    .second-hand {
        width: 2px;
        height: 110px;
        background: #ff3e00;
        margin-left: -1px;
        box-shadow: 0 0 5px rgba(255, 62, 0, 0.5);
    }
    
    .status { 
        position: absolute;
        bottom: -30px;
        height: 20px; 
        font-size: 0.75rem; 
        letter-spacing: 2px; 
        font-weight: 600; 
    }
    
    .local { 
        color: #4CAF50; 
        opacity: 0.8; 
    }
    
    .offset { 
        color: #FF9800; 
    }
</style>