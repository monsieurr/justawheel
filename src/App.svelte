<!-- src/App.svelte -->
<script>
  import Timer from './lib/Components/Timer.svelte';
  import ColorPicker from './lib/Components/ColorPicker.svelte';
  import Clock from './lib/Components/Clock.svelte';
  import Tasks from './lib/Components/TaskOrb.svelte';
  import Contrast from './lib/Components/Contrast.svelte';
  import SoundWheel from './lib/Components/SoundWheel.svelte';
  import { initAudio } from './lib/audio';
  import { onMount } from 'svelte';
  
  // 0=Timer, 1=Color, 2=Clock, 3=Contrast, 4=Tasks, 5=Sound
  let activeTab = 0;
  
  // Initialize audio on first user interaction
  onMount(() => {
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
  });
</script>

<main class="app-shell">
  
  <div class="content">
    {#if activeTab === 0}
      <div class="feature-wrapper">
        <Timer />
      </div>
    {:else if activeTab === 1}
      <div class="feature-wrapper">
        <ColorPicker />
      </div>
    {:else if activeTab === 2}
      <div class="feature-wrapper">
        <Clock />
      </div>
    {:else if activeTab === 3}
      <div class="feature-wrapper">
        <Contrast />
      </div>
    {:else if activeTab === 4}
      <div class="feature-wrapper">
        <Tasks />
      </div>
    {:else if activeTab === 5}
      <div class="feature-wrapper">
        <SoundWheel />
      </div>
    {/if}
  </div>
  
  <nav class="dock">
    <button class:active={activeTab === 0} on:click={() => activeTab = 0}>Timer</button>
    <button class:active={activeTab === 1} on:click={() => activeTab = 1}>Color</button>
    <button class:active={activeTab === 2} on:click={() => activeTab = 2}>Clock</button>
    <button class:active={activeTab === 3} on:click={() => activeTab = 3}>Contrast</button>
    <button class:active={activeTab === 4} on:click={() => activeTab = 4}>Tasks</button>
    <button class:active={activeTab === 5} on:click={() => activeTab = 5}>Sound</button>
  </nav>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #1a1a1a;
    color: rgba(255, 255, 255, 0.87);
    font-family: Inter, system-ui, sans-serif;
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
    overscroll-behavior: none;
  }
  
  :global(html) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
  
  .app-shell {
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile */
    width: 100vw;
    max-width: 100vw;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    position: relative;
  }
  
  .content {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 100vw;
    overflow: hidden;
    position: relative;
  }
  
  .feature-wrapper {
    width: 100%;
    max-width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  
  .dock {
    margin: 0 auto 20px auto;
    background: rgba(40, 40, 40, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 30px;
    padding: 5px;
    display: flex;
    gap: 5px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 100;
    max-width: 90vw;
    overflow-x: auto;
    scrollbar-width: none;
  }
  
  .dock::-webkit-scrollbar {
    display: none;
  }
  
  .dock button {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.4);
    padding: 10px 20px;
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: 20px;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .dock button.active {
    background: rgba(255,255,255,0.1);
    color: white;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  @media (max-width: 768px) {
    .dock button {
      padding: 8px 16px;
      font-size: 0.8rem;
    }
  }
</style>