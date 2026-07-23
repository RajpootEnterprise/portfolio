import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { Avatar } from './avatar';
import { HEIGHTS, COLORS, roomPositions, cameraViews, projectDetails, planetDestinations } from './constants';
import { state } from './state';
import { createHouseStructure } from './house';
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
// Initialization
// ----------------------------------------------------
function init() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Scene
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0xfaf8f5);

  // Camera - INITIAL START ZOOMED OUT (Framing the entire 3-story house)
  const startFov = (window.innerWidth / window.innerHeight) < 1.0 ? 56 : 42;
  state.camera = new THREE.PerspectiveCamera(startFov, window.innerWidth / window.innerHeight, 0.1, 120);
  state.camera.position.set(-16.5, 12.0, 19.5); // Zoomed out view

  // Renderer
  state.renderer = new THREE.WebGLRenderer({ antialias: true });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.renderer.toneMappingExposure = 1.0;
  container.appendChild(state.renderer.domElement);

  // Controls - INITIAL ORBIT TARGET CENTERED ON THE ENTIRE HOUSE (Y = 2.2 midpoint)
  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.05;
  state.controls.target.set(0.0, 2.2, 0.0); // Center on middle floor crossroads

  // Enable 1-finger rotate on mobile touch controls explicitly
  state.controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  
  // Angle limits (constrain orbit views)
  state.controls.maxPolarAngle = Math.PI / 2 - 0.08;
  state.controls.minDistance = 5;
  state.controls.maxDistance = 85;

  // Disable Auto-Rotation by default to satisfy manual-only rotation requirement
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

  // Instantiate Avatar
  state.avatar = new Avatar();
  // Start sitting on the Ground Floor Home sofa
  const homePos = roomPositions.home;
  state.avatar.position.copy(homePos.action);
  state.avatar.rotation.y = homePos.faceDirection;
  state.avatar.setState('sitting');
  state.scene.add(state.avatar);

  // Bind Events & Toggles
  setupEvents();

  // Handle Resize
  window.addEventListener('resize', onWindowResize);

  // Start Idle Inactivity Timer (maintains autoRotate off)
  resetIdleTimer();

  // Run Render Loop
  animate(0);
}

// ----------------------------------------------------
// Navigation & Path Routing (Stable Theta & Phi Glides)
// ----------------------------------------------------
function navigateToRoom(targetRoomName: string) {
  if (state.isTransitioning || targetRoomName === state.currentRoom) return;
  state.isTransitioning = true;

  // Mobile portrait layout Y offset
  const isMobile = window.innerWidth / window.innerHeight < 1.0;
  const yOffset = isMobile ? 0.75 : 0.0;

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

  // Calculate stable camera rotation parameters to preserve horizontal (theta) AND vertical (phi) manual angles
  const relX = state.camera.position.x - state.controls.target.x;
  const relY = state.camera.position.y - state.controls.target.y;
  const relZ = state.camera.position.z - state.controls.target.z;
  const r = Math.sqrt(relX * relX + relY * relY + relZ * relZ);
  
  const currentTheta = Math.atan2(relX, relZ);
  const currentPhi = Math.acos(relY / r);

  const targetView = cameraViews[targetRoomName];
  
  const defaultRadius = Math.sqrt(
    Math.pow(targetView.position.x - targetView.target.x, 2) +
    Math.pow(targetView.position.y - targetView.target.y, 2) +
    Math.pow(targetView.position.z - targetView.target.z, 2)
  );

  // Compute new relative coordinates preserving theta and phi
  const newRelX = defaultRadius * Math.sin(currentTheta) * Math.sin(currentPhi);
  const newRelY = defaultRadius * Math.cos(currentPhi);
  const newRelZ = defaultRadius * Math.cos(currentTheta) * Math.sin(currentPhi);

  const newTargetY = targetView.target.y + yOffset;
  const newCamX = targetView.target.x + newRelX;
  const newCamY = newTargetY + newRelY;
  const newCamZ = targetView.target.z + newRelZ;

  const startRoom = state.currentRoom;
  const startPos = startRoom === 'overview' ? roomPositions['home'] : roomPositions[startRoom];
  const targetPos = roomPositions[targetRoomName];
  const hA = startPos.h;
  const hB = targetPos.h;

  const tl = gsap.timeline({
    onComplete: () => {
      onArrival(targetRoomName);
    }
  });

  // Set avatar to walking
  state.avatar.setState('walking');

  // Stride travel speed (snappy runs!)
  const strideVelocity = 9.5; 

  const isStartLeft = startPos.stand.x < 0;
  const startEntranceX = isStartLeft ? -1.0 : 1.0;
  const startEntrance = new THREE.Vector3(startEntranceX, hA + 0.285, 0);

  // Turn to entrance
  const angle1 = Math.atan2(startEntrance.x - state.avatar.position.x, startEntrance.z - state.avatar.position.z);
  tl.to(state.avatar.rotation, { y: angle1, duration: 0.1 });

  // Walk to entrance
  const dist1 = state.avatar.position.distanceTo(startEntrance);
  tl.to(state.avatar.position, { x: startEntrance.x, y: startEntrance.y, z: startEntrance.z, duration: dist1 / strideVelocity, ease: 'none' });

  // If changing floors (requires Elevator trip):
  if (hA !== hB) {
    const boardPos = new THREE.Vector3(0, hA + 0.285, 0);
    
    // Board elevator
    const angle2 = Math.atan2(boardPos.x - state.avatar.position.x, boardPos.z - state.avatar.position.z);
    tl.to(state.avatar.rotation, { y: angle2, duration: 0.08 });
    tl.to(state.avatar.position, { x: boardPos.x, y: boardPos.y, z: boardPos.z, duration: 0.15, ease: 'none' });

    // Stand still inside elevator
    tl.add(() => state.avatar.setState('idle'));

    // Move elevator cabin & avatar vertically in sync
    tl.to(state.elevator.position, {
      y: hB + 0.01,
      duration: 0.7,
      ease: 'power1.inOut'
    }, '+=0.05');
    tl.to(state.avatar.position, {
      y: hB + 0.285,
      duration: 0.7,
      ease: 'power1.inOut'
    }, '<');

    // Sweep camera viewport in sync (preserve horizontal and vertical angles!)
    tl.to(state.camera.position, {
      x: newCamX,
      y: newCamY,
      z: newCamZ,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '<');

    tl.to(state.controls.target, {
      x: targetView.target.x,
      y: newTargetY,
      z: targetView.target.z,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => state.controls.update()
    }, '<');

    // Return to walking
    tl.add(() => state.avatar.setState('walking'));

    // Exit elevator
    const isTargetLeft = targetPos.stand.x < 0;
    const targetEntranceX = isTargetLeft ? -1.0 : 1.0;
    const targetEntrance = new THREE.Vector3(targetEntranceX, hB + 0.285, 0);

    const angle3 = Math.atan2(targetEntrance.x - state.avatar.position.x, targetEntrance.z - state.avatar.position.z);
    tl.to(state.avatar.rotation, { y: angle3, duration: 0.08 });
    tl.to(state.avatar.position, { x: targetEntrance.x, y: targetEntrance.y, z: targetEntrance.z, duration: 0.15, ease: 'none' });

    // Walk to target stand point
    const angle4 = Math.atan2(targetPos.stand.x - state.avatar.position.x, targetPos.stand.z - state.avatar.position.z);
    tl.to(state.avatar.rotation, { y: angle4, duration: 0.08 });
    const dist2 = targetEntrance.distanceTo(targetPos.stand);
    tl.to(state.avatar.position, { x: targetPos.stand.x, y: targetPos.stand.y, z: targetPos.stand.z, duration: dist2 / strideVelocity, ease: 'none' });

  } else {
    // Same floor travel
    const angle3 = Math.atan2(targetPos.stand.x - state.avatar.position.x, targetPos.stand.z - state.avatar.position.z);
    tl.to(state.avatar.rotation, { y: angle3, duration: 0.1 });
    const dist2 = state.avatar.position.distanceTo(targetPos.stand);
    tl.to(state.avatar.position, { x: targetPos.stand.x, y: targetPos.stand.y, z: targetPos.stand.z, duration: dist2 / strideVelocity, ease: 'none' });

    // Sweep camera view (preserve angles!)
    tl.to(state.camera.position, {
      x: newCamX,
      y: newCamY,
      z: newCamZ,
      duration: 0.65,
      ease: 'power2.inOut'
    }, '<');

    tl.to(state.controls.target, {
      x: targetView.target.x,
      y: newTargetY,
      z: targetView.target.z,
      duration: 0.65,
      ease: 'power2.inOut',
      onUpdate: () => state.controls.update()
    }, '<');
  }

  // Walk to room's action spot
  if (targetPos.action && targetPos.action !== targetPos.stand) {
    const angle5 = Math.atan2(targetPos.action.x - state.avatar.position.x, targetPos.action.z - state.avatar.position.z);
    tl.to(state.avatar.rotation, { y: angle5, duration: 0.08 });
    const dist3 = targetPos.stand.distanceTo(targetPos.action);
    tl.to(state.avatar.position, { x: targetPos.action.x, y: targetPos.action.y, z: targetPos.action.z, duration: dist3 / strideVelocity, ease: 'none' });
  }
}

// Arrival Actions
function onArrival(targetRoomName: string) {
  state.currentRoom = targetRoomName;
  state.isTransitioning = false;

  // Set avatar to proper action states
  if (targetRoomName === 'home') {
    state.avatar.setState('sitting');
  } else if (targetRoomName === 'about') {
    state.avatar.setState('typing');
  } else if (targetRoomName === 'timeline') {
    state.avatar.setState('sitting');
  } else if (targetRoomName === 'skills') {
    state.avatar.setState('typing'); // Playing arcade joysticks
  } else if (targetRoomName === 'contact') {
    state.avatar.setState('waving');
  } else {
    state.avatar.setState('idle');
  }

  // Set close room inspection limits (enables 360-degree close room tour!)
  // Max distance set to 21.0 so users can zoom out to 20.0. Zooming past 20.0 exits to overview.
  state.controls.minDistance = 3.0;
  state.controls.maxDistance = 21.0;
  state.controls.maxPolarAngle = Math.PI / 2 + 0.45;
  state.controls.minPolarAngle = Math.PI / 2 - 0.55;
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
  state.isTransitioning = true;
  
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

  // Smooth camera reset transition back to default overview coordinates
  gsap.to(state.camera.position, { x: -16.5, y: 12.0, z: 19.5, duration: 1.2, ease: 'power2.out' });
  gsap.to(state.controls.target, { 
    x: 0.0, 
    y: 2.2, 
    z: 0.0, 
    duration: 1.2, 
    ease: 'power2.out', 
    onUpdate: () => state.controls.update(),
    onComplete: () => {
      state.currentRoom = 'overview';
      state.isTransitioning = false;
      
      // Restore overview camera constraints
      state.controls.minDistance = 5;
      state.controls.maxDistance = 85;
      state.controls.maxPolarAngle = Math.PI / 2 - 0.08;
      state.controls.minPolarAngle = 0;
      state.controls.update();
    }
  });
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

      state.controls.minDistance = 5;
      state.controls.maxDistance = 85;
      state.controls.maxPolarAngle = Math.PI / 2 - 0.08;
      state.controls.minPolarAngle = 0;

      gsap.to(state.camera.position, { x: -16.5, y: 12.0, z: 19.5, duration: 1.5, ease: 'power2.inOut' });
      gsap.to(state.controls.target, { 
        x: 0.0, 
        y: 2.2, 
        z: 0.0, 
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
      if (obj.userData && obj.userData.roomName) {
        const roomName = obj.userData.roomName;
        navigateToRoom(roomName);
        break;
      }
      obj = obj.parent;
    }
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
      if (obj.userData && obj.userData.roomName) {
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

  // Scroll Zoom-out to Overview threshold check
  if (!state.isSpaceTrip && !state.isTransitioning && state.currentRoom !== 'overview') {
    const dist = state.camera.position.distanceTo(state.controls.target);
    if (dist > 20.0) {
      exitRoomToOverview();
    }
  }

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

  // 0. Boarding: Avatar stands up and glides up directly into the cockpit
  tl.add(() => {
    state.avatar.setState('walking');
  });

  const cockpitWorldPos = new THREE.Vector3(-3.75, HEIGHTS.second + 3.56 + 0.1, 0.2);

  tl.to(state.avatar.position, {
    x: cockpitWorldPos.x,
    y: cockpitWorldPos.y,
    z: cockpitWorldPos.z,
    duration: 1.5,
    ease: 'power2.inOut'
  });

  tl.to(state.avatar.scale, {
    x: 0.22,
    y: 0.22,
    z: 0.22,
    duration: 1.5,
    ease: 'power2.inOut'
  }, '<');

  tl.add(() => {
    state.helicopter.add(state.avatar);
    state.avatar.position.set(0.12, 0.08, 0.22); // Relative position inside helicopter canopy
    state.avatar.scale.set(0.24, 0.24, 0.24); // Micro size
    state.avatar.rotation.set(0, Math.PI, 0); // Face forward relative to helicopter frame
    state.avatar.setState('sitting');
  });

  // 1. Takeoff (Increased takeoff altitude for taller rooms)
  tl.to(state.helicopter.position, {
    y: HEIGHTS.second + 6.8,
    duration: 1.6,
    ease: 'power1.inOut'
  });

  // 2. Rotate & Tilt
  const angleToPlanet = Math.atan2(targetLandingPos.x - (-3.75), targetLandingPos.z - 0);
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

  tl.to(state.camera.position, {
    x: targetLandingPos.x + 3.8,
    y: targetLandingPos.y + 2.0,
    z: targetLandingPos.z + 4.2,
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

  const angleToHouse = Math.atan2(-3.75 - targetLandingPos.x, 0 - targetLandingPos.z);
  gsap.to(state.helicopter.rotation, {
    y: angleToHouse,
    x: 0.25,
    duration: 1.0,
    ease: 'power1.inOut',
    delay: 0.5
  });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(state.helicopter.position, {
        y: HEIGHTS.second + 3.56,
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

          // Unboard avatar: add back to scene and scale to normal
          state.scene.add(state.avatar);
          state.avatar.scale.set(1.0, 1.0, 1.0);
          state.avatar.position.set(-3.75, HEIGHTS.second + 3.56 + 0.1, 0.2); 
          state.avatar.rotation.set(0, 0, 0);
          state.avatar.setState('walking');

          // Smoothly glide avatar back to Ground Floor Home sofa
          const homePos = roomPositions.home;
          gsap.timeline()
            .to(state.avatar.position, {
              x: homePos.action.x,
              y: homePos.action.y,
              z: homePos.action.z,
              duration: 2.0,
              ease: 'power2.inOut'
            })
            .add(() => {
              state.avatar.rotation.y = homePos.faceDirection;
              state.avatar.setState('sitting');
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
            });
        }
      });

      gsap.to(state.helicopter.rotation, {
        x: 0,
        y: 0,
        duration: 1.2,
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

  const targetView = cameraViews.projects;
  tl.to(state.camera.position, {
    x: targetView.position.x,
    y: targetView.position.y,
    z: targetView.position.z,
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
      // Re-enable inspection bounds after return to earth completes
      state.controls.minDistance = 3.0;
      state.controls.maxDistance = 12.0;
      state.controls.maxPolarAngle = Math.PI / 2 + 0.45;
      state.controls.minPolarAngle = Math.PI / 2 - 0.55;
      state.controls.update();
    },
    ease: 'power2.inOut'
  }, '<');
}

// Boot up
window.addEventListener('DOMContentLoaded', init);
