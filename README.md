  ⭕ justawheel

    Digital utility meets analog satisfaction.
    A tactile, minimalist productivity suite built around a physics-based rotary input.

![alt text](https://img.shields.io/badge/status-active-success.svg)


![alt text](https://img.shields.io/badge/built%20with-Svelte-ff3e00.svg)


![alt text](https://img.shields.io/badge/license-MIT-blue.svg)

Justawheel is a Progressive Web App (PWA) that reimagines standard digital tools (Timer, Todo, Clock) through a unique User Experience inspired by the iPod Click Wheel, analog synthesizers, and planetary orbits.

There are no buttons to click, only a wheel to spin.
✨ Features

The application revolves around a central Rotary Component that handles physics, inertia, and haptic/audio feedback.
🪐 Orbital Tasks (Todo)

A gamified task manager where physics meets productivity.

    Navigation: Spin the wheel to cycle through tasks like a carousel.

    Completion: Tap to complete. The task physically transforms into a glowing orb and falls into a "gravity well" at the bottom of the screen.

    Radial Menu: Press and hold the center to trigger a "Weapon Wheel" style menu to Add Tasks or Clear the pile of completed orbs.

    Persistence: LocalStorage saves your active tasks and your pile of completed orbs.

⏱️ Zen Timer

A physical kitchen timer in digital form.

    Set: Spin right to wind it up. Spin left to wind down.

    Control: Single tap to Start/Pause. Double tap to Reset.

    Feedback: Visual blinking and shake animations when the alarm triggers.

🎨 Color & Contrast

Tools for designers and developers.

    Color Picker: Cycle through the Hue spectrum. Tap to copy HEX/RGB/HSL codes to clipboard.

    Contrast Checker: Adjust Background and Foreground lightness independently to find the perfect WCAG contrast ratio (AA/AAA).

🕰️ Time Tuner (Clock)

    Time Travel: Spin the wheel to offset the time (simulate time zones).

    Digital/Analog: Double tap to switch between a clean sans-serif look and a retro digital terminal style.

🛠️ Tech Stack & Architecture

This project was built with a focus on Zero Dependencies for UI logic. No component libraries (MUI, Bootstrap) were used. Everything is hand-crafted.

    Framework: Svelte (Vite)

    Styling: Vanilla CSS + CSS Variables (Design Tokens)

    Audio Engine: Web Audio API (Oscillators).

        Why? We synthesize the "click" sound in real-time using sine waves. This ensures zero latency and no need to load MP3 assets.

    Physics: Custom Math.atan2 trigonometry to calculate rotation angle, delta, and velocity.

    Storage: localStorage for privacy-focused, offline-first persistence.

    PWA: Fully installable on Android/iOS via manifest.json.

🚀 Getting Started
Prerequisites

    Node.js (v14 or higher)

Installation

    Clone the repository:
    code Bash

    git clone https://github.com/yourusername/justawheel.git
    cd justawheel

    Install dependencies:
    code Bash

    npm install

    Run the development server:
    code Bash

    npm run dev

    Open your browser at http://localhost:5173.

📂 Project Structure
code Code

/src
  /lib
    /Components
      RotaryWheel.svelte   # The Core Physics Engine & Event Emitter
      TaskOrb.svelte       # The Orbital Todo Logic & Physics
      Timer.svelte         # Timer Logic
      ColorPicker.svelte   # HSL Conversion Logic
      Clock.svelte         # Time Manipulation Logic
      Contrast.svelte      # WCAG Math Logic
    audio.js               # Synthesized Audio Context (Singleton)
  App.svelte               # Main Layout & Tab Management
  main.js                  # Entry Point

🎨 Design Philosophy

    Tactile over Visual: Every interaction should feel physical. Sounds, haptics (vibration), and inertia are as important as the pixels.

    The Wheel is Key : If a feature cannot be controlled by a wheel, it doesn't belong here.

    Zen Mode: Dark mode default. Low contrast text for secondary info, high contrast for primary info. No clutter.

📱 Mobile Support

This app is designed as a mobile-first PWA.

    Touch Actions: Supports touch-and-drag rotation.

    Haptics: Uses navigator.vibrate on supported devices for tick feedback.

    Install: Add to Home Screen to run in fullscreen standalone mode.

🔮 Roadmap

    Breathing Exercise Mode: A visualizer that expands/contracts for 4-7-8 breathing.

    Soundscape Mixer: Mix rain/fire/wind sounds using the wheel for volume.

    Export Data: Download task history as .csv or .json.

📄 License

Distributed under the MIT License. See LICENSE for more information.
