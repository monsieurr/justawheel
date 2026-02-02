<!-- src/App.svelte -->
<script>
import RotaryWheel from './lib/Components/RotaryWheel.svelte'; 
  import Timer from './lib/Components/Timer.svelte';
  import ColorPicker from './lib/Components/ColorPicker.svelte';
  import Clock from './lib/Components/Clock.svelte';
  import Tasks from './lib/Components/TaskOrb.svelte';
  import Contrast from './lib/Components/Contrast.svelte';

  
  // 0=Orbit, 1=Timer, 2=Color, 3=Clock, 4=Contrast
  let activeTab = 0;
</script>

<main class="app-shell">
  
  <div class="content">
    {#if activeTab === 0}
      <!-- TIMER COMPONENT -->
      <div class="feature-wrapper">
        <Timer />
      </div>

    {:else if activeTab === 1}
      <!-- COLOR -->
      <div class="feature-wrapper">
        <ColorPicker />
      </div>

    {:else if activeTab === 2}
      <!-- CLOCK -->
      <div class="feature-wrapper">
        <Clock />
      </div>

    {:else if activeTab === 3}
      <div class="feature-wrapper"><Clock /></div>

    {:else if activeTab === 4}
      <!-- CONTRAST CHECKER -->
      <div class="feature-wrapper">
        <Contrast />
      </div>

      {:else if activeTab === 5}
      <!-- TODO -->
      <div class="feature-wrapper">
        <Tasks />
      </div>
    {/if}


  </div>

  <nav class="dock">
    <button class:active={activeTab === 0} on:click={() => activeTab = 0}>Timer</button>
    <button class:active={activeTab === 1} on:click={() => activeTab = 1}>Color</button>
    <button class:active={activeTab === 2} on:click={() => activeTab = 2}>Clock</button>
    <button class:active={activeTab === 4} on:click={() => activeTab = 4}>Contrast</button>
    <button class:active={activeTab === 5} on:click={() => activeTab = 5}>Tasks</button>
  </nav>

</main>


<style>
  :global(body) {
    margin: 0;
    background-color: #1a1a1a; /* Darker background */
    color: rgba(255, 255, 255, 0.87);
    font-family: Inter, system-ui, sans-serif;
    overflow: hidden; /* Prevent scroll on mobile */
  }

  .app-shell {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .content {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .display h1 {
    font-size: 4rem;
    margin: 0;
    font-weight: 200;
    font-variant-numeric: tabular-nums; 
  }

  .display p {
    margin: 0;
    font-size: 0.8rem;
    letter-spacing: 2px;
    opacity: 0.5;
  }

  /* DOCK STYLES (Apple-like bottom bar) */
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
  }

  .dock button.active {
    background: rgba(255,255,255,0.1);
    color: white;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
</style>