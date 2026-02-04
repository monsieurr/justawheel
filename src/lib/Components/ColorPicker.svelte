<!-- src/lib/Components/ColorPicker.svelte -->
<script>
    import RotaryWheel from './RotaryWheel.svelte';
    import { fade } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';

    let colorMode = 'HSL';
    
    let hue = 0; 
    let saturation = 80;
    let lightness = 50;
    
    let r = 255;
    let g = 0;
    let b = 0;
    
    let rgbChannel = 'R';
    
    let feedbackMsg = '';
    let clickTimer = null;
    
    let isShaking = false;
    let shakeDetectionActive = false;

    function hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
            m = l - c / 2,
            rCalc = 0, gCalc = 0, bCalc = 0;

        if (0 <= h && h < 60) { rCalc = c; gCalc = x; bCalc = 0; }
        else if (60 <= h && h < 120) { rCalc = x; gCalc = c; bCalc = 0; }
        else if (120 <= h && h < 180) { rCalc = 0; gCalc = c; bCalc = x; }
        else if (180 <= h && h < 240) { rCalc = 0; gCalc = x; bCalc = c; }
        else if (240 <= h && h < 300) { rCalc = x; gCalc = 0; bCalc = c; }
        else if (300 <= h && h < 360) { rCalc = c; gCalc = 0; bCalc = x; }
        
        return {
            r: Math.round((rCalc + m) * 255),
            g: Math.round((gCalc + m) * 255),
            b: Math.round((bCalc + m) * 255)
        };
    }
    
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function syncRgbToHsl() {
        const hsl = rgbToHsl(r, g, b);
        hue = hsl.h;
        saturation = hsl.s;
        lightness = hsl.l;
    }
    
    function syncHslToRgb() {
        const rgb = hslToRgb(hue, saturation, lightness);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
    }

    $: if (colorMode === 'HSL') {
        syncHslToRgb();
    } else {
        syncRgbToHsl();
    }
    
    $: hexVal = hslToHex(hue, saturation, lightness);
    $: displayColor = `rgb(${r}, ${g}, ${b})`;
    $: displayValue = colorMode === 'HSL' 
        ? `H:${Math.round(hue)}° S:${saturation}% L:${lightness}%`
        : `R:${r} G:${g} B:${b}`;

    function handleRotate(event) {
        const change = event.detail.direction;
        
        if (colorMode === 'HSL') {
            hue = (hue + change * 5 + 360) % 360;
        } else {
            const step = 5;
            if (rgbChannel === 'R') {
                r = Math.max(0, Math.min(255, r + change * step));
            } else if (rgbChannel === 'G') {
                g = Math.max(0, Math.min(255, g + change * step));
            } else {
                b = Math.max(0, Math.min(255, b + change * step));
            }
        }
    }

    function handleSwatchClick(e) {
        // Prevent the button's click from firing
        e.stopPropagation();
        
        if (clickTimer) {
            // Double click - randomize
            clearTimeout(clickTimer);
            clickTimer = null;
            randomizeColor();
        } else {
            // Single click - copy HEX
            clickTimer = setTimeout(() => {
                copyToClipboard();
                clickTimer = null;
            }, 250);
        }
    }

    function handleDisplayClick() {
        // Cycle RGB channel in RGB mode
        if (colorMode === 'RGB') {
            if (rgbChannel === 'R') rgbChannel = 'G';
            else if (rgbChannel === 'G') rgbChannel = 'B';
            else rgbChannel = 'R';
        }
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(hexVal);
            feedbackMsg = 'COPIED';
            setTimeout(() => feedbackMsg = '', 1500);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }
    
    function toggleColorMode() {
        colorMode = colorMode === 'HSL' ? 'RGB' : 'HSL';
        if (colorMode === 'RGB') {
            rgbChannel = 'R';
        }
    }
    
    function randomizeColor() {
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
        syncRgbToHsl();
        
        isShaking = true;
        setTimeout(() => isShaking = false, 300);
    }
    
    function setupShakeDetection() {
        if (typeof window === 'undefined' || !window.DeviceMotionEvent) return;
        
        let lastX = 0, lastY = 0, lastZ = 0;
        let shakeThreshold = 20;
        
        function handleMotion(event) {
            if (!shakeDetectionActive) return;
            
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;
            
            const deltaX = Math.abs(acc.x - lastX);
            const deltaY = Math.abs(acc.y - lastY);
            const deltaZ = Math.abs(acc.z - lastZ);
            
            if (deltaX > shakeThreshold || deltaY > shakeThreshold || deltaZ > shakeThreshold) {
                randomizeColor();
            }
            
            lastX = acc.x;
            lastY = acc.y;
            lastZ = acc.z;
        }
        
        window.addEventListener('devicemotion', handleMotion);
        
        return () => window.removeEventListener('devicemotion', handleMotion);
    }
    
    let cleanupShake;
    
    onMount(() => {
        shakeDetectionActive = true;
        cleanupShake = setupShakeDetection();
    });
    
    onDestroy(() => {
        shakeDetectionActive = false;
        if (cleanupShake) cleanupShake();
    });
</script>

<div class="picker-container" style="--glow-color: {displayColor}">
    
    <RotaryWheel on:rotate={handleRotate}>
        <div class="color-content">
            <button 
                class="color-display" 
                class:shaking={isShaking}
                on:click={handleDisplayClick}
            >
                <div 
                    class="swatch" 
                    style="background-color: {displayColor}"
                    on:click={handleSwatchClick}
                ></div>
                
                <div class="info">
                    {#if feedbackMsg}
                        <span class="feedback" in:fade>{feedbackMsg}</span>
                    {:else}
                        <span class="hex-value" in:fade>{hexVal}</span>
                        <span class="color-values" in:fade>{displayValue}</span>
                    {/if}
                </div>
                
                {#if colorMode === 'RGB'}
                    <div class="channel-indicator" in:fade>
                        <span class:active={rgbChannel === 'R'}>R</span>
                        <span class:active={rgbChannel === 'G'}>G</span>
                        <span class:active={rgbChannel === 'B'}>B</span>
                    </div>
                {/if}
            </button>
            
            <button class="mode-switch" on:click={toggleColorMode}>
                {colorMode}
            </button>
        </div>
    </RotaryWheel>
</div>

<style>
    .picker-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        transition: background-color 0.5s ease;
    }
    
    .color-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
    }

    .color-display {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: rgba(255, 255, 255, 0.9);
        transition: transform 0.1s;
    }
    
    .color-display.shaking {
        animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
    }

    .swatch {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        box-shadow: 0 0 20px var(--glow-color);
        border: 2px solid rgba(255,255,255,0.1);
        transition: background-color 0.1s;
        cursor: pointer;
    }

    .info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-height: 50px;
    }

    .hex-value {
        font-family: monospace;
        font-size: 1.2rem;
        letter-spacing: 2px;
        font-weight: 500;
    }

    .color-values {
        font-family: monospace;
        font-size: 0.75rem;
        opacity: 0.6;
        letter-spacing: 1px;
    }
    
    .feedback {
        font-size: 0.9rem;
        opacity: 0.9;
        letter-spacing: 2px;
        font-weight: 600;
    }
    
    .channel-indicator {
        display: flex;
        gap: 15px;
        font-size: 0.8rem;
        font-family: monospace;
        margin-top: 5px;
    }
    
    .channel-indicator span {
        opacity: 0.3;
        transition: all 0.3s;
    }
    
    .channel-indicator span.active {
        opacity: 1;
        color: #ff3e00;
        font-weight: bold;
        text-shadow: 0 0 8px rgba(255, 62, 0, 0.5);
    }
    
    .mode-switch {
        background: rgba(40, 40, 40, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.6);
        padding: 4px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 1px;
        transition: all 0.3s;
    }
    
    .mode-switch:hover {
        background: rgba(255, 62, 0, 0.2);
        color: white;
    }
    
    @keyframes shake {
        10%, 90% { transform: translate3d(-2px, 0, 0) rotate(-2deg); }
        20%, 80% { transform: translate3d(2px, 0, 0) rotate(2deg); }
        30%, 50%, 70% { transform: translate3d(-3px, 0, 0) rotate(-3deg); }
        40%, 60% { transform: translate3d(3px, 0, 0) rotate(3deg); }
    }
</style>