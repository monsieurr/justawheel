<!-- src/lib/Components/Contrast.svelte -->
<script>
    import RotaryWheel from './RotaryWheel.svelte';
    import { fade } from 'svelte/transition';

    // --- STATE ---
    // We stick to a "Zen" Slate Blue hue, but we only adjust Lightness
    const HUE = 210;
    const SAT = 20;

    let bgL = 10; // Background Lightness (Starts dark)
    let fgL = 90; // Foreground Lightness (Starts light)
    
    // 'BG' or 'FG' - determines what the wheel controls
    let activeLayer = 'BG'; 
    let clickTimer = null;

    // --- COMPUTED VALUES ---
    $: bgColor = `hsl(${HUE}, ${SAT}%, ${bgL}%)`;
    $: fgColor = `hsl(${HUE}, ${SAT}%, ${fgL}%)`;
    
    // Calculate Ratio
    $: ratio = calculateContrast(bgL, fgL);
    $: grade = getGrade(ratio);

    // --- HELPERS & MATH ---

    // Simplified Relative Luminance for HSL(h, s, L)
    // Since Hue/Sat are fixed/low, we can approximate or do full conversion. 
    // Let's do a robust enough approximation for "Zen" usage:
    function getLuminance(L) {
        // This is a simplified perceptual brightness curve
        // Real WCAG requires HSL->RGB->Linearize->Formula. 
        // For this tool, we will use the standard CSS variable logic.
        let val = L / 100;
        // Gamma correction approximation
        if (val <= 0.03928) {
            return val / 12.92;
        } else {
            return Math.pow((val + 0.055) / 1.055, 2.4);
        }
    }

    function calculateContrast(l1, l2) {
        const lum1 = getLuminance(l1);
        const lum2 = getLuminance(l2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    function getGrade(r) {
        if (r >= 7) return 'AAA';
        if (r >= 4.5) return 'AA';
        if (r >= 3) return 'AA+'; // Large text only
        return 'FAIL';
    }

    // --- HANDLERS ---

    function handleRotate(event) {
        const change = event.detail.direction * 2; // Move by 2% per tick
        
        if (activeLayer === 'BG') {
            bgL = clamp(bgL + change);
        } else {
            fgL = clamp(fgL + change);
        }
    }

    function clamp(val) {
        return Math.max(0, Math.min(100, val));
    }

    function handleInteraction() {
        if (clickTimer) {
            // DOUBLE CLICK -> RESET
            clearTimeout(clickTimer);
            clickTimer = null;
            bgL = 10;
            fgL = 90;
            activeLayer = 'BG';
        } else {
            // SINGLE CLICK -> TOGGLE LAYER
            clickTimer = setTimeout(() => {
                activeLayer = activeLayer === 'BG' ? 'FG' : 'BG';
                clickTimer = null;
            }, 250);
        }
    }
</script>

<div class="contrast-wrapper">
    <RotaryWheel on:rotate={handleRotate}>
        
        <!-- THE PREVIEW BUTTON -->
        <!-- Note: We apply pointer-events: auto directly here -->
        <button 
            class="contrast-face" 
            on:click={handleInteraction}
            style="background-color: {bgColor}; color: {fgColor}; box-shadow: 0 0 30px {bgColor};"
        >
            
            <!-- Ratio Display -->
            <div class="readout">
                <span class="ratio">{ratio.toFixed(2)}</span>
                <span class="grade" class:fail={grade === 'FAIL'}>{grade}</span>
            </div>

            <!-- Edit Mode Indicators -->
            <div class="indicators">
                <span class="label" class:active={activeLayer === 'FG'}>TEXT</span>
                <span class="divider">/</span>
                <span class="label" class:active={activeLayer === 'BG'}>BG</span>
            </div>

        </button>

    </RotaryWheel>
</div>

<style>
    .contrast-face {
        pointer-events: auto; /* CRITICAL FIX */
        width: 180px;
        height: 180px;
        border-radius: 50%;
        border: 4px solid rgba(255,255,255,0.1);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: all 0.2s ease;
    }

    .readout {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .ratio {
        font-size: 3rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        line-height: 1;
    }

    .grade {
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 2px;
        opacity: 0.8;
    }

    .grade.fail {
        text-decoration: line-through;
        opacity: 0.5;
    }

    .indicators {
        display: flex;
        gap: 8px;
        font-size: 0.7rem;
        letter-spacing: 1px;
        margin-top: 10px;
        background: rgba(0,0,0,0.2);
        padding: 5px 12px;
        border-radius: 12px;
    }

    .label {
        opacity: 0.3;
        transition: opacity 0.3s;
    }

    .label.active {
        opacity: 1;
        font-weight: bold;
        text-decoration: underline;
    }

    .divider { opacity: 0.2; }
</style>