<!-- src/lib/RotaryWheel.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { playClick } from '../audio';

  export let locked = false;
  export let rotation = null; // External rotation control (for timer)
  export let showTrail = false;
  export let trailSegments = [];

  let isDragging = false;
  let element;
  let previousAngle = 0;
  let totalRotation = 0;
  let lastClickRotation = 0;

  const dispatch = createEventDispatcher();
  const CLICK_STEP_DEG = 15;

  // Use external rotation if provided, otherwise use internal
  $: displayRotation = rotation !== null ? rotation : totalRotation;

  function getAngle(clientX, clientY) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX);
  }

  function handleStart(e) {
    if (locked) return;
    
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    previousAngle = getAngle(clientX, clientY);
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
  }

  function handleMove(e) {
    if (!isDragging || locked) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const currentAngle = getAngle(clientX, clientY);
    
    let delta = currentAngle - previousAngle;

    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    previousAngle = currentAngle;
    
    const degrees = delta * (180 / Math.PI);
    totalRotation += degrees;

    if (Math.abs(totalRotation - lastClickRotation) >= CLICK_STEP_DEG) {
        const direction = degrees > 0 ? 1 : -1;
        
        playClick();
        if (navigator.vibrate) navigator.vibrate(5);
        
        lastClickRotation = totalRotation;
        
        dispatch('rotate', { direction });
    }
  }

  function handleEnd() {
    isDragging = false;
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleEnd);
  }
</script>

<div class="wheel-wrapper">
    <div 
        bind:this={element}
        class="wheel"
        class:locked={locked}
        on:mousedown={handleStart}
        on:touchstart|nonpassive={handleStart}
        style="transform: rotate({displayRotation}deg)"
    >
        <!-- The main knob -->
        <div class="knob"></div>
        
        <!-- Trail dots (only visible when showTrail is true) -->
        {#if showTrail}
            {#each trailSegments as segment (segment.id)}
                <div 
                    class="trail-knob" 
                    style="transform: rotate({segment.angle - displayRotation}deg) translateY(-142.5px);"
                ></div>
            {/each}
        {/if}
    </div>
    
    <div class="center-content">
        <slot></slot>
    </div>
</div>

<style>
    .wheel-wrapper {
        position: relative;
        width: 300px;
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wheel {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(145deg, #2a2a2a, #1f1f1f);
        box-shadow: 20px 20px 60px #1a1a1a, 
                    -20px -20px 60px #333333;
        position: absolute;
        cursor: grab;
        transition: opacity 0.3s;
    }

    .wheel:active {
        cursor: grabbing;
    }
    
    .wheel.locked {
        cursor: not-allowed;
        opacity: 0.6;
    }

    .knob {
        position: absolute;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        width: 15px;
        height: 15px;
        background-color: #ff3e00;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255, 62, 0, 0.5);
    }

    .trail-knob {
        position: absolute;
        top: 50%;
        left: 50%;
        margin-left: -4px;
        margin-top: -4px;
        width: 8px;
        height: 8px;
        background-color: rgba(255, 62, 0, 0.4);
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(255, 62, 0, 0.3);
        animation: fadeTrail 3s ease-out forwards;
    }

    @keyframes fadeTrail {
        0% { opacity: 1; }
        100% { opacity: 0.1; }
    }

    .center-content {
        z-index: 10;
        pointer-events: none;
        text-align: center;
    }
</style>