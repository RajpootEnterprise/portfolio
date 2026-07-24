import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

import { HEIGHTS, COLORS, roomPositions, cameraViews, projectDetails, planetDestinations, GLOBE } from './constants';
import { state } from './state';
import { createHouseStructure } from './house';
import { createGlobeStructures } from './globeStructures';

function projectFlyingObject(obj: THREE.Object3D, fx: number, fy: number, fz: number, nfx: number, nfy: number, nfz: number) {
  const h = GLOBE.radius + fy;
  const rel = new THREE.Vector3(fx, GLOBE.radius, fz);
  rel.normalize().multiplyScalar(h);
  const spherePos = new THREE.Vector3().addVectors(GLOBE.center, rel);
  obj.position.copy(spherePos);
  
  const nh = GLOBE.radius + nfy;
  const nrel = new THREE.Vector3(nfx, GLOBE.radius, nfz);
  nrel.normalize().multiplyScalar(nh);
  const targetSpherePos = new THREE.Vector3().addVectors(GLOBE.center, nrel);
  
  const up = spherePos.clone().sub(GLOBE.center).normalize();
  const forward = targetSpherePos.clone().sub(spherePos).normalize();
  const right = new THREE.Vector3().crossVectors(forward, up).normalize();
  const adjustedForward = new THREE.Vector3().crossVectors(up, right).normalize();
  
  const m = new THREE.Matrix4().makeBasis(right, up, adjustedForward.multiplyScalar(-1));
  obj.quaternion.setFromRotationMatrix(m);
}
import { createRoomProps } from './props';
import {
  setupLights,
  createHelipad,
  createHelicopter,
  createSpaceCity,
  createRoomLabels,
  createCelestialEnvironment
} from './environment';

// ----------------------------------------------------
// Audio Synthesizer Engine
// ----------------------------------------------------
class CyberAudioSynth {
  ctx: AudioContext | null = null;
  jetFilter: BiquadFilterNode | null = null;
  jetGain: GainNode | null = null;
  trainGain: GainNode | null = null;
  chugInterval: any = null;
  chugSpeed = 250;
  hornGain: GainNode | null = null;

  init() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // 1. JET ENGINE SYNTHESIS (White Noise lowpass sweeps)
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      this.jetFilter = this.ctx.createBiquadFilter();
      this.jetFilter.type = 'lowpass';
      this.jetFilter.frequency.value = 220;
      this.jetFilter.Q.value = 3.0;

      this.jetGain = this.ctx.createGain();
      this.jetGain.gain.value = 0.0;

      noiseSource.connect(this.jetFilter);
      this.jetFilter.connect(this.jetGain);
      this.jetGain.connect(this.ctx.destination);
      noiseSource.start(0);

      // 2. TRAIN CHUG SYNTHESIS
      this.trainGain = this.ctx.createGain();
      this.trainGain.gain.value = 0.0;
      this.trainGain.connect(this.ctx.destination);

      this.startChugging();

      // 3. TRAIN HORN SYNTHESIS
      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.value = 0.0;
      this.hornGain.connect(this.ctx.destination);

    } catch (e) {
      console.warn("Failed to init Web Audio synth:", e);
    }
  }

  startChugging() {
    if (this.chugInterval) clearInterval(this.chugInterval);

    const triggerChug = () => {
      if (!this.ctx || this.ctx.state === 'suspended' || !state.trainGroup) {
        this.chugInterval = setTimeout(triggerChug, 250);
        return;
      }

      let playGain = 0.22;
      if (state.trainState === 'stopped') {
        playGain = 0.0;
      } else if (state.trainState === 'decelerating') {
        playGain = 0.06;
      }

      if (playGain > 0.0) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 50;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 160;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.trainGain!);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.exponentialRampToValueAtTime(playGain, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.14);

        const bufferSize = this.ctx.sampleRate * 0.07;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const chData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          chData[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 650;

        const noiseGain = this.ctx.createGain();
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.trainGain!);

        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.exponentialRampToValueAtTime(playGain * 0.4, now + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.start(now);
        noise.stop(now + 0.06);
      }

      let interval = 450;
      if (state.trainState === 'decelerating') {
        interval = 700;
      } else if (state.trainState === 'accelerating') {
        interval = 320;
      } else if (state.trainState === 'running') {
        interval = 260;
      }

      this.chugInterval = setTimeout(triggerChug, interval);
    };

    this.chugInterval = setTimeout(triggerChug, this.chugSpeed);
  }

  playHorn() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.frequency.value = 390;
    osc2.frequency.value = 425;
    osc3.frequency.value = 295;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    const gain = this.ctx.createGain();

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(this.hornGain!);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.1);
    gain.gain.setValueAtTime(0.35, now + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 1.4);
    osc2.stop(now + 1.4);
    osc3.stop(now + 1.4);
  }

  updateVolumes(camera: THREE.Camera) {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    if (state.planeMesh1 && this.jetGain && this.jetFilter) {
      const planePos = new THREE.Vector3();
      state.planeMesh1.getWorldPosition(planePos);
      const dist = camera.position.distanceTo(planePos);

      let vol = 1.0 - Math.min(1.0, dist / 85.0);
      vol = Math.pow(vol, 2.0) * 0.18;

      this.jetGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.15);

      const freq = 150 + vol * 2800;
      this.jetFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    }

    if (state.trainGroup && this.trainGain) {
      const trainPos = new THREE.Vector3();
      state.trainGroup.getWorldPosition(trainPos);
      const dist = camera.position.distanceTo(trainPos);

      let vol = 1.0 - Math.min(1.0, dist / 80.0);
      vol = Math.pow(vol, 2.0) * 0.45;

      this.trainGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.2);
    }

    if (state.trainGroup && this.hornGain) {
      const trainPos = new THREE.Vector3();
      state.trainGroup.getWorldPosition(trainPos);
      const dist = camera.position.distanceTo(trainPos);

      let vol = 1.0 - Math.min(1.0, dist / 80.0);
      vol = Math.pow(vol, 2.0) * 0.55;

      this.hornGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }
}

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
function init() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Scene
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0xfaf8f5);

  // Camera - positioned outside the globe (radius=35, center=(0,-35.05,0)), top of globe ~y=0
  // Distance from globe center must be > GLOBE.radius (35) to be outside the sphere
  const isMobileInit = window.innerWidth < 768;
  const startFov = (window.innerWidth / window.innerHeight) < 1.0 ? 56 : 42;
  // Camera at ~75 units from globe center (75 > 35 radius = outside globe)
  const CAM_DISTANCE_FROM_CENTER = isMobileInit ? 100 : 75;
  state.camera = new THREE.PerspectiveCamera(startFov, window.innerWidth / window.innerHeight, 0.1, 800);
  // Position camera above the globe looking toward globe center
  state.camera.position.set(
    GLOBE.center.x,
    GLOBE.center.y + CAM_DISTANCE_FROM_CENTER,
    GLOBE.center.z + 40
  );

  // Renderer
  state.renderer = new THREE.WebGLRenderer({ antialias: true });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.0;
  container.appendChild(state.renderer.domElement);

  // Controls - orbit target is the GLOBE CENTER so rotation circles the whole globe
  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.06;
  state.controls.target.copy(GLOBE.center); // Globe center = (0, -35.05, 0)

  // Enable touch controls
  state.controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };

  // Full 360-degree orbit: no polar angle restrictions, generous zoom range
  state.controls.minPolarAngle = 0;
  state.controls.maxPolarAngle = Math.PI;
  state.controls.minDistance = GLOBE.radius + 2.0;  // don't let camera go inside globe
  state.controls.maxDistance = 250.0;               // zoom way out to see globe in space

  // Disable Auto-Rotation
  state.controls.autoRotate = false;
  state.controls.autoRotateSpeed = 0.4;

  // Initialize House Group
  state.houseGroup = new THREE.Group();
  const sx = 1.35; // 35% wider house
  const sy = 1.0;  // keep heights aligned
  const sz = 1.25; // 25% deeper house
  state.houseGroup.scale.set(sx, sy, sz);
  state.scene.add(state.houseGroup);

  // Scale constants programmatically to match scaled house world coordinates
  Object.values(roomPositions).forEach(pos => {
    pos.stand.x *= sx; pos.stand.y *= sy; pos.stand.z *= sz;
    if (pos.action) {
      pos.action.x *= sx; pos.action.y *= sy; pos.action.z *= sz;
    }
    pos.h *= sy;
  });

  Object.values(cameraViews).forEach(view => {
    view.position.x *= sx; view.position.y *= sy; view.position.z *= sz;
    view.target.x *= sx; view.target.y *= sy; view.target.z *= sz;
  });

  // Add Lights & Physical Bulb Meshes
  setupLights();

  // Create 3D Architecture (3 Levels + Roof)
  createHouseStructure();

  // Model Furniture Props
  createRoomProps();

  // Create Floating Room Labels
  createRoomLabels();

  // Create Celestial Environment Skies (Sun, Moon, Stars, Birds, Saturn)
  createCelestialEnvironment();

  // Create Helipad & Helicopter
  createHelipad();
  createHelicopter();
  createSpaceCity();
  createGlobeStructures();

  // Avatar removed
  state.avatar = null;

  // Bind Events & Toggles
  setupEvents();

  // Handle Resize
  window.addEventListener('resize', onWindowResize);

  // Start Idle Inactivity Timer (maintains autoRotate off)
  resetIdleTimer();

  // Instantiate and trigger Web Audio synthesizer automatically on first user click/touch
  state.synthAudio = new CyberAudioSynth();

  const startAudio = () => {
    if (state.synthAudio && !state.synthAudio.ctx) {
      state.synthAudio.init();
    }
    if (state.synthAudio && state.synthAudio.ctx && state.synthAudio.ctx.state === 'suspended') {
      state.synthAudio.ctx.resume();
    }
    window.removeEventListener('click', startAudio);
    window.removeEventListener('touchstart', startAudio);
    window.removeEventListener('pointerdown', startAudio);
    window.removeEventListener('keydown', startAudio);
  };

  window.addEventListener('click', startAudio);
  window.addEventListener('touchstart', startAudio);
  window.addEventListener('pointerdown', startAudio);
  window.addEventListener('keydown', startAudio);

  // Run Render Loop
  animate(0);
}

// ----------------------------------------------------
// Navigation & Path Routing (Stable Theta & Phi Glides)
// ----------------------------------------------------
function navigateToRoom(targetRoomName: string) {
  if (targetRoomName === state.currentRoom) return;

  // Stop auto rotation immediately
  state.controls.autoRotate = false;

  // Hide active overlay card
  const activeCard = document.querySelector('.info-card.active');
  if (activeCard) activeCard.classList.remove('active');

  // Deactivate active menu links
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const matchingBtn = document.getElementById(`btn-${targetRoomName}`);
  if (matchingBtn) matchingBtn.classList.add('active');

  // Open targeted content card immediately
  const panel = document.querySelector(`.info-card[id-panel="${targetRoomName}"]`);
  if (panel) panel.classList.add('active');

  // Update Footer label immediately
  const roomNames: Record<string, string> = {
    home: 'Ground Floor // Home Lobby',
    about: 'First Floor // Study Office',
    timeline: 'First Floor // Library Timeline',
    projects: 'Second Floor // Tech Lab',
    skills: 'Second Floor // Arcade Skills',
    contact: 'Ground Floor // Garden Patio'
  };
  const labelEl = document.getElementById('current-room-text');
  if (labelEl) labelEl.textContent = roomNames[targetRoomName];

  state.currentRoom = targetRoomName;
  state.isTransitioning = false;

  onArrival(targetRoomName);
}

// Arrival Actions
function onArrival(targetRoomName: string) {
  state.currentRoom = targetRoomName;
  state.isTransitioning = false;

  // Set camera limits - keep outside the globe surface
  state.controls.minDistance = GLOBE.radius + 2.0;
  state.controls.maxDistance = 250.0;
  state.controls.maxPolarAngle = Math.PI;
  state.controls.minPolarAngle = 0;
  state.controls.update();

  // Animate Mailbox flag if landing on contact Patio Garden
  if (targetRoomName === 'contact' && state.mailboxFlag && state.letterMesh) {
    gsap.timeline()
      .to(state.mailboxFlag.rotation, { z: 0, duration: 0.6, ease: 'back.out(2.5)' })
      .to(state.letterMesh.position, { y: 1.15, z: 0.28, duration: 0.5, ease: 'power2.out' }, '-=0.2');
  } else {
    // Reset Mailbox flag if leaving contact
    if (state.mailboxFlag && state.letterMesh) {
      state.mailboxFlag.rotation.z = -Math.PI / 2.5;
      state.letterMesh.position.set(0, 1.0, 0.18);
    }
  }
}

// ----------------------------------------------------
// Smooth Zoom-out back to Overview Mode
// ----------------------------------------------------
function exitRoomToOverview() {
  if (state.isTransitioning) return;
  
  // Fade out active room content card
  const activeCard = document.querySelector('.info-card.active');
  if (activeCard) activeCard.classList.remove('active');

  // Deactivate menu tabs
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  // Set footer room text back to overview
  const labelEl = document.getElementById('current-room-text');
  if (labelEl) labelEl.textContent = 'House Overview';

  // Reset avatar animation back to waving at home sofa
  if (state.avatar) {
    state.avatar.setState('waving');
  }

  state.currentRoom = 'overview';
  state.isTransitioning = false;
  
  // Restore overview camera constraints - always outside the globe
  state.controls.minDistance = GLOBE.radius + 2.0;
  state.controls.maxDistance = 250.0;
  state.controls.maxPolarAngle = Math.PI;
  state.controls.minPolarAngle = 0;
  state.controls.update();
}

// ----------------------------------------------------
// Theme Toggle
// ----------------------------------------------------
function toggleTheme() {
  state.isDarkMode = !state.isDarkMode;
  const toggleBtn = document.getElementById('theme-toggle-btn');

  if (state.isDarkMode) {
    document.body.classList.add('dark-theme');
    if (toggleBtn) toggleBtn.innerHTML = '<span class="toggle-icon">☼</span>';
  } else {
    document.body.classList.remove('dark-theme');
    if (toggleBtn) toggleBtn.innerHTML = '<span class="toggle-icon">☾</span>';
  }

  const duration = 1.2;

  // Tween lighting values
  gsap.to(state.ambientLight, {
    intensity: state.isDarkMode ? 0.85 : 1.2,
    duration: duration
  });

  const targetAmbientColor = new THREE.Color(state.isDarkMode ? 0x6c7cb8 : 0xfff6eb);
  gsap.to(state.ambientLight.color, {
    r: targetAmbientColor.r,
    g: targetAmbientColor.g,
    b: targetAmbientColor.b,
    duration: duration
  });

  gsap.to(state.sunLight, {
    intensity: state.isDarkMode ? 0.0 : 1.4,
    duration: duration
  });

  gsap.to(state.moonLight, {
    intensity: state.isDarkMode ? 2.0 : 0.0,
    duration: duration
  });

  gsap.to(state.streetLampLight, {
    intensity: state.isDarkMode ? 3.0 : 0.1,
    duration: duration
  });

  gsap.to(state.deskLampLight, {
    intensity: state.isDarkMode ? 2.5 : 0.0,
    duration: duration
  });

  // Animate Celestial Bodies
  gsap.to(state.sunGroup.position, { y: state.isDarkMode ? -6 : 18, duration: duration, ease: 'power2.inOut' });
  gsap.to(state.moonGroup.position, { y: state.isDarkMode ? 14 : -8, duration: duration, ease: 'power2.inOut' });

  // Starfield fades in
  gsap.to(state.starPoints.material, { opacity: state.isDarkMode ? 1.0 : 0.0, duration: duration });

  // Planets scale up
  gsap.to(state.planetGroup.scale, {
    x: state.isDarkMode ? 1.0 : 0.001,
    y: state.isDarkMode ? 1.0 : 0.001,
    z: state.isDarkMode ? 1.0 : 0.001,
    duration: duration,
    ease: 'power2.out'
  });

  // Birds fly away
  gsap.to(state.birdsGroup.scale, {
    x: state.isDarkMode ? 0.0 : 1.0,
    y: state.isDarkMode ? 0.0 : 1.0,
    z: state.isDarkMode ? 0.0 : 1.0,
    duration: duration
  });

  // Clear Color
  const targetColor = new THREE.Color(state.isDarkMode ? 0x090a14 : 0xfaf8f5);
  gsap.to(state.scene.background, {
    r: targetColor.r,
    g: targetColor.g,
    b: targetColor.b,
    duration: duration
  });

  // Indoor spots
  state.roomLights.forEach(spot => {
    gsap.to(spot, { intensity: state.isDarkMode ? 2.5 : 0.1, duration: duration });
  });

  // Lightbulbs glow
  const targetBulbColor = new THREE.Color(state.isDarkMode ? 0xfff3cc : 0x666666);
  state.bulbMeshes.forEach(bulb => {
    const bulbMat = bulb.material as THREE.MeshBasicMaterial;
    gsap.to(bulbMat.color, {
      r: targetBulbColor.r,
      g: targetBulbColor.g,
      b: targetBulbColor.b,
      duration: duration
    });
  });

  // Laptop & Arcade glowing screens
  const lapScreenMat = state.laptopScreenMesh.material as THREE.MeshBasicMaterial;
  const arcScreenMat = state.arcadeScreenMesh.material as THREE.MeshBasicMaterial;
  const logMat = state.fireplaceLogMesh.material as THREE.MeshStandardMaterial;

  if (state.isDarkMode) {
    lapScreenMat.color.setHex(COLORS.screenOn);
    arcScreenMat.color.setHex(0xe07a5f);
    logMat.emissive.setHex(COLORS.fireGlow);
    logMat.emissiveIntensity = 2.0;
  } else {
    lapScreenMat.color.setHex(COLORS.screenOff);
    arcScreenMat.color.setHex(COLORS.screenOff);
    logMat.emissive.setHex(0x000000);
    logMat.emissiveIntensity = 0.0;
  }
}

// ----------------------------------------------------
// UI Bindings & Raycasting
// ----------------------------------------------------
function setupEvents() {
  // Add close button to all room info cards
  document.querySelectorAll('.info-card').forEach(card => {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Close and explore';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exitRoomToOverview();
    });
    card.appendChild(closeBtn);
  });

  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const navbarEl = document.querySelector('.navbar');

  if (menuToggleBtn && navbarEl) {
    menuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navbarEl.classList.toggle('open');
      menuToggleBtn.textContent = navbarEl.classList.contains('open') ? '✕' : '☰';
    });

    document.addEventListener('click', () => {
      if (navbarEl.classList.contains('open')) {
        navbarEl.classList.remove('open');
        menuToggleBtn.textContent = '☰';
      }
    });
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomName = (e.currentTarget as HTMLElement).getAttribute('data-room');
      if (roomName) navigateToRoom(roomName);

      if (navbarEl && menuToggleBtn) {
        navbarEl.classList.remove('open');
        menuToggleBtn.textContent = '☰';
      }
    });
  });

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-proj-id');
      if (idxStr !== null) {
        const idx = parseInt(idxStr);
        highlightScreen(idx, true);
        (e.currentTarget as HTMLElement).classList.add('highlighted');
      }
    });
    card.addEventListener('mouseleave', (e) => {
      const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-proj-id');
      if (idxStr !== null) {
        const idx = parseInt(idxStr);
        highlightScreen(idx, false);
        (e.currentTarget as HTMLElement).classList.remove('highlighted');
      }
    });
    card.addEventListener('click', (e) => {
      if (state.isTransitioning || state.isSpaceTrip) return;
      const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-proj-id');
      if (idxStr !== null) {
        const idx = parseInt(idxStr);
        flyToPlanet(idx);
      }
    });
  });

  const returnBtn = document.getElementById('btn-return-earth');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      returnToEarth();
    });
  }

  const credBtn = document.getElementById('btn-credentials-trip');
  if (credBtn) {
    credBtn.addEventListener('click', () => {
      if (state.isTransitioning || state.isSpaceTrip) return;
      flyToPlanet(3);
    });
  }

  // Contact Form Submission (FormSubmit.co API lifetime free forwarding)
  const CONTACT_EMAIL = "your-email@example.com"; 

  const form = document.getElementById('portfolio-contact-form');
  const successEl = document.getElementById('form-success');
  if (form && successEl) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('form-submit-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting...';
      }

      if (state.streetLampLight) {
        const originalVal = state.streetLampLight.intensity;
        gsap.timeline()
          .to(state.streetLampLight, { intensity: 5.5, duration: 0.08, repeat: 6, yoyo: true })
          .to(state.streetLampLight, { intensity: originalVal, duration: 0.3 });
      }

      const nameVal = (document.getElementById('form-name') as HTMLInputElement).value;
      const emailVal = (document.getElementById('form-email') as HTMLInputElement).value;
      const messageVal = (document.getElementById('form-message') as HTMLTextAreaElement).value;

      const targetUrl = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

      fetch(targetUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          message: messageVal,
          _subject: `Portfolio Message from ${nameVal}`
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log("FormSubmit response:", data);
        successEl.style.display = 'block';
        if (CONTACT_EMAIL === "your-email@example.com") {
          successEl.innerHTML = "<span>✓ Message saved locally! Change CONTACT_EMAIL in main.ts to activate free inbox forwarding.</span>";
        } else {
          successEl.innerHTML = "<span>✓ Message transmitted successfully! Check your email inbox.</span>";
        }
      })
      .catch(err => {
        console.error("FormSubmit submission error:", err);
        successEl.style.display = 'block';
        successEl.innerHTML = "<span style='color: #e07a5f;'>✓ Note: Mocked send! Replace CONTACT_EMAIL in main.ts to activate free email forwarding.</span>";
      })
      .finally(() => {
        setTimeout(() => {
          (form as HTMLFormElement).reset();
          successEl.style.display = 'none';
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
          }
        }, 5000);
      });
    });
  }

  // Raycaster click and hover listeners
  state.renderer.domElement.addEventListener('click', onCanvasClick);
  state.renderer.domElement.addEventListener('mousemove', onCanvasMouseMove);

  // Zoom towards mouse pointer logic (Zoom-to-cursor)
  state.renderer.domElement.addEventListener('wheel', (e) => {
    if (state.isSpaceTrip || state.isTransitioning) return;
    
    // Zooming IN (e.deltaY < 0) -> Zoom to cursor
    if (e.deltaY < 0) {
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const intersects = state.raycaster.intersectObjects(state.scene.children, true);
      const validHits = intersects.filter(hit => hit.object.type !== 'Points' && hit.distance < 110);
      if (validHits.length > 0) {
        const hitPoint = validHits[0].point;
        state.controls.target.lerp(hitPoint, 0.12);
      }
    }

    // Zooming OUT (e.deltaY > 0) -> Lerp target back to globe center & check exit room
    if (e.deltaY > 0) {
      state.controls.target.lerp(GLOBE.center, 0.12);
      
      if (state.currentRoom !== 'overview') {
        setTimeout(() => {
          const dist = state.camera.position.distanceTo(GLOBE.center);
          if (dist > GLOBE.radius + 22.0) {
            exitRoomToOverview();
          }
        }, 50);
      }
    }
  }, { passive: true });

  // Controls start/end hooks
  state.controls.addEventListener('start', () => {
    state.controls.autoRotate = false;
    const toggleSpinBtn = document.getElementById('btn-toggle-spin');
    if (toggleSpinBtn) toggleSpinBtn.textContent = 'Spin: Off';
  });

  const widgetToggleBtn = document.getElementById('widget-toggle-btn');
  const controlWidget = document.getElementById('control-widget');
  if (widgetToggleBtn && controlWidget) {
    widgetToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      controlWidget.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      controlWidget.classList.remove('open');
    });

    const widgetPanel = document.getElementById('widget-panel');
    if (widgetPanel) {
      widgetPanel.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  // Reset View Camera Action
  const resetViewBtn = document.getElementById('btn-reset-view');
  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
      const activeCard = document.querySelector('.info-card.active');
      if (activeCard) activeCard.classList.remove('active');

      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

      const labelEl = document.getElementById('current-room-text');
      if (labelEl) labelEl.textContent = 'House Overview';

      state.isTransitioning = false;
      state.currentRoom = 'overview';

      if (state.avatar) {
        state.avatar.setState('waving');
      }

      state.controls.minDistance = GLOBE.radius + 2.0;
      state.controls.maxDistance = 250.0;
      state.controls.maxPolarAngle = Math.PI;
      state.controls.minPolarAngle = 0;

      // Animate camera back to a good outside-globe overview position
      const overviewPos = new THREE.Vector3(
        GLOBE.center.x,
        GLOBE.center.y + 75,
        GLOBE.center.z + 40
      );
      gsap.to(state.camera.position, { x: overviewPos.x, y: overviewPos.y, z: overviewPos.z, duration: 1.5, ease: 'power2.inOut' });
      gsap.to(state.controls.target, { 
        x: GLOBE.center.x, 
        y: GLOBE.center.y, 
        z: GLOBE.center.z, 
        duration: 1.5, 
        ease: 'power2.inOut', 
        onUpdate: () => state.controls.update() 
      });

      // Keep spin OFF on reset view to honor manual-only spin
      state.controls.autoRotate = false;
      const toggleSpinBtn = document.getElementById('btn-toggle-spin');
      if (toggleSpinBtn) toggleSpinBtn.textContent = 'Spin: Off';
      
      if (controlWidget) controlWidget.classList.remove('open');
    });
  }

  // Toggle Spin Camera Action (keeps off-by-default behavior)
  const toggleSpinBtn = document.getElementById('btn-toggle-spin');
  if (toggleSpinBtn) {
    toggleSpinBtn.addEventListener('click', () => {
      state.controls.autoRotate = !state.controls.autoRotate;
      toggleSpinBtn.textContent = state.controls.autoRotate ? 'Spin: On' : 'Spin: Off';
    });
  }

  document.querySelectorAll('.widget-btn-room').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomName = (e.currentTarget as HTMLElement).getAttribute('data-room');
      if (roomName) navigateToRoom(roomName);

      if (controlWidget) controlWidget.classList.remove('open');
    });
  });
}

function onCanvasClick(event: MouseEvent) {
  state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  state.raycaster.setFromCamera(state.mouse, state.camera);
  const intersects = state.raycaster.intersectObjects(state.interactiveObjects, true);

  if (intersects.length > 0) {
    let obj: THREE.Object3D | null = intersects[0].object;
    
    while (obj) {
      if (obj.userData && obj.userData.targetFocus) {
        const targetPos = obj.userData.targetFocus;
        state.isTransitioning = true;
        state.controls.autoRotate = false;
        state.currentRoom = obj.userData.focusName || 'airport';
        
        gsap.to(state.controls.target, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => state.controls.update()
        });

        const camOffset = obj.userData.focusName === 'airport'
          ? new THREE.Vector3(-20 + 8.5, 4.0, 9.5)
          : new THREE.Vector3(8.5, 4.0, -28 + 9.5);

        gsap.to(state.camera.position, {
          x: camOffset.x,
          y: camOffset.y,
          z: camOffset.z,
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => {
            state.isTransitioning = false;
            state.controls.minDistance = GLOBE.radius + 2.0;
            state.controls.maxDistance = 250.0;
            state.controls.update();
          }
        });
        break;
      }

      if (obj.userData && obj.userData.roomName) {
        navigateToRoom(obj.userData.roomName);
        break;
      }
      obj = obj.parent;
    }
    // No auto-fly on empty clicks - user is free to orbit the globe manually
  }
}

function onCanvasMouseMove(event: MouseEvent) {
  state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  state.raycaster.setFromCamera(state.mouse, state.camera);
  const intersects = state.raycaster.intersectObjects(state.interactiveObjects, true);

  let foundHoverable = false;
  if (intersects.length > 0) {
    let obj: THREE.Object3D | null = intersects[0].object;
    while (obj) {
      if (obj.userData && (obj.userData.roomName || obj.userData.targetFocus)) {
        foundHoverable = true;
        break;
      }
      obj = obj.parent;
    }
  }
  state.renderer.domElement.style.cursor = foundHoverable ? 'pointer' : 'auto';
}

function resetIdleTimer() {
  state.controls.autoRotate = false;
}

function highlightScreen(idx: number, turnOn: boolean) {
  if (idx >= 0 && idx < state.screens.length) {
    const screen = state.screens[idx];
    const mat = screen.material as THREE.MeshBasicMaterial;
    if (turnOn) {
      mat.color.setHex(COLORS.screenOn);
      gsap.to(screen.scale, { y: 1.1, x: 1.05, duration: 0.25, ease: 'back.out(2)' });
    } else {
      mat.color.setHex(COLORS.screenOff);
      gsap.to(screen.scale, { y: 1.0, x: 1.0, duration: 0.2 });
    }
  }
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  if (state.camera.aspect < 1.0) {
    state.camera.fov = 56;
  } else {
    state.camera.fov = 42;
  }
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------------------
// Render Tick Update Loop
// ----------------------------------------------------
function animate(time: number) {
  requestAnimationFrame(animate);

  const seconds = time * 0.001;

  // Randomly blink server status LEDs to simulate computing operations
  state.serverLights.forEach(led => {
    if (Math.random() > 0.98) {
      const mat = led.material as THREE.MeshBasicMaterial;
      const isOff = mat.color.getHex() === 0x111111;
      if (isOff) {
        mat.color.setHex(led.userData.originalColor || 0x10b981);
      } else {
        led.userData.originalColor = mat.color.getHex();
        mat.color.setHex(0x111111);
      }
    }
  });

  // Animate Garden Fairy Lights glowing warmth at night
  state.fairyLights.forEach((bulb, idx) => {
    const mat = bulb.material as THREE.MeshBasicMaterial;
    if (state.isDarkMode) {
      const glow = 0.85 + Math.sin(seconds * 3.5 + idx) * 0.15;
      mat.color.setRGB(1.0 * glow, 0.94 * glow, 0.54 * glow);
    } else {
      mat.color.setHex(0x475569);
    }
  });



  // Update controls
  state.controls.update();

  // Update avatar joints
  if (state.avatar) {
    state.avatar.update(seconds);
  }

  // Spin helicopter rotors
  if (state.helicopter && state.mainRotor && state.tailRotor) {
    state.mainRotor.rotation.y += state.rotorSpeed;
    state.tailRotor.rotation.z += state.rotorSpeed * 1.8;
  }

  // Spin windmill blades
  if (state.windmillBlades) {
    state.windmillBlades.rotation.z += 0.012;
  }

  // Animate river currents
  if (state.riverMesh1 && state.riverMesh2) {
    state.riverMesh1.position.z = Math.sin(seconds * 0.5) * 0.15;
    state.riverMesh2.position.z = Math.cos(seconds * 0.5) * 0.15;
  }

  // Fireplace log glowing flame flicker in dark mode
  if (state.fireplaceLight) {
    if (state.isDarkMode) {
      state.fireplaceLight.intensity = 2.2 + Math.sin(time * 0.015) * 0.35;
    } else {
      state.fireplaceLight.intensity = 0.0;
    }
  }

  // Bob floating room labels
  state.floatingLabels.forEach(label => {
    label.position.y = label.userData.baseY + Math.sin(seconds * 2.0 + label.userData.phase) * 0.05;
    label.lookAt(state.camera.position);
  });

  // Bob and rotate floating tech shapes
  state.floatingTechShapes.forEach((shape, index) => {
    shape.position.y = 0.95 + Math.sin(seconds * 2.5 + index) * 0.06;
    shape.rotation.y += 0.015;
    shape.rotation.x += 0.008;
  });

  // Animate Birds flight circles (around chimney at X=5.5, Z=0.2)
  state.birdsList.forEach((bird) => {
    const angle = seconds * 1.5 + bird.userData.offset;
    const radius = 3.6;
    const bx = 5.5 + Math.cos(angle) * radius;
    const bz = 0.2 + Math.sin(angle) * radius;
    const by = HEIGHTS.second + 1.8 + Math.sin(seconds * 3.0 + bird.userData.offset) * 0.35;
    
    bird.position.set(bx, by, bz);
    bird.rotation.y = -angle + Math.PI / 2;

    bird.userData.leftWing.rotation.z = Math.sin(seconds * 14.0) * 0.5;
    bird.userData.rightWing.rotation.z = -Math.sin(seconds * 14.0) * 0.5;
  });

  // Sway the flagpole banner gently in the wind
  if (state.flagMesh) {
    state.flagMesh.rotation.y = Math.sin(seconds * 3.5) * 0.12;
    state.flagMesh.rotation.z = Math.sin(seconds * 2.5) * 0.04;
  }

  // Rotate the realistic moon
  if (state.moonGroup) {
    state.moonGroup.rotation.y += 0.0015;
  }

  // Hover and orbit UFOs in celestial space with flashing perimeter lights
  state.ufoList.forEach(ufo => {
    ufo.rotation.y += 0.03;
    const uAngle = seconds * ufo.userData.orbitSpeed + ufo.userData.hoverOffset;
    ufo.position.x = ufo.userData.orbitCenter.x + Math.cos(uAngle) * ufo.userData.orbitRadius;
    ufo.position.z = ufo.userData.orbitCenter.z + Math.sin(uAngle) * ufo.userData.orbitRadius;
    ufo.position.y = ufo.userData.orbitCenter.y + Math.sin(seconds * 2.0 + ufo.userData.hoverOffset) * 0.18;

    ufo.userData.glowLights.forEach((light: THREE.Mesh, i: number) => {
      const mat = light.material as THREE.MeshBasicMaterial;
      const intensity = 0.4 + 0.6 * Math.sin(seconds * ufo.userData.pulseSpeed + i);
      mat.color.setRGB(0.06 * intensity, 0.71 * intensity, 0.5 * intensity);
    });
  });

  // Fly sleek spaceships in dynamic elliptical orbits looking along their flight tangent
  state.spaceshipList.forEach(ship => {
    const sAngle = seconds * ship.userData.orbitSpeed + ship.userData.phase;
    const sx = ship.userData.orbitCenter.x + Math.cos(sAngle) * ship.userData.orbitRadius;
    const sz = ship.userData.orbitCenter.z + Math.sin(sAngle) * ship.userData.orbitRadius;
    const sy = ship.userData.orbitCenter.y + Math.sin(sAngle * 2.0) * ship.userData.orbitRadius * ship.userData.orbitYScale;

    const nextAngle = sAngle + 0.05;
    const nx = ship.userData.orbitCenter.x + Math.cos(nextAngle) * ship.userData.orbitRadius;
    const nz = ship.userData.orbitCenter.z + Math.sin(nextAngle) * ship.userData.orbitRadius;
    const ny = ship.userData.orbitCenter.y + Math.sin(nextAngle * 2.0) * ship.userData.orbitRadius * ship.userData.orbitYScale;

    ship.position.set(sx, sy, sz);
    ship.lookAt(nx, ny, nz);
  });

  // 1. Airplane 1 (Landing and Takeoff loop on runway)
  if (state.planeMesh1) {
    const pTime = seconds * 0.35; 
    const phase = Math.floor(pTime % 4);
    const frac = pTime % 1;
    const runwayX = -20;
    const runwayY = -0.04;

    if (phase === 0) {
      // Descent
      const tz = 16 - 10 * frac;
      const ty = 8 - 8 * frac;
      projectFlyingObject(state.planeMesh1, runwayX, ty + runwayY, tz, runwayX, runwayY, 6);
    } else if (phase === 1) {
      // Roll
      const tz = 6 - 12 * frac;
      projectFlyingObject(state.planeMesh1, runwayX, runwayY, tz, runwayX, runwayY, -7);
    } else if (phase === 2) {
      // Climb
      const tz = -6 - 10 * frac;
      const ty = 0 + 8 * frac;
      projectFlyingObject(state.planeMesh1, runwayX, ty + runwayY, tz, runwayX, ty + runwayY + 1.0, tz - 2.0);
    } else {
      // Orbit sky
      const angle = Math.PI + frac * Math.PI;
      const radius = 21;
      const cx = runwayX + Math.sin(angle) * radius;
      const cz = -5 + Math.cos(angle) * radius;
      
      const nextAngle = angle + 0.02;
      const nx = runwayX + Math.sin(nextAngle) * radius;
      const nz = -5 + Math.cos(nextAngle) * radius;
      projectFlyingObject(state.planeMesh1, cx, 8 + runwayY, cz, nx, 8 + runwayY, nz);
    }
  }

  // 2. Airplane 2 (Sky Cruiser)
  if (state.planeMesh2) {
    const angle = seconds * 0.25;
    const radius = 26;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius - 5;
    const py = 15;
    
    const nextAngle = angle + 0.02;
    const nx = Math.cos(nextAngle) * radius;
    const nz = Math.sin(nextAngle) * radius - 5;
    projectFlyingObject(state.planeMesh2, px, py, pz, nx, py, nz);
  }

  // 3. Train Circular Loop Movement & Railway Station Platform Stop
  if (state.trainGroup && state.trainCarriages) {
    const stationTheta = 1.5 * Math.PI; 
    const targetSpeed = 0.008; 
    
    state.trainAngle = state.trainAngle % (Math.PI * 2);
    if (state.trainAngle < 0) state.trainAngle += Math.PI * 2;
    
    const diff = Math.abs(state.trainAngle - stationTheta);
    
    if (state.trainState === 'running') {
      if (diff < 0.8 && state.trainAngle < stationTheta) {
        state.trainState = 'decelerating';
      }
    } else if (state.trainState === 'decelerating') {
      const tSpeed = Math.max(0.0004, (diff / 0.8) * targetSpeed);
      state.trainAngle += tSpeed;
      if (state.trainAngle >= stationTheta || Math.abs(state.trainAngle - stationTheta) < 0.015) {
        state.trainAngle = stationTheta;
        state.trainState = 'stopped';
        state.trainStopTimer = time; 
      }
    } else if (state.trainState === 'stopped') {
      if (time - state.trainStopTimer > 3000) {
        state.trainState = 'accelerating';
        state.trainStopTimer = time;
        if (state.synthAudio) {
          state.synthAudio.playHorn();
        }
      }
    } else if (state.trainState === 'accelerating') {
      const accelFrac = Math.min(1.0, (time - state.trainStopTimer) / 2500);
      state.trainAngle += accelFrac * targetSpeed;
      if (accelFrac >= 1.0) {
        state.trainState = 'running';
      }
    }
    
    if (state.trainState !== 'stopped') {
      if (state.trainState === 'running') {
        state.trainAngle += targetSpeed;
      }
    }
    
    const trackRadius = 22.0;
    const trackCenterZ = -5.0;
    
    const tx = Math.cos(state.trainAngle) * trackRadius;
    const tz = Math.sin(state.trainAngle) * trackRadius + trackCenterZ;
    
    const nextT = state.trainAngle + 0.05;
    const ntx = Math.cos(nextT) * trackRadius;
    const ntz = Math.sin(nextT) * trackRadius + trackCenterZ;
    projectFlyingObject(state.trainGroup, tx, -0.04, tz, ntx, -0.04, ntz);
    
    state.trainCarriages.forEach((carriage, idx) => {
      const cAngle = state.trainAngle - (idx + 1) * 0.16;
      const cx = Math.cos(cAngle) * trackRadius;
      const cz = Math.sin(cAngle) * trackRadius + trackCenterZ;
      
      const cNext = cAngle + 0.05;
      const cnx = Math.cos(cNext) * trackRadius;
      const cnz = Math.sin(cNext) * trackRadius + trackCenterZ;
      projectFlyingObject(carriage, cx, -0.04, cz, cnx, -0.04, cnz);
    });
  }

  // 4. Update Synthesized audio volumes and swept filters
  if (state.synthAudio) {
    state.synthAudio.updateVolumes(state.camera);
  }

  // Render Scene
  state.renderer.render(state.scene, state.camera);
}

// ----------------------------------------------------
// Project Details Space Animation & Data
// ----------------------------------------------------
function setupProjectDetailTabsAndGallery(projectId: number) {
  const detail = projectDetails[projectId];
  
  // Set meta, title, description
  document.getElementById('project-detail-meta')!.textContent = detail.meta;
  document.getElementById('project-detail-title')!.textContent = detail.title;
  document.getElementById('project-detail-desc')!.textContent = detail.desc;
  
  // Features list
  const featuresContainer = document.getElementById('project-detail-features')!;
  featuresContainer.innerHTML = '';
  detail.features.forEach(feat => {
    const li = document.createElement('li');
    li.textContent = feat;
    featuresContainer.appendChild(li);
  });

  // Architecture description & flowchart
  const archDesc = document.getElementById('project-detail-arch-desc')!;
  const archFlow = document.getElementById('project-detail-arch-flow')!;
  
  if (projectId === 0) {
    archDesc.textContent = "BroadNet.ai runs on a decoupled microservices architecture. Transaction streams flow through Stripe, Kafka, and the Spring Boot processing nodes before database replication.";
    archFlow.innerHTML = `
[Client Request] ──> [Stripe Gateway] ──> [Invoicing Service]
                                                │
                                                ▼ (Produce Event)
[Redis Cache] <──── [Billing Engine] <─── [Apache Kafka Queue]
        │
        ▼ (Write Log)
[MySQL Replica]
`;
  } else if (projectId === 1) {
    archDesc.textContent = "The E-Learning platform uses a servlet request dispatcher mapping state updates into a MySQL transactional database, with Tomcat session clustering.";
    archFlow.innerHTML = `
[Student Browser] ──> [Servlet Controller] ──> [Role Access Check]
                                                     │
                                                     ▼
[Quiz Engine] <──── [JSP Dashboard Templates] <─── [MySQL DB Cluster]
`;
  } else if (projectId === 2) {
    archDesc.textContent = "The AWS VPC coordinates 5G cellular signaling packets through secure API Gateways, dispatching S3 logging buckets serverlessly.";
    archFlow.innerHTML = `
[5G Tower Client] ──> [Route 53 DNS] ──> [AWS VPC Gateway]
                                                │
                                                ▼
[AWS Lambda] <───── [EC2 Worker Cluster] <──── [Application Load Balancer]
      │
      ▼ (Archival)
[AWS S3 Logging]
`;
  } else {
    archDesc.textContent = "Siddhant's AWS deployment credentials cluster and telecom engineering paths.";
    archFlow.innerHTML = `
[B.Tech CS Engineering] ──> [SIH / Odoo Hackathons] ──> [TSSC 5G Training]
                                                                │
                                                                ▼
                                                     [AWS Cloud Practitioner]
`;
  }

  // Tech tags and specs
  const tagsContainer = document.getElementById('project-detail-tags')!;
  if (tagsContainer) {
    tagsContainer.innerHTML = '';
    detail.tags.forEach(tag => {
      const span = document.createElement('span');
      span.textContent = tag;
      tagsContainer.appendChild(span);
    });
  }

  const specsContainer = document.getElementById('project-detail-tech-specs')!;
  specsContainer.innerHTML = `
    <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem; color: #d1d5db;">
      <li><strong>Deploy Configuration:</strong> Automated production post-build verified.</li>
      <li><strong>Availability SLA:</strong> 99.98% High Availability Clustering.</li>
      <li><strong>Telemetry Layer:</strong> Integrated PromQL & Prometheus dashboards.</li>
    </ul>
  `;

  // Gallery Setup
  let currentImgIdx = 0;
  const activeImgEl = document.getElementById('gallery-active-img') as HTMLImageElement;
  const thumbsContainer = document.getElementById('gallery-thumbs')!;
  thumbsContainer.innerHTML = '';

  const updateGalleryView = () => {
    activeImgEl.classList.add('fade-out');
    setTimeout(() => {
      activeImgEl.src = detail.images[currentImgIdx];
      activeImgEl.classList.remove('fade-out');
      
      document.querySelectorAll('.thumb-item').forEach((thumb, idx) => {
        if (idx === currentImgIdx) {
          thumb.classList.add('active');
        } else {
          thumb.classList.remove('active');
        }
      });
    }, 200);
  };

  // Populate Thumbnails
  detail.images.forEach((imgSrc, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${imgSrc}" alt="Thumbnail ${idx}" />`;
    thumb.addEventListener('click', () => {
      currentImgIdx = idx;
      updateGalleryView();
    });
    thumbsContainer.appendChild(thumb);
  });

  if (detail.images.length > 0) {
    activeImgEl.src = detail.images[0];
  }

  const prevBtn = document.getElementById('gallery-prev-btn')!;
  const nextBtn = document.getElementById('gallery-next-btn')!;
  
  const onPrev = (e: Event) => {
    e.stopPropagation();
    currentImgIdx = (currentImgIdx - 1 + detail.images.length) % detail.images.length;
    updateGalleryView();
  };
  const onNext = (e: Event) => {
    e.stopPropagation();
    currentImgIdx = (currentImgIdx + 1) % detail.images.length;
    updateGalleryView();
  };

  prevBtn.replaceWith(prevBtn.cloneNode(true));
  nextBtn.replaceWith(nextBtn.cloneNode(true));

  document.getElementById('gallery-prev-btn')!.addEventListener('click', onPrev);
  document.getElementById('gallery-next-btn')!.addEventListener('click', onNext);

  // Tab Switching logic
  const tabButtons = document.querySelectorAll('.detail-tab-btn');
  const tabPanes = document.querySelectorAll('.project-tab-content');

  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanes.forEach(pane => pane.classList.remove('active'));
  
  document.querySelector('.detail-tab-btn[data-tab="tab-overview"]')!.classList.add('active');
  document.getElementById('tab-overview')!.classList.add('active');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTabId = (e.currentTarget as HTMLElement).getAttribute('data-tab')!;
      
      tabButtons.forEach(b => b.classList.remove('active'));
      (e.currentTarget as HTMLElement).classList.add('active');

      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === targetTabId) {
          pane.classList.add('active');
        }
      });
    });
  });
}

function flyToPlanet(projectId: number) {
  state.isSpaceTrip = true;
  state.isTransitioning = true;
  state.activeSpacePlanetIdx = projectId;

  let targetLandingPos: THREE.Vector3;
  if (projectId === 2) {
    state.currentPlanetHelipadIdx = Math.floor(Math.random() * 10);
    targetLandingPos = state.cityHelipads[state.currentPlanetHelipadIdx];
  } else {
    const dest = planetDestinations[projectId];
    const planetScale = 3.2;
    targetLandingPos = new THREE.Vector3(
      dest.center.x,
      dest.center.y + (dest.radius + 0.015) * planetScale + 0.04,
      dest.center.z
    );
  }

  const activeCard = document.querySelector('.info-card.active');
  if (activeCard) activeCard.classList.remove('active');

  const rotorControl = { value: state.rotorSpeed };
  gsap.to(rotorControl, {
    value: 0.45,
    duration: 1.5,
    ease: 'power1.in',
    onUpdate: () => {
      state.rotorSpeed = rotorControl.value;
    }
  });

  if (state.thrusterFireL && state.thrusterFireR) {
    gsap.to([state.thrusterFireL.scale, state.thrusterFireR.scale], {
      x: 1.0,
      y: 2.2,
      z: 1.0,
      duration: 1.8,
      ease: 'power2.out'
    });
  }

  const tl = gsap.timeline({
    onComplete: () => {
      setupProjectDetailTabsAndGallery(projectId);
      document.getElementById('project-detail-overlay')!.classList.add('active');
    }
  });



  // 1. Takeoff (radial lift-off along surface normal)
  const startHelicopterPos = state.helicopter.position.clone();
  const upDir = startHelicopterPos.clone().sub(GLOBE.center).normalize();
  const takeoffPos = startHelicopterPos.clone().add(upDir.multiplyScalar(6.8));

  tl.to(state.helicopter.position, {
    x: takeoffPos.x,
    y: takeoffPos.y,
    z: takeoffPos.z,
    duration: 1.6,
    ease: 'power1.inOut'
  });

  // 2. Rotate & Tilt
  const angleToPlanet = Math.atan2(targetLandingPos.x - startHelicopterPos.x, targetLandingPos.z - startHelicopterPos.z);
  tl.to(state.helicopter.rotation, {
    y: angleToPlanet,
    x: 0.25,
    duration: 1.2,
    ease: 'power1.inOut'
  }, '<+=0.6');

  // 3. Fly
  tl.to(state.helicopter.position, {
    x: targetLandingPos.x,
    y: targetLandingPos.y + 0.36,
    z: targetLandingPos.z,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '+=0.1');

  const isMobile = window.innerWidth < 768;
  const mobileMultiplier = isMobile ? 1.65 : 1.0;

  tl.to(state.camera.position, {
    x: targetLandingPos.x + 3.8 * mobileMultiplier,
    y: targetLandingPos.y + 2.0 * mobileMultiplier,
    z: targetLandingPos.z + 4.2 * mobileMultiplier,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '<');

  tl.to(state.controls.target, {
    x: targetLandingPos.x,
    y: targetLandingPos.y,
    z: targetLandingPos.z,
    duration: 3.5,
    ease: 'power2.inOut',
    onUpdate: () => state.controls.update()
  }, '<');

  // Colors to space night
  const spaceBgColor = new THREE.Color(0x020206);
  tl.to(state.scene.background, {
    r: spaceBgColor.r,
    g: spaceBgColor.g,
    b: spaceBgColor.b,
    duration: 3.0
  }, '<');

  tl.to(state.ambientLight, {
    intensity: 0.35,
    duration: 3.0
  }, '<');

  tl.to(state.sunLight, {
    intensity: 0.0,
    duration: 3.0
  }, '<');

  tl.to(state.moonLight, {
    intensity: 0.0,
    duration: 3.0
  }, '<');

  tl.to(state.starPoints.material, {
    opacity: 1.0,
    duration: 3.0
  }, '<');

  tl.to(state.planetGroup.scale, {
    x: 1.0,
    y: 1.0,
    z: 1.0,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '<');

  const targetScale = (projectId === 2) ? 2.2 : 3.2;
  tl.to(state.planetList[projectId].scale, {
    x: targetScale,
    y: targetScale,
    z: targetScale,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '<');

  if (projectId === 2) {
    tl.to(state.cityGroup.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 3.5,
      ease: 'power2.inOut'
    }, '<');
  }

  // 4. Slow down & land
  tl.to(state.helicopter.rotation, {
    x: 0.05,
    duration: 1.0,
    ease: 'power1.out'
  }, '+=0.1');

  if (state.thrusterFireL && state.thrusterFireR) {
    tl.to([state.thrusterFireL.scale, state.thrusterFireR.scale], {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 1.0
    }, '<');
  }

  tl.to(rotorControl, {
    value: 0.08,
    duration: 1.5,
    ease: 'power1.out',
    onUpdate: () => {
      state.rotorSpeed = rotorControl.value;
    }
  }, '<');

  tl.to(state.helicopter.position, {
    y: targetLandingPos.y,
    duration: 1.2,
    ease: 'power1.inOut'
  }, '<');
}

function returnToEarth() {
  document.getElementById('project-detail-overlay')!.classList.remove('active');

  const projectId = state.activeSpacePlanetIdx;
  let targetLandingPos: THREE.Vector3;
  if (projectId === 2) {
    targetLandingPos = state.cityHelipads[state.currentPlanetHelipadIdx];
  } else {
    const dest = planetDestinations[projectId];
    const planetScale = 3.2;
    targetLandingPos = new THREE.Vector3(
      dest.center.x,
      dest.center.y + (dest.radius + 0.015) * planetScale + 0.04,
      dest.center.z
    );
  }

  const rotorControl = { value: state.rotorSpeed };
  gsap.to(rotorControl, {
    value: 0.45,
    duration: 1.2,
    ease: 'power1.in',
    onUpdate: () => {
      state.rotorSpeed = rotorControl.value;
    }
  });

  if (state.thrusterFireL && state.thrusterFireR) {
    gsap.to([state.thrusterFireL.scale, state.thrusterFireR.scale], {
      x: 1.0,
      y: 2.2,
      z: 1.0,
      duration: 1.2,
      ease: 'power2.out'
    });
  }

  const landPos = new THREE.Vector3();
  const h_l = GLOBE.radius + 0.32;
  const rel_l = new THREE.Vector3(-16.0, GLOBE.radius, -4.0);
  rel_l.normalize().multiplyScalar(h_l);
  landPos.addVectors(GLOBE.center, rel_l);

  const angleToAirport = Math.atan2(landPos.x - targetLandingPos.x, landPos.z - targetLandingPos.z);
  gsap.to(state.helicopter.rotation, {
    y: angleToAirport,
    x: 0.25,
    duration: 1.0,
    ease: 'power1.inOut',
    delay: 0.5
  });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(state.helicopter.position, {
        x: landPos.x,
        y: landPos.y,
        z: landPos.z,
        duration: 1.8,
        ease: 'power1.inOut',
        onComplete: () => {
          gsap.to(rotorControl, {
            value: 0.0,
            duration: 1.8,
            ease: 'power1.out',
            onUpdate: () => {
              state.rotorSpeed = rotorControl.value;
            }
          });

          state.currentRoom = 'home';
          state.isSpaceTrip = false;
          state.isTransitioning = false;

          // Reactivate navigation panel & button highlights
          document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
          const homeBtn = document.getElementById('btn-home');
          if (homeBtn) homeBtn.classList.add('active');

          const panels = document.querySelectorAll('.info-card');
          panels.forEach(p => p.classList.remove('active'));
          const lobbyPanel = document.querySelector(`.info-card[id-panel="home"]`);
          if (lobbyPanel) lobbyPanel.classList.add('active');
        }
      });

      const qStart = state.helicopter.quaternion.clone();
      const qEnd = state.helicopter.userData.originalQ;
      const qProxy = { t: 0 };
      gsap.to(qProxy, {
        t: 1.0,
        duration: 1.2,
        onUpdate: () => {
          state.helicopter.quaternion.slerpQuaternions(qStart, qEnd, qProxy.t);
        },
        ease: 'power1.inOut'
      });

      if (state.thrusterFireL && state.thrusterFireR) {
        gsap.to([state.thrusterFireL.scale, state.thrusterFireR.scale], {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 1.2
        });
      }
    }
  });

  // 1. Takeoff from planet
  tl.to(state.helicopter.position, {
    y: targetLandingPos.y + 1.2,
    duration: 1.2,
    ease: 'power1.inOut'
  });

  // 2. Flight back
  tl.to(state.helicopter.position, {
    x: -3.75,
    y: HEIGHTS.second + 4.8,
    z: 0,
    duration: 3.8,
    ease: 'power2.inOut'
  }, '+=0.1');

  const targetView = {
    position: new THREE.Vector3(-16.5, 12.0, 19.5),
    target: new THREE.Vector3(0.0, 2.2, 0.0)
  };
  const isMobile = window.innerWidth < 768;
  const mobileMultiplier = isMobile ? 1.65 : 1.0;

  const destRel = new THREE.Vector3().subVectors(targetView.position, targetView.target).multiplyScalar(mobileMultiplier);
  const destCamPos = new THREE.Vector3().addVectors(targetView.target, destRel);

  tl.to(state.camera.position, {
    x: destCamPos.x,
    y: destCamPos.y,
    z: destCamPos.z,
    duration: 3.8,
    ease: 'power2.inOut'
  }, '<');

  tl.to(state.controls.target, {
    x: targetView.target.x,
    y: targetView.target.y,
    z: targetView.target.z,
    duration: 3.8,
    ease: 'power2.inOut',
    onUpdate: () => state.controls.update()
  }, '<');

  // Restore env colors
  const bgThemeColor = new THREE.Color(state.isDarkMode ? 0x090a14 : 0xfaf8f5);
  tl.to(state.scene.background, {
    r: bgThemeColor.r,
    g: bgThemeColor.g,
    b: bgThemeColor.b,
    duration: 3.2
  }, '<');

  tl.to(state.ambientLight, {
    intensity: state.isDarkMode ? 0.85 : 1.2,
    duration: 3.2
  }, '<');

  const ambientThemeColor = new THREE.Color(state.isDarkMode ? 0x6c7cb8 : 0xfff6eb);
  tl.to(state.ambientLight.color, {
    r: ambientThemeColor.r,
    g: ambientThemeColor.g,
    b: ambientThemeColor.b,
    duration: 3.2
  }, '<');

  tl.to(state.sunLight, {
    intensity: state.isDarkMode ? 0.0 : 1.4,
    duration: 3.2
  }, '<');

  tl.to(state.moonLight, {
    intensity: state.isDarkMode ? 2.0 : 0.0,
    duration: 3.2
  }, '<');

  tl.to(state.starPoints.material, {
    opacity: state.isDarkMode ? 1.0 : 0.0,
    duration: 3.2
  }, '<');

  if (projectId === 2) {
    tl.to(state.cityGroup.scale, {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 3.8,
      ease: 'power2.inOut'
    }, '<');
  }

  tl.to(state.planetList[projectId].scale, {
    x: 1.0,
    y: 1.0,
    z: 1.0,
    duration: 3.8,
    ease: 'power2.inOut'
  }, '<');

  tl.to(state.planetGroup.scale, {
    x: state.isDarkMode ? 1.0 : 0.001,
    y: state.isDarkMode ? 1.0 : 0.001,
    z: state.isDarkMode ? 1.0 : 0.001,
    duration: 3.8,
    onComplete: () => {
      // Re-enable globe exploration bounds after space trip completes
      state.controls.minDistance = GLOBE.radius + 2.0;
      state.controls.maxDistance = 250.0;
      state.controls.maxPolarAngle = Math.PI;
      state.controls.minPolarAngle = 0;
      state.controls.update();
    },
    ease: 'power2.inOut'
  }, '<');
}

// -------------------------------------------------------
// Mobile Animated Website Controller
// Runs instead of 3D canvas on screens < 768px
// -------------------------------------------------------
function initMobileSite() {
  // ---- Particles ----
  const canvas = document.getElementById('mobile-particles') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx2d = canvas.getContext('2d')!;

  interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    r: number; alpha: number;
    color: string;
  }

  const PARTICLE_COLORS = ['#7c3aed', '#0ea5e9', '#e07a5f', '#a78bfa', '#38bdf8'];
  let particles: Particle[] = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawnParticle(): Particle {
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.2 - Math.random() * 0.4,
      r: 1.0 + Math.random() * 1.5,
      alpha: 0.15 + Math.random() * 0.45,
      color
    };
  }

  function initParticles() {
    particles = Array.from({ length: 80 }, spawnParticle);
  }

  function tickParticles() {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -8 || p.x < -8 || p.x > canvas.width + 8) {
        particles[i] = spawnParticle();
        particles[i].y = canvas.height + 8;
      }
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx2d.fillStyle = p.color;
      ctx2d.globalAlpha = p.alpha;
      ctx2d.fill();
      ctx2d.globalAlpha = 1.0;
    });
    requestAnimationFrame(tickParticles);
  }

  resizeCanvas();
  initParticles();
  tickParticles();
  window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

  // ---- Typewriter ----
  const typewriterEl = document.getElementById('mob-typewriter');
  if (typewriterEl) {
    const phrases = [
      '3D Experiences',
      'Microservices',
      'REST APIs',
      'Cloud Systems',
      'Full-Stack Apps',
      'Immersive Web'
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    const TYPING_SPEED = 90;
    const DELETING_SPEED = 45;
    const PAUSE_AT_END = 1800;
    const PAUSE_AT_START = 400;

    function typeStep() {
      if (!typewriterEl) return;
      const phrase = phrases[phraseIdx];
      if (!isDeleting) {
        typewriterEl.textContent = phrase.substring(0, charIdx + 1);
        charIdx++;
        if (charIdx === phrase.length) {
          isDeleting = true;
          setTimeout(typeStep, PAUSE_AT_END);
          return;
        }
        setTimeout(typeStep, TYPING_SPEED);
      } else {
        typewriterEl.textContent = phrase.substring(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(typeStep, PAUSE_AT_START);
          return;
        }
        setTimeout(typeStep, DELETING_SPEED);
      }
    }
    setTimeout(typeStep, 800);
  }

  // ---- Tab / Section switching ----
  function switchSection(sectionId: string) {
    // Deactivate all sections
    document.querySelectorAll('.mob-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.mob-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.mob-nav-link').forEach(l => l.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    document.querySelectorAll(`.mob-tab[data-section="${sectionId}"]`).forEach(t => t.classList.add('active'));
    document.querySelectorAll(`.mob-nav-link[data-section="${sectionId}"]`).forEach(l => l.classList.add('active'));

    // Close nav drawer
    document.getElementById('mob-nav-drawer')?.classList.remove('open');
  }

  // Tab bar clicks
  document.querySelectorAll('.mob-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const sid = (tab as HTMLElement).dataset.section;
      if (sid) switchSection(sid);
    });
  });

  // Nav drawer link clicks
  document.querySelectorAll('.mob-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const sid = (link as HTMLElement).dataset.section;
      if (sid) switchSection(sid);
    });
  });

  // "See My Work" button on hero
  document.getElementById('mob-see-work')?.addEventListener('click', () => {
    switchSection('mob-projects');
  });

  // ---- Hamburger menu ----
  const menuBtn = document.getElementById('mob-menu-btn');
  const drawer = document.getElementById('mob-nav-drawer');
  menuBtn?.addEventListener('click', () => {
    drawer?.classList.toggle('open');
  });
  // Close on outside tap
  document.addEventListener('click', (e) => {
    if (drawer?.classList.contains('open') &&
        !drawer.contains(e.target as Node) &&
        e.target !== menuBtn) {
      drawer.classList.remove('open');
    }
  });

  // ---- Contact form ----
  document.getElementById('mob-contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const success = document.getElementById('mob-form-success');
    if (success) {
      success.classList.add('visible');
      setTimeout(() => success.classList.remove('visible'), 4000);
    }
    (e.target as HTMLFormElement).reset();
  });
}

// Boot up — skip 3D on mobile
window.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth < 768) {
    initMobileSite();
  } else {
    init();
  }
});
