<!-- src/lib/Components/SoundWheel.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import RotaryWheel from './RotaryWheel.svelte';
    import { fade } from 'svelte/transition';

    let audioContext;
    let analyser;
    let microphone;
    let dataArray;
    let animationId;
    
    let isActive = false;
    let intensity = 50;
    let averageFrequency = 0;
    let permissionDenied = false;
    let errorMsg = '';
    
    function handleRotate(event) {
        const change = event.detail.direction * 2;
        intensity = Math.max(0, Math.min(100, intensity + change));
    }
    
    async function toggleMicrophone() {
        if (isActive) {
            stopMicrophone();
        } else {
            await startMicrophone();
        }
    }
    
    async function startMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            
            isActive = true;
            permissionDenied = false;
            errorMsg = '';
            
            visualize();
            
        } catch (err) {
            console.error('Microphone access denied:', err);
            permissionDenied = true;
            errorMsg = 'Microphone access denied';
            isActive = false;
        }
    }
    
    function stopMicrophone() {
        isActive = false;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        averageFrequency = 0;
    }
    
    function visualize() {
        if (!isActive) return;
        
        animationId = requestAnimationFrame(visualize);
        
        analyser.getByteFrequencyData(dataArray);
        
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        
        averageFrequency = (avg / 255) * (intensity / 100);
    }
    
    onDestroy(() => {
        stopMicrophone();
    });
</script>

<div class="sound-wrapper">
    <RotaryWheel on:rotate={handleRotate}>
        
        <div class="visualizer-container">
            <div 
                class="gradient-cloud" 
                style="
                    opacity: {isActive ? 0.5 + averageFrequency * 0.5 : 0.2};
                    filter: blur({15 + averageFrequency * 30}px);
                "
            >
                <div class="cloud-layer layer-1" style="
                    background: radial-gradient(
                        ellipse at {40 + averageFrequency * 30}% {45 + averageFrequency * 25}%,
                        rgba(100, 150, 255, 0.6),
                        rgba(80, 120, 200, 0.4) 50%,
                        transparent 80%
                    );
                "></div>
                <div class="cloud-layer layer-2" style="
                    background: radial-gradient(
                        ellipse at {55 - averageFrequency * 20}% {50 + averageFrequency * 15}%,
                        rgba(120, 180, 255, 0.5),
                        rgba(90, 140, 220, 0.3) 50%,
                        transparent 80%
                    );
                "></div>
            </div>
        </div>
        
        <button class="sound-control" on:click={toggleMicrophone}>
            {#if isActive}
                <div class="status" in:fade>
                    <span class="intensity">{intensity}%</span>
                </div>
            {/if}
        </button>
        
    </RotaryWheel>
</div>

<style>
    .sound-wrapper {
        position: relative;
    }
    
    .visualizer-container {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 220px;
        height: 220px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        overflow: hidden;
        pointer-events: none;
        z-index: 1;
    }
    
    .gradient-cloud {
        position: relative;
        width: 100%;
        height: 100%;
        transition: opacity 0.2s ease-out, filter 0.2s ease-out;
    }
    
    .cloud-layer {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        mix-blend-mode: screen;
        transition: background 0.3s ease-out;
    }
    
    .layer-1 {
        animation: float1 10s ease-in-out infinite;
    }
    
    .layer-2 {
        animation: float2 14s ease-in-out infinite;
    }
    
    @keyframes float1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(15px, -12px) scale(1.1); }
    }
    
    @keyframes float2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-12px, 10px) scale(1.15); }
    }
    
    .sound-control {
        pointer-events: auto;
        background: none;
        border: none;
        cursor: pointer;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        z-index: 10;
        transition: transform 0.2s;
    }
    
    .sound-control:active {
        transform: scale(0.95);
    }
    
    .status {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    
    .label {
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 2px;
        opacity: 0.9;
    }
    
    .label.pulse {
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    .hint {
        font-size: 0.65rem;
        opacity: 0.4;
        letter-spacing: 1px;
    }
    
    .intensity {
        font-size: 0.75rem;
        font-family: monospace;
        opacity: 0.6;
        background: rgba(255, 62, 0, 0.2);
        padding: 4px 12px;
        border-radius: 12px;
        margin-top: 4px;
    }
    
    @keyframes pulse {
        0%, 100% { 
            opacity: 1;
        }
        50% { 
            opacity: 0.6;
        }
    }
</style>