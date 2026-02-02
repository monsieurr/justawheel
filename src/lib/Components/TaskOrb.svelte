<!-- src/lib/Components/TaskOrb.svelte -->
<script>
    import { onMount } from 'svelte';
    import RotaryWheel from './RotaryWheel.svelte';
    import { fly, scale, fade } from 'svelte/transition';
    import { elasticOut, cubicOut } from 'svelte/easing';
    import { playClick } from '../audio';

    // --- STATE ---
    let tasks = [];
    let focusedIndex = 0;
    let fallenOrbs = []; 
    
    // Modes: 'VIEW', 'INPUT', 'MENU'
    let mode = 'VIEW'; 
    let newTaskText = '';
    let inputRef;

    // Radial Menu State
    let isHolding = false;
    let showMenu = false;
    let holdTimer = null;
    let menuSelection = null; // 'ADD', 'CLEAR', null
    let menuAngle = 0; // For visual feedback

    // --- PERSISTENCE & INIT ---
    onMount(() => {
        const savedTasks = localStorage.getItem('zen-tasks-v3');
        const savedOrbs = localStorage.getItem('zen-orbs-v3');
        
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        } else {
            // Default tasks with pre-assigned colors
            tasks = [
                { id: 1, text: 'Hold to open menu', color: '#FF5722' },
                { id: 2, text: 'Slide UP to Add', color: '#00BCD4' },
                { id: 3, text: 'Tap to Complete', color: '#8BC34A' }
            ];
        }

        if (savedOrbs) fallenOrbs = JSON.parse(savedOrbs);
    });

    $: {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('zen-tasks-v3', JSON.stringify(tasks));
            localStorage.setItem('zen-orbs-v3', JSON.stringify(fallenOrbs));
        }
    }

    // --- COLOR GENERATOR ---
    // Generates a consistent nice color based on randomness
    function getRandomColor() {
        const hues = [0, 25, 45, 160, 190, 210, 260, 320]; // Zen Palette
        const hue = hues[Math.floor(Math.random() * hues.length)];
        return `hsl(${hue}, 75%, 60%)`;
    }

    // --- WHEEL NAVIGATION ---
    function handleRotate(event) {
        if (mode === 'INPUT' || isHolding) return; // Lock wheel when typing or using menu
        if (tasks.length === 0) return;

        const direction = event.detail.direction;
        let newIndex = focusedIndex + direction;
        
        // Wrap logic
        if (newIndex >= tasks.length) newIndex = 0;
        if (newIndex < 0) newIndex = tasks.length - 1;
        
        focusedIndex = newIndex;
    }

    // --- RADIAL MENU LOGIC (Weapon Wheel) ---

    function startHold(e) {
        if (mode === 'INPUT') return;
        
        isHolding = true;
        menuSelection = null;

        // Wait 300ms to trigger menu. If released before, it's a click.
        holdTimer = setTimeout(() => {
            showMenu = true;
            if (navigator.vibrate) navigator.vibrate(20); // Haptic feedback
        }, 300);

        // Add global listeners to track drag even outside the button
        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('touchmove', handleDrag, { passive: false });
        window.addEventListener('mouseup', endHold);
        window.addEventListener('touchend', endHold);
    }

    function handleDrag(e) {
        if (!showMenu) return;
        e.preventDefault(); // Stop scrolling

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Calculate angle relative to center of screen (simple approximation)
        // Ideally we use the button rect, but center of screen is usually safe for this layout
        const rect = document.querySelector('.task-stage')?.getBoundingClientRect();
        if (!rect) return;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Atan2 returns -PI to PI. -PI/2 is UP.
        const angle = Math.atan2(clientY - centerY, clientX - centerX);
        menuAngle = angle * (180 / Math.PI); // Degrees

        // Logic for selection zones
        // UP (-90deg +/- 45) -> ADD
        // DOWN (90deg +/- 45) -> CLEAR
        
        if (menuAngle > -135 && menuAngle < -45) {
            menuSelection = 'ADD';
        } else if (menuAngle > 45 && menuAngle < 135) {
            menuSelection = 'CLEAR';
        } else {
            menuSelection = null;
        }
    }

    function endHold() {
        clearTimeout(holdTimer);
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('mouseup', endHold);
        window.removeEventListener('touchend', endHold);

        isHolding = false;

        if (showMenu) {
            // -- MENU ACTION --
            executeRadialAction();
            showMenu = false; // Close menu
        } else {
            // -- CLICK ACTION (Completed Task) --
            // Only if we didn't drag/hold long enough
            completeTask();
        }
    }

    function executeRadialAction() {
        if (menuSelection === 'ADD') {
            mode = 'INPUT';
            setTimeout(() => inputRef?.focus(), 50);
        } else if (menuSelection === 'CLEAR') {
            // Clear orbs
            if (fallenOrbs.length > 0) {
                fallenOrbs = [];
                playClick();
                if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
            }
        }
    }

    // --- TASK LOGIC ---

    function completeTask() {
        if (tasks.length === 0 || mode === 'INPUT') return;

        playClick();
        const taskToComplete = tasks[focusedIndex];

        // 1. Add to pile (Visual Physics)
        const randomX = Math.random() * 60 - 30; 
        const newOrb = {
            id: Date.now(),
            left: 50 + randomX,
            color: taskToComplete.color || '#fff' // Use the task's specific color
        };
        fallenOrbs = [...fallenOrbs, newOrb];

        // 2. Remove from list
        const oldTasks = [...tasks];
        oldTasks.splice(focusedIndex, 1);
        tasks = oldTasks;

        // Reset Index
        if (focusedIndex >= tasks.length) focusedIndex = Math.max(0, tasks.length - 1);
    }

    function submitNewTask() {
        if (!newTaskText.trim()) {
            mode = 'VIEW';
            return;
        }

        const newTask = {
            id: Date.now(),
            text: newTaskText,
            color: getRandomColor() // Assign color on creation
        };

        tasks = [...tasks, newTask];
        newTaskText = '';
        mode = 'VIEW';
        focusedIndex = tasks.length - 1;
        playClick();
    }
</script>

<div class="orb-system">
    
    <RotaryWheel on:rotate={handleRotate}>
        
        <!-- LAYER 0: The Gravity Well (Orbs) -->
        <div class="gravity-well">
            {#each fallenOrbs as orb (orb.id)}
                <div 
                    class="orb"
                    style="left: {orb.left}%; background: {orb.color}; box-shadow: 0 0 10px {orb.color};"
                    in:fly={{ y: -200, duration: 600, easing: elasticOut }}
                ></div>
            {/each}
        </div>

        <!-- LAYER 1: The Interactive Stage -->
        <button 
            class="task-stage" 
            class:holding={showMenu}
            on:mousedown={startHold}
            on:touchstart|nonpassive={startHold}
        >
            <!-- A. VIEW MODE -->
            {#if mode === 'VIEW'}
                {#if tasks.length > 0}
                    {#key tasks[focusedIndex].id}
                        <div class="task-content" in:fly={{ y: 20, duration: 200 }} out:fade>
                            
                            <!-- The Color Indicator -->
                            <div 
                                class="task-dot" 
                                style="background-color: {tasks[focusedIndex].color}; box-shadow: 0 0 15px {tasks[focusedIndex].color};"
                            ></div>
                            
                            <p class="task-text">{tasks[focusedIndex].text}</p>
                            
                            <span class="index-indicator">{focusedIndex + 1} / {tasks.length}</span>
                        </div>
                    {/key}
                {:else}
                    <div class="empty-state">
                        <p>ZEN MODE</p>
                        <span>Hold to Add Task</span>
                    </div>
                {/if}
            
            <!-- B. INPUT MODE -->
            {:else if mode === 'INPUT'}
                <form on:submit|preventDefault={submitNewTask} class="input-form" in:scale>
                    <input 
                        bind:this={inputRef}
                        bind:value={newTaskText}
                        placeholder="What needs doing?"
                        on:blur={() => mode = 'VIEW'} 
                    />
                    <button type="submit" class="hidden-submit"></button>
                </form>
            {/if}

            <!-- C. RADIAL MENU OVERLAY (Visible on Hold) -->
            {#if showMenu}
                <div class="radial-overlay" transition:scale={{duration: 200, easing: cubicOut}}>
                    
                    <!-- TOP SECTOR: ADD -->
                    <div class="sector sector-top" class:active={menuSelection === 'ADD'}>
                        <span class="icon">+</span>
                        <span class="label">ADD TASK</span>
                    </div>

                    <!-- BOTTOM SECTOR: CLEAR -->
                    <div class="sector sector-bottom" class:active={menuSelection === 'CLEAR'}>
                        <span class="icon">×</span>
                        <span class="label">CLEAR ORBS</span>
                    </div>

                </div>
            {/if}

        </button>

    </RotaryWheel>

</div>

<style>
    .orb-system {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .gravity-well {
        position: absolute;
        bottom: 10px; left: 0; width: 100%; height: 120px;
        pointer-events: none; overflow: hidden;
        border-bottom-left-radius: 150px; border-bottom-right-radius: 150px;
        z-index: 0;
    }

    .orb {
        position: absolute; bottom: 10px; width: 18px; height: 18px;
        border-radius: 50%; transform: translateX(-50%);
    }

    .task-stage {
        pointer-events: auto; /* Vital for clicks */
        z-index: 10;
        background: none; border: none;
        width: 240px; height: 240px;
        position: relative;
        display: flex; align-items: center; justify-content: center;
        color: white; cursor: pointer;
        outline: none;
        transition: transform 0.2s;
        /* Prevent text selection during hold */
        user-select: none; 
        -webkit-user-select: none;
    }

    /* Shrink slightly when holding to indicate pressure */
    .task-stage.holding {
        transform: scale(0.95);
    }

    .task-content {
        display: flex; flex-direction: column; align-items: center; gap: 15px;
        width: 100%; pointer-events: none;
    }

    .task-dot {
        width: 12px; height: 12px; border-radius: 50%;
    }

    .task-text {
        font-size: 1.4rem; font-weight: 300; text-align: center; margin: 0;
        line-height: 1.3; max-width: 80%;
    }

    .index-indicator { font-size: 0.7rem; opacity: 0.4; letter-spacing: 2px; }

    .empty-state { opacity: 0.5; display: flex; flex-direction: column; align-items: center; gap: 5px; }

    /* --- INPUT --- */
    .input-form input {
        background: transparent; border: none; border-bottom: 2px solid #ff3e00;
        color: white; text-align: center; font-size: 1.3rem; padding: 5px;
        outline: none; width: 200px;
    }
    .hidden-submit { display: none; }

    /* --- RADIAL MENU --- */
    .radial-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        border-radius: 50%;
        /* Ensure nothing spills out of the circle */
        overflow: hidden; 
        background: rgba(0,0,0,0.6); 
        backdrop-filter: blur(5px);
        display: flex; flex-direction: column; justify-content: space-between;
        align-items: center;
        /* Remove padding to let sectors touch edges */
        padding: 0; 
        box-sizing: border-box;
    }

    .sector {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; 
        /* Fill exactly half the circle height */
        height: 50%; 
        transition: all 0.2s ease;
        opacity: 0.5;
        gap: 10px;
    }

    .sector.active {
        opacity: 1;
        /* Remove scale to prevent boxiness, we use color instead */
        background: rgba(255, 255, 255, 0.05); 
        text-shadow: 0 0 10px rgba(255,255,255,0.8);
    }

    /* TOP SECTOR: Rounded Top */
    .sector-top {
        border-top-left-radius: 150px;
        border-top-right-radius: 150px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    /* REPLACED THE ORANGE BORDER WITH A GRADIENT GLOW */
    .sector-top.active {
        background: radial-gradient(circle at top, rgba(255,62,0,0.4), transparent 70%);
        color: white;
    }

    /* BOTTOM SECTOR: Rounded Bottom */
    .sector-bottom {
        border-bottom-left-radius: 150px;
        border-bottom-right-radius: 150px;
        border-top: 1px solid rgba(255,255,255,0.1);
    }

    .sector-bottom.active {
        background: radial-gradient(circle at bottom, rgba(255,62,0,0.4), transparent 70%);
        color: white;
    }

    .icon { font-size: 2rem; font-weight: 200; line-height: 1; }
    .label { font-size: 0.6rem; letter-spacing: 2px; font-weight: 700; }

</style>