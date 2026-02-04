<!-- src/lib/Components/TaskOrb.svelte -->
<script>
    import { onMount } from 'svelte';
    import RotaryWheel from './RotaryWheel.svelte';
    import { fly, scale, fade } from 'svelte/transition';
    import { elasticOut, cubicOut } from 'svelte/easing';
    import { playClick } from '../audio';

    let tasks = [];
    let focusedIndex = 0;
    let fallenOrbs = []; 
    
    let mode = 'VIEW'; 
    let newTaskText = '';
    let inputRef;

    let isHolding = false;
    let showMenu = false;
    let holdTimer = null;
    let menuSelection = null;
    let menuAngle = 0;
    
    let feedbackMsg = '';

    onMount(() => {
        const savedTasks = localStorage.getItem('zen-tasks-v3');
        const savedOrbs = localStorage.getItem('zen-orbs-v3');
        
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        } else {
            tasks = [
                { id: 1, text: 'Hold to open menu', color: '#FF5722' },
                { id: 2, text: 'Slide to Add/Copy', color: '#00BCD4' },
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

    function getRandomColor() {
        const hues = [0, 25, 45, 160, 190, 210, 260, 320];
        const hue = hues[Math.floor(Math.random() * hues.length)];
        return `hsl(${hue}, 75%, 60%)`;
    }

    async function copyAsMarkdown() {
        if (tasks.length === 0) return;
        
        const markdown = tasks.map(task => `- [ ] ${task.text}`).join('\n');
        
        try {
            await navigator.clipboard.writeText(markdown);
            showFeedback('COPIED AS MARKDOWN');
        } catch (err) {
            console.error('Failed to copy', err);
            showFeedback('COPY FAILED');
        }
    }
    
    function exportData() {
        const data = {
            tasks: tasks,
            completedOrbs: fallenOrbs,
            exportDate: new Date().toISOString()
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        downloadFile(jsonStr, 'zen-tasks-export.json', 'application/json');
        showFeedback('EXPORTED');
    }
    
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function showFeedback(msg) {
        feedbackMsg = msg;
        setTimeout(() => feedbackMsg = '', 2000);
    }

    function handleRotate(event) {
        if (mode === 'INPUT' || isHolding) return;
        if (tasks.length === 0) return;

        const direction = event.detail.direction;
        let newIndex = focusedIndex + direction;
        
        if (newIndex >= tasks.length) newIndex = 0;
        if (newIndex < 0) newIndex = tasks.length - 1;
        
        focusedIndex = newIndex;
    }

    function startHold(e) {
        if (mode === 'INPUT') return;
        
        isHolding = true;
        menuSelection = null;

        holdTimer = setTimeout(() => {
            showMenu = true;
            if (navigator.vibrate) navigator.vibrate(20);
        }, 300);

        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('touchmove', handleDrag, { passive: false });
        window.addEventListener('mouseup', endHold);
        window.addEventListener('touchend', endHold);
    }

    function handleDrag(e) {
        if (!showMenu) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const rect = document.querySelector('.task-stage')?.getBoundingClientRect();
        if (!rect) return;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(clientY - centerY, clientX - centerX);
        menuAngle = angle * (180 / Math.PI);
        
        if (menuAngle > -135 && menuAngle < -45) {
            menuSelection = 'ADD';
        } else if (menuAngle > -45 && menuAngle < 45) {
            menuSelection = 'COPY';
        } else if (menuAngle > 45 && menuAngle < 135) {
            menuSelection = 'CLEAR';
        } else {
            menuSelection = 'EXPORT';
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
            executeRadialAction();
            showMenu = false;
        } else {
            completeTask();
        }
    }

    function executeRadialAction() {
        if (menuSelection === 'ADD') {
            mode = 'INPUT';
            setTimeout(() => inputRef?.focus(), 50);
        } else if (menuSelection === 'CLEAR') {
            if (fallenOrbs.length > 0) {
                fallenOrbs = [];
                playClick();
                if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
            }
        } else if (menuSelection === 'COPY') {
            copyAsMarkdown();
        } else if (menuSelection === 'EXPORT') {
            exportData();
        }
    }

    function completeTask() {
        if (tasks.length === 0 || mode === 'INPUT') return;

        playClick();
        const taskToComplete = tasks[focusedIndex];

        const randomX = Math.random() * 60 - 30; 
        const newOrb = {
            id: Date.now(),
            left: 50 + randomX,
            color: taskToComplete.color || '#fff'
        };
        fallenOrbs = [...fallenOrbs, newOrb];

        const oldTasks = [...tasks];
        oldTasks.splice(focusedIndex, 1);
        tasks = oldTasks;

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
            color: getRandomColor()
        };

        tasks = [...tasks, newTask];
        newTaskText = '';
        mode = 'VIEW';
        focusedIndex = tasks.length - 1;
        playClick();
    }
</script>

<div class="orb-system">
    
    {#if feedbackMsg}
        <div class="feedback-toast" transition:fade>
            {feedbackMsg}
        </div>
    {/if}
    
    <RotaryWheel on:rotate={handleRotate}>
        
        <div class="gravity-well">
            {#each fallenOrbs as orb (orb.id)}
                <div 
                    class="orb"
                    style="left: {orb.left}%; background: {orb.color}; box-shadow: 0 0 10px {orb.color};"
                    in:fly={{ y: -200, duration: 600, easing: elasticOut }}
                ></div>
            {/each}
        </div>

        <button 
            class="task-stage" 
            class:holding={showMenu}
            on:mousedown={startHold}
            on:touchstart|nonpassive={startHold}
        >
            {#if mode === 'VIEW'}
                {#if tasks.length > 0}
                    {#key tasks[focusedIndex].id}
                        <div class="task-content" in:fly={{ y: 20, duration: 200 }} out:fade>
                            
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

            {#if showMenu}
                <div class="radial-overlay" transition:scale={{duration: 200, easing: cubicOut}}>
                    
                    <div class="sector sector-top" class:active={menuSelection === 'ADD'}>
                        <span class="icon">+</span>
                        <span class="label">ADD</span>
                    </div>

                    <div class="sector sector-right" class:active={menuSelection === 'COPY'}>
                        <span class="icon">MD</span>
                        <span class="label">COPY</span>
                    </div>

                    <div class="sector sector-bottom" class:active={menuSelection === 'CLEAR'}>
                        <span class="icon">×</span>
                        <span class="label">CLEAR</span>
                    </div>
                    
                    <div class="sector sector-left" class:active={menuSelection === 'EXPORT'}>
                        <span class="icon">JSON</span>
                        <span class="label">EXPORT</span>
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
        position: relative;
    }
    
    .feedback-toast {
        position: absolute;
        top: -60px;
        background: rgba(255, 62, 0, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 2px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
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
        pointer-events: auto;
        z-index: 10;
        background: none; border: none;
        width: 240px; height: 240px;
        position: relative;
        display: flex; align-items: center; justify-content: center;
        color: white; cursor: pointer;
        outline: none;
        transition: transform 0.2s;
        user-select: none; 
        -webkit-user-select: none;
    }

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

    .input-form input {
        background: transparent; border: none; border-bottom: 2px solid #ff3e00;
        color: white; text-align: center; font-size: 1.3rem; padding: 5px;
        outline: none; width: 200px;
    }
    .hidden-submit { display: none; }

    .radial-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        border-radius: 50%;
        overflow: hidden; 
        background: rgba(0,0,0,0.6); 
        backdrop-filter: blur(5px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 0; 
        box-sizing: border-box;
    }

    .sector {
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        transition: all 0.2s ease;
        opacity: 0.5;
        gap: 6px;
        width: 100%;
        height: 50%;
        position: relative;
    }

    .sector.active {
        opacity: 1;
        background: rgba(255, 255, 255, 0.05); 
        text-shadow: 0 0 10px rgba(255,255,255,0.8);
    }

    .sector-top {
        border-top-left-radius: 120px;
        border-top-right-radius: 120px;
        padding-bottom: 20px;
    }
    
    .sector-top.active {
        background: radial-gradient(circle at top, rgba(255,62,0,0.4), transparent 70%);
    }

    .sector-right {
        position: absolute;
        right: 0;
        top: 50%;
        width: 50%;
        height: 50%;
        border-bottom-right-radius: 120px;
        padding-left: 15px;
    }
    
    .sector-right.active {
        background: radial-gradient(circle at right, rgba(0,188,212,0.4), transparent 70%);
    }

    .sector-bottom {
        border-bottom-left-radius: 120px;
        border-bottom-right-radius: 120px;
        padding-top: 20px;
    }

    .sector-bottom.active {
        background: radial-gradient(circle at bottom, rgba(255,62,0,0.4), transparent 70%);
    }
    
    .sector-left {
        position: absolute;
        left: 0;
        top: 50%;
        width: 50%;
        height: 50%;
        border-bottom-left-radius: 120px;
        padding-right: 15px;
    }
    
    .sector-left.active {
        background: radial-gradient(circle at left, rgba(76,175,80,0.4), transparent 70%);
    }

    .icon { font-size: 1.8rem; line-height: 1; font-weight: 300; }
    .label { font-size: 0.6rem; letter-spacing: 1.5px; font-weight: 600; }
</style>