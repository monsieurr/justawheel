<!-- src/lib/RotaryWheel.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { playClick, initAudio } from '../audio';

  // State variables
  let isDragging = false;
  let element;
  let previousAngle = 0;
  let totalRotation = 0;
  let lastClickRotation = 0; 

  const dispatch = createEventDispatcher();
  const CLICK_STEP_DEG = 15; 

  function getAngle(clientX, clientY) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX);
  }

  function handleStart(e) {
    initAudio(); // Wake up audio engine
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
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const currentAngle = getAngle(clientX, clientY);
    let delta = currentAngle - previousAngle;

    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    previousAngle = currentAngle;
    const degrees = delta * (180 / Math.PI);
    
    applyRotation(degrees);
  }

  // --- NEW FUNCTION: Handle Mouse Wheel ---
  function handleWheel(e) {
    // Prevent the actual page from scrolling while hovering the wheel
    e.preventDefault();
    initAudio(); 

    // Adjust sensitivity: divide deltaY to make it controllable
    // value is inverted because scrolling down usually means "next" (clockwise)
    const degrees = e.deltaY * 0.2; 
    
    applyRotation(degrees);
  }

  // Refactored logic to handle both Drag and Scroll inputs
  function applyRotation(degrees) {
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
    <!-- ADDED: on:wheel listener here -->
    <div 
        bind:this={element}
        class="wheel"
        on:mousedown={handleStart}
        on:touchstart|nonpassive={handleStart}
        on:wheel={handleWheel} 
        style="transform: rotate({totalRotation}deg)"
    >
        <div class="knob"></div>
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
        box-shadow:  20px 20px 60px #1a1a1a, 
                    -20px -20px 60px #333333;
        position: absolute;
        cursor: grab;
    }

    .wheel:active {
        cursor: grabbing;
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

    .center-content {
        z-index: 10;
        pointer-events: none;
        text-align: center;
    }
</style>