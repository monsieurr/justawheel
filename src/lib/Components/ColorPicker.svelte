<!-- src/lib/Components/ColorPicker.svelte -->
<script>
    import RotaryWheel from './RotaryWheel.svelte';
    import { fade } from 'svelte/transition';

    let hue = 0; 
    let saturation = 80;
    let lightness = 50;
    
    // 0 = HEX, 1 = RGB, 2 = HSL
    let formatMode = 0;
    let feedbackMsg = '';
    let clickTimer = null;

    // --- Format Converters ---
    
    // HEX
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

    // RGB
    function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
            m = l - c / 2,
            r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
        
        return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
    }

    // Reactivity
    $: hexVal = hslToHex(hue, saturation, lightness);
    $: rgbVal = hslToRgb(hue, saturation, lightness);
    $: hslVal = `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
    
    $: displayValue = formatMode === 0 ? hexVal : (formatMode === 1 ? rgbVal : hslVal);
    $: labelValue = formatMode === 0 ? 'HEX' : (formatMode === 1 ? 'RGB' : 'HSL');

    function handleRotate(event) {
        const change = event.detail.direction * 5;
        hue = (hue + change + 360) % 360;
    }

    function handleInteraction() {
        if (clickTimer) {
            // DOUBLE CLICK -> Change Format
            clearTimeout(clickTimer);
            clickTimer = null;
            formatMode = (formatMode + 1) % 3; // Cycle 0 -> 1 -> 2 -> 0
        } else {
            // SINGLE CLICK -> Copy
            clickTimer = setTimeout(() => {
                copyToClipboard();
                clickTimer = null;
            }, 250);
        }
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(displayValue);
            feedbackMsg = 'COPIED';
            setTimeout(() => feedbackMsg = '', 1500);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }
</script>

<div class="picker-container" style="--glow-color: {hslVal}">
    <RotaryWheel on:rotate={handleRotate}>
        <button class="color-display" on:click={handleInteraction}>
            <div class="swatch" style="background-color: {hslVal}"></div>
            <div class="info">
                {#if feedbackMsg}
                    <span class="label" in:fade>{feedbackMsg}</span>
                {:else}
                    <span class="value" in:fade>{displayValue}</span>
                    <span class="label">{labelValue}</span>
                {/if}
            </div>
        </button>
    </RotaryWheel>
</div>

<style>
    /* The container creates the ambient glow effect */
    .picker-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: background-color 0.5s ease;
    }

    /* We inject this glow into the global body via a trick or just use a big shadow here */
    /* For now, let's make the center button look like a gem */

    .color-display {
        pointer-events: auto;
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

    .color-display:active {
        transform: scale(0.95);
    }

    .swatch {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        box-shadow: 0 0 20px var(--glow-color);
        border: 2px solid rgba(255,255,255,0.1);
        transition: background-color 0.1s;
    }

    .info {
        display: flex;
        flex-direction: column;
        height: 40px; /* Fixed height to prevent layout shift */
    }

    .value {
        font-family: monospace;
        font-size: 1.2rem;
        letter-spacing: 1px;
    }

    .label {
        font-size: 0.7rem;
        opacity: 0.5;
        letter-spacing: 2px;
    }
    
    .picker-container { display: flex; flex-direction: column; align-items: center; }
    .color-display { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; color: rgba(255,255,255,0.9); }
    .swatch { width: 60px; height: 60px; border-radius: 50%; box-shadow: 0 0 20px var(--glow-color); border: 2px solid rgba(255,255,255,0.1); transition: background-color 0.1s; }
    .info { display: flex; flex-direction: column; height: 40px; }
    .value { font-family: monospace; font-size: 1.1rem; letter-spacing: 1px; }
    .label { font-size: 0.7rem; opacity: 0.5; letter-spacing: 2px; }
</style>