import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { Avatar } from './avatar';

// ----------------------------------------------------
// Global Variables & State
// ----------------------------------------------------
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let avatar: Avatar;

// Raycasting & Cursors
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const interactiveObjects: THREE.Object3D[] = [];

// References to moving parts
let elevator: THREE.Group;
let mailboxFlag: THREE.Group;
let letterMesh: THREE.Mesh;

// References to environment elements
let sunGroup: THREE.Group;
let moonGroup: THREE.Group;
let planetGroup: THREE.Group;
let starPoints: THREE.Points;
let birdsGroup: THREE.Group;
const birdsList: THREE.Group[] = [];

// References to lights
let ambientLight: THREE.AmbientLight;
let sunLight: THREE.DirectionalLight;
let moonLight: THREE.DirectionalLight;
let streetLampLight: THREE.PointLight = undefined as any;
let fireplaceLight: THREE.PointLight = undefined as any;
let deskLampLight: THREE.PointLight = undefined as any;
const roomLights: THREE.PointLight[] = [];

// References to physical bulb meshes that turn on/off visually
const bulbMeshes: THREE.Mesh[] = [];

// References to interactive materials
const screens: THREE.Mesh[] = [];
let laptopScreenMesh: THREE.Mesh;
let arcadeScreenMesh: THREE.Mesh;
let fireplaceLogMesh: THREE.Mesh;

// Floating room labels list
const floatingLabels: THREE.Mesh[] = [];

// Floating tech shapes list
const floatingTechShapes: THREE.Mesh[] = [];

// Custom cursor state variables
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;
let cursorDotEl: HTMLElement | null = null;
let cursorRingEl: HTMLElement | null = null;

// State
let currentRoom = 'home';
let isTransitioning = false;
let isDarkMode = false;
let idleTimer: number;

// Height levels for floors
const HEIGHTS = {
  ground: 0.0,
  first: 2.2,
  second: 4.4
};

// Room Coordinates
interface RoomPosition {
  stand: THREE.Vector3;
  action: THREE.Vector3;
  h: number; // Floor height
  faceDirection: number; // Idle Y rotation angle
  labelName: string;
}

const roomPositions: Record<string, RoomPosition> = {
  home: {
    stand: new THREE.Vector3(-3.5, HEIGHTS.ground, 1.2),
    action: new THREE.Vector3(-4.8, HEIGHTS.ground + 0.35, 1.2), // Couch sitting
    h: HEIGHTS.ground,
    faceDirection: Math.PI / 2,
    labelName: 'Lobby'
  },
  contact: {
    stand: new THREE.Vector3(3.5, HEIGHTS.ground, 1.2),
    action: new THREE.Vector3(2.2, HEIGHTS.ground, 1.2), // Waving at mailbox
    h: HEIGHTS.ground,
    faceDirection: -Math.PI / 4,
    labelName: 'Patio Garden'
  },
  about: {
    stand: new THREE.Vector3(-3.5, HEIGHTS.first, -0.6),
    action: new THREE.Vector3(-3.5, HEIGHTS.first + 0.28, -1.8), // Chair sitting typing
    h: HEIGHTS.first,
    faceDirection: 0,
    labelName: 'Study Office'
  },
  timeline: {
    stand: new THREE.Vector3(3.5, HEIGHTS.first, -0.6),
    action: new THREE.Vector3(3.5, HEIGHTS.first + 0.3, -1.8), // Armchair sitting
    h: HEIGHTS.first,
    faceDirection: Math.PI / 4,
    labelName: 'Library Timeline'
  },
  projects: {
    stand: new THREE.Vector3(-3.5, HEIGHTS.second, -0.6),
    action: new THREE.Vector3(-3.5, HEIGHTS.second, -0.6), // Examining screens
    h: HEIGHTS.second,
    faceDirection: 0,
    labelName: 'Workshop Projects'
  },
  skills: {
    stand: new THREE.Vector3(3.5, HEIGHTS.second, -0.6),
    action: new THREE.Vector3(4.8, HEIGHTS.second, -1.0), // Playing Arcade Cabinet
    h: HEIGHTS.second,
    faceDirection: Math.PI / 2,
    labelName: 'Arcade Skills'
  }
};

// Camera Views (Framing each room uniquely)
interface CameraView {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const cameraViews: Record<string, CameraView> = {
  home: {
    position: new THREE.Vector3(-10, 8, 12),
    target: new THREE.Vector3(-3.5, 0.8, 1.2)
  },
  contact: {
    position: new THREE.Vector3(10, 8, 12),
    target: new THREE.Vector3(3.5, 0.8, 1.2)
  },
  about: {
    position: new THREE.Vector3(-10, 10.2, 8),
    target: new THREE.Vector3(-3.5, 3.0, -0.6)
  },
  timeline: {
    position: new THREE.Vector3(10, 10.2, 8),
    target: new THREE.Vector3(3.5, 3.0, -0.6)
  },
  projects: {
    position: new THREE.Vector3(-10, 12.4, 8),
    target: new THREE.Vector3(-3.5, 5.2, -0.6)
  },
  skills: {
    position: new THREE.Vector3(10, 12.4, 8),
    target: new THREE.Vector3(3.5, 5.2, -0.6)
  }
};

// Colors palette
const COLORS = {
  houseBase: 0xebdcb9,
  floorLightLeft: 0xfae1cd,      // Cream carpet (Home)
  floorLightRight: 0xa2c89f,     // Grass patio (Contact)
  floorWood: 0xb58a63,           // Study wood floor
  floorTimeline: 0xe5e5e5,       // Warm library tiles
  floorProjects: 0xa8dadc,       // Tech workshop blue tiles
  floorArcade: 0xf4f1de,         // Arcade terrazzo
  wallPlaster: 0xfaf9f6,
  wallTrim: 0x5c4033,
  sofa: 0xe07a5f,                // Terracotta
  woodFurniture: 0x7f5539,       // Dark oak
  screenOff: 0x222222,           // Dark screen
  screenOn: 0x81b29a,            // Glowing teal/green
  neonCore: 0xe8c547,            // Glowing yellow
  arcadeMarquee: 0xe07a5f,       // Red arcade details
  fireGlow: 0xd9381e,            // Orange embers
  leaves: 0x52b788,              // Leaf green
  trunk: 0x7f5539,               // Bark brown
  lampPost: 0x2f3e46,            // Charcoal metal
  lampLight: 0xffe699            // Soft yellow bulb
};

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
function init() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf8f5);

  // Camera - INITIAL START ZOOMED OUT (Framing the entire 3-story house)
  const startFov = (window.innerWidth / window.innerHeight) < 1.0 ? 56 : 42;
  camera = new THREE.PerspectiveCamera(startFov, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(-16.5, 12.0, 19.5); // Zoomed out view

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // Controls - INITIAL ORBIT TARGET CENTERED ON THE ENTIRE HOUSE (Y = 2.2 midpoint)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0.0, 2.2, 0.0); // Center on middle floor crossroads

  // Enable 1-finger rotate on mobile touch controls explicitly
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  
  // Angle limits (constrain orbit views)
  controls.maxPolarAngle = Math.PI / 2 - 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 30;

  // Enable Auto-Rotation by default to rotate the whole house on load
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

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

  // Instantiate Avatar
  avatar = new Avatar();
  // Start sitting on the Ground Floor Home sofa
  const homePos = roomPositions.home;
  avatar.position.copy(homePos.action);
  avatar.rotation.y = homePos.faceDirection;
  avatar.setState('sitting');
  scene.add(avatar);

  // Bind Events & Toggles
  setupEvents();

  // Handle Resize
  window.addEventListener('resize', onWindowResize);

  // Start Idle Inactivity Timer
  resetIdleTimer();

  // Grab custom cursor elements and bind track actions (PC only)
  cursorDotEl = document.getElementById('cursor-dot');
  cursorRingEl = document.getElementById('cursor-ring');

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorDotEl) {
      cursorDotEl.style.left = mouseX + 'px';
      cursorDotEl.style.top = mouseY + 'px';
    }
  });

  const attachCursorHoverListeners = () => {
    const selectors = 'a, button, .nav-btn, .project-card, .theme-toggle, .widget-toggle-btn, .widget-btn, .widget-btn-room';
    document.querySelectorAll(selectors).forEach(el => {
      if (el.getAttribute('data-cursor-bound') === 'true') return;
      el.setAttribute('data-cursor-bound', 'true');
      
      el.addEventListener('mouseenter', () => {
        if (cursorRingEl) cursorRingEl.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        if (cursorRingEl) cursorRingEl.classList.remove('hover');
      });
    });
  };
  attachCursorHoverListeners();

  // Observe DOM changes to dynamic nodes
  const observer = new MutationObserver(attachCursorHoverListeners);
  observer.observe(document.body, { childList: true, subtree: true });

  // Run Render Loop
  animate(0);
}

// ----------------------------------------------------
// Lights Setup (including Physical bulb meshes)
// ----------------------------------------------------
function setupLights() {
  // Warm Ambient
  ambientLight = new THREE.AmbientLight(0xfff6eb, 1.2);
  scene.add(ambientLight);

  // Daylight Sun
  sunLight = new THREE.DirectionalLight(0xfff9e6, 1.4);
  sunLight.position.set(12, 18, 10);
  sunLight.castShadow = true;
  
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 40;
  
  const d = 12;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  // Moonlight - repositioned to shine on the front facade from the front-left
  moonLight = new THREE.DirectionalLight(0x8a9ec4, 0.0);
  moonLight.position.set(-12, 18, 14);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  scene.add(moonLight);

  // Helper to add interior ceiling spotlights along with a physical bulb fixture
  const addRoomSpot = (x: number, y: number, z: number) => {
    // 1. Point Light source: placed slightly below bulb center to prevent shadow self-occlusion!
    const spot = new THREE.PointLight(0xffecd2, 0.1, 7.5);
    spot.position.set(x, y - 0.15, z);
    spot.castShadow = true;
    spot.shadow.bias = -0.002;
    scene.add(spot);
    roomLights.push(spot);

    // 2. Physical Cone shade fixture (shadow casting disabled so it doesn't block the light)
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.1, 0.12, 8), fixtureMat);
    fixture.position.set(x, y + 0.06, z);
    fixture.castShadow = false;
    fixture.receiveShadow = false;
    scene.add(fixture);

    // 3. Physical Bulb Mesh (Starts dull off-duty grey, shadow casting disabled)
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), bulbMat);
    bulb.position.set(x, y, z);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    scene.add(bulb);
    bulbMeshes.push(bulb); // Save bulb reference
  };

  // Ceiling spots heights (slightly below the ceiling slabs)
  addRoomSpot(-3.5, 2.1, 1.2); // Home
  addRoomSpot(3.5, 2.1, 1.2);  // Contact
  addRoomSpot(-3.5, 4.3, -0.6); // About
  addRoomSpot(3.5, 4.3, -0.6);  // Timeline
  addRoomSpot(-3.5, 6.6, -0.6); // Projects
  addRoomSpot(3.5, 6.6, -0.6);  // Skills

  // Fireplace light (orange flickering embers glow in Timeline Library)
  fireplaceLight = new THREE.PointLight(COLORS.fireGlow, 0.0, 4.0);
  fireplaceLight.position.set(5.5, HEIGHTS.first + 0.15, 0.2);
  fireplaceLight.castShadow = true;
  scene.add(fireplaceLight);

  // Street lamp light (warm spotlight on Patio Bench/Mailbox)
  streetLampLight = new THREE.PointLight(COLORS.lampLight, 0.1, 6.0);
  streetLampLight.position.set(5.5, HEIGHTS.ground + 2.06, 2.48);
  streetLampLight.castShadow = true;
  scene.add(streetLampLight);

  // Study desk lamp light (warm soft lighting on desk in About room)
  deskLampLight = new THREE.PointLight(0xffecd2, 0.0, 3.0);
  deskLampLight.position.set(-4.2, HEIGHTS.first + 1.06, -2.23);
  deskLampLight.castShadow = true;
  scene.add(deskLampLight);
}

// ----------------------------------------------------
// Build 3-Story Slabs, Columns & Timber Roof
// ----------------------------------------------------
function createHouseStructure() {
  const slabH = 0.12;
  const slabMat = new THREE.MeshStandardMaterial({ color: COLORS.houseBase, roughness: 0.85 });

  // 1. Concrete ground base
  const groundBase = new THREE.Mesh(new THREE.BoxGeometry(14.6, slabH, 7.6), slabMat);
  groundBase.position.set(0, -slabH / 2, 0);
  groundBase.receiveShadow = true;
  scene.add(groundBase);

  // Helper to add Floor Slabs per quadrant
  const addFloorSlab = (w: number, d: number, px: number, py: number, pz: number, color: number, rough = 0.8, roomName: string) => {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(w, slabH, d), 
      new THREE.MeshStandardMaterial({ color: color, roughness: rough })
    );
    floor.position.set(px, py - slabH / 2, pz);
    floor.receiveShadow = true;
    floor.userData = { roomName: roomName };
    scene.add(floor);
    interactiveObjects.push(floor);
  };

  // Ground Floor Rooms (Home & Patio)
  addFloorSlab(6.0, 7.0, -3.75, HEIGHTS.ground, 0, COLORS.floorLightLeft, 0.95, 'home');

  // Green grass tiles for Patio garden
  addFloorSlab(6.0, 7.0, 3.75, HEIGHTS.ground, 0, COLORS.floorLightRight, 0.8, 'contact');
  // Decorative deck walkway path
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.02, 2.0),
      new THREE.MeshStandardMaterial({ color: COLORS.woodFurniture, roughness: 0.6 })
    );
    plank.position.set(1.2 + i * 0.44, HEIGHTS.ground + 0.015, 1.0);
    plank.receiveShadow = true;
    plank.userData = { roomName: 'contact' };
    scene.add(plank);
    interactiveObjects.push(plank);
  }

  // First Floor Rooms
  // Procedural wood planks for About Office
  for (let i = 0; i < 11; i++) {
    const plankColor = i % 2 === 0 ? 0xb58a63 : 0xa67c58;
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, slabH, 6.8),
      new THREE.MeshStandardMaterial({ color: plankColor, roughness: 0.6 })
    );
    plank.position.set(-6.5 + 0.27 + i * 0.55, HEIGHTS.first - slabH / 2, 0);
    plank.receiveShadow = true;
    plank.userData = { roomName: 'about' };
    scene.add(plank);
    interactiveObjects.push(plank);
  }

  // Ceramic grid tiles for Timeline Library
  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(1.08, slabH, 1.25),
        new THREE.MeshStandardMaterial({ color: COLORS.floorTimeline, roughness: 0.8 })
      );
      tile.position.set(0.75 + 0.54 + x * 1.18, HEIGHTS.first - slabH / 2, -3.0 + 0.62 + z * 1.35);
      tile.receiveShadow = true;
      tile.userData = { roomName: 'timeline' };
      scene.add(tile);
      interactiveObjects.push(tile);
    }
  }

  // Second Floor Rooms (Projects & Skills)
  addFloorSlab(6.0, 7.0, -3.75, HEIGHTS.second, 0, COLORS.floorProjects, 0.5, 'projects');
  addFloorSlab(6.0, 7.0, 3.75, HEIGHTS.second, 0, COLORS.floorArcade, 0.7, 'skills');

  // Decorative Baseboards Molding
  const addBaseboard = (w: number, px: number, py: number, pz: number, ry = 0, roomName: string) => {
    const baseboard = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.08, 0.02),
      new THREE.MeshStandardMaterial({ color: COLORS.wallTrim, roughness: 0.6 })
    );
    baseboard.position.set(px, py + 0.04, pz);
    baseboard.rotation.y = ry;
    baseboard.userData = { roomName: roomName };
    scene.add(baseboard);
  };

  for (let y of [HEIGHTS.ground, HEIGHTS.first, HEIGHTS.second]) {
    const roomLeft = y === HEIGHTS.ground ? 'home' : (y === HEIGHTS.first ? 'about' : 'projects');
    const roomRight = y === HEIGHTS.ground ? 'contact' : (y === HEIGHTS.first ? 'timeline' : 'skills');
    addBaseboard(2.6, -0.11, y, 2.15, -Math.PI / 2, roomLeft);
    addBaseboard(2.6, -0.11, y, -2.15, -Math.PI / 2, roomLeft);
    addBaseboard(2.6, 0.11, y, 2.15, Math.PI / 2, roomRight);
    addBaseboard(2.6, 0.11, y, -2.15, Math.PI / 2, roomRight);
  }

  // 2. Central Elevator Rails
  const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 6.0, 8);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
  
  const railPositions = [
    [-0.65, 0.65],
    [-0.65, -0.65],
    [0.65, 0.65],
    [0.65, -0.65]
  ];

  railPositions.forEach(pos => {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(pos[0], 2.8, pos[1]);
    rail.castShadow = true;
    scene.add(rail);
  });

  // 3. Central Elevator Platform
  elevator = new THREE.Group();
  const platformBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 }));
  platformBase.position.y = 0.04;
  platformBase.castShadow = true;
  platformBase.receiveShadow = true;
  elevator.add(platformBase);

  // Glass panel side rails
  const glassRailMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    transmission: 0.9,
    ior: 1.5,
    thickness: 0.1,
    roughness: 0.1
  });
  const railCapMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const addGlassRail = (w: number, h: number, d: number, px: number, py: number, pz: number, ry = 0) => {
    const railGroup = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassRailMat);
    panel.position.y = h / 2;
    railGroup.add(panel);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.03, d + 0.02), railCapMat);
    cap.position.y = h + 0.015;
    railGroup.add(cap);

    railGroup.position.set(px, py, pz);
    railGroup.rotation.y = ry;
    elevator.add(railGroup);
  };

  addGlassRail(1.18, 0.8, 0.04, 0, 0.08, -0.58);
  addGlassRail(1.18, 0.8, 0.04, -0.58, 0.08, 0, Math.PI / 2);
  addGlassRail(1.18, 0.8, 0.04, 0.58, 0.08, 0, Math.PI / 2);

  elevator.position.set(0, 0.01, 0);
  scene.add(elevator);

  // 4. Room Partition Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wallPlaster, roughness: 0.95 });
  const trimMat = new THREE.MeshStandardMaterial({ color: COLORS.wallTrim, roughness: 0.6 });

  const addPartitionWall = (yLevel: number) => {
    const buildWallSeg = (w: number, px: number, pz: number, hasWindow = false) => {
      const wallGroup = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.5, 0.2), wallMat);
      wall.position.y = 0.75;
      wall.castShadow = true;
      wall.receiveShadow = true;
      wallGroup.add(wall);

      if (hasWindow) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.24), trimMat);
        frame.position.set(0, 0.8, 0);
        wallGroup.add(frame);

        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.6, 0.08),
          new THREE.MeshPhysicalMaterial({ color: 0xc3e6fc, transparent: true, opacity: 0.45, transmission: 0.8 })
        );
        glass.position.set(0, 0.8, 0);
        wallGroup.add(glass);
      }

      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.04, 0.24), trimMat);
      trim.position.y = 1.52;
      trim.castShadow = true;
      wallGroup.add(trim);

      wallGroup.position.set(px, yLevel, pz);
      scene.add(wallGroup);
    };

    buildWallSeg(2.6, 0, 2.15, false);
    buildWallSeg(2.6, 0, -2.15, true);
  };

  addPartitionWall(HEIGHTS.ground);
  addPartitionWall(HEIGHTS.first);
  addPartitionWall(HEIGHTS.second);

  // 5. Open Pitched Timber Truss Roof
  const roofY = HEIGHTS.second + 1.5; // Y = 5.9
  const peakY = roofY + 1.25; // Y = 7.15
  const roofWoodMat = new THREE.MeshStandardMaterial({ color: COLORS.woodFurniture, roughness: 0.85 });

  const buildTruss = (z: number) => {
    const truss = new THREE.Group();
    
    const tie = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.08, 0.08), roofWoodMat);
    tie.position.y = roofY;
    tie.castShadow = true;
    truss.add(tie);

    const king = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), roofWoodMat);
    king.position.set(0, roofY + 0.6, 0);
    king.castShadow = true;
    truss.add(king);

    const leftRafter = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.06, 0.06), roofWoodMat);
    leftRafter.position.set(-3.65, roofY + 0.625, 0);
    leftRafter.rotation.z = Math.atan2(1.25, 7.3);
    leftRafter.castShadow = true;
    truss.add(leftRafter);

    const rightRafter = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.06, 0.06), roofWoodMat);
    rightRafter.position.set(3.65, roofY + 0.625, 0);
    rightRafter.rotation.z = -Math.atan2(1.25, 7.3);
    rightRafter.castShadow = true;
    truss.add(rightRafter);

    truss.position.z = z;
    scene.add(truss);
  };

  buildTruss(-3.5);
  buildTruss(0.0);
  buildTruss(3.5);

  const buildPurlin = (x: number, y: number) => {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 7.2), roofWoodMat);
    purlin.position.set(x, y, 0);
    purlin.castShadow = true;
    scene.add(purlin);
  };

  buildPurlin(0, peakY + 0.04);
  buildPurlin(-3.65, roofY + 0.625);
  buildPurlin(3.65, roofY + 0.625);

  // 6. Hanging Light Fixtures with Lightbulbs
  const addHangingLamp = (x: number, y: number, z: number, length: number) => {
    const lamp = new THREE.Group();
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    
    // Wire cord
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, length), cordMat);
    cord.position.y = -length / 2;
    lamp.add(cord);
    
    // Cone shade
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 }));
    shade.position.y = -length - 0.07;
    shade.castShadow = true;
    lamp.add(shade);

    // Glowing lightbulb (Starts off-duty grey)
    const glowBulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0x666666 }));
    glowBulb.position.y = -length - 0.12;
    lamp.add(glowBulb);
    bulbMeshes.push(glowBulb); // Save bulb reference

    lamp.position.set(x, y, z);
    scene.add(lamp);
  };

  // Hang lamps in top floor rooms (from ridge Y=7.15)
  addHangingLamp(-3.5, peakY, -0.6, 0.45); // Projects Lab
  addHangingLamp(3.5, peakY, -0.6, 0.45);  // Skills Arcade
}

// ----------------------------------------------------
// Model Furniture & Props for 6 Rooms (Premium Details)
// ----------------------------------------------------
function createRoomProps() {
  const legM = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
  const leafMat = new THREE.MeshLambertMaterial({ color: COLORS.leaves });
  const woodFurnitureMat = new THREE.MeshStandardMaterial({ color: COLORS.woodFurniture, roughness: 0.75 });

  const addPropToScene = (mesh: THREE.Object3D, roomName: string) => {
    mesh.traverse((child: THREE.Object3D) => {
      child.userData = { roomName: roomName };
      if (child instanceof THREE.Mesh) {
        interactiveObjects.push(child);
      }
    });
    scene.add(mesh);
  };

  // ----------------------------------------------------
  // GROUND LEFT: HOME (LIVING ROOM)
  // ----------------------------------------------------
  const sofaGroup = new THREE.Group();
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 0.9), new THREE.MeshStandardMaterial({ color: COLORS.sofa, roughness: 0.85 }));
  sofaBase.position.y = 0.125;
  sofaBase.castShadow = true;
  sofaBase.receiveShadow = true;
  sofaGroup.add(sofaBase);

  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.22), new THREE.MeshStandardMaterial({ color: COLORS.sofa, roughness: 0.85 }));
  sofaBack.position.set(0, 0.45, -0.34);
  sofaBack.castShadow = true;
  sofaGroup.add(sofaBack);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.9), new THREE.MeshStandardMaterial({ color: COLORS.sofa, roughness: 0.85 }));
  armL.position.set(-1.0, 0.25, 0);
  armL.castShadow = true;
  sofaGroup.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.9), new THREE.MeshStandardMaterial({ color: COLORS.sofa, roughness: 0.85 }));
  armR.position.set(1.0, 0.25, 0);
  armR.castShadow = true;
  sofaGroup.add(armR);
  
  // Cushions
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xfdf0d5, roughness: 0.8 });
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.15), pillowMat);
  pillow1.position.set(-0.7, 0.3, -0.15);
  pillow1.rotation.set(0.1, 0.2, -0.15);
  sofaGroup.add(pillow1);
  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.15), pillowMat);
  pillow2.position.set(0.7, 0.3, -0.15);
  pillow2.rotation.set(0.1, -0.2, 0.15);
  sofaGroup.add(pillow2);

  sofaGroup.position.set(-4.8, HEIGHTS.ground, 1.2);
  sofaGroup.rotation.y = Math.PI / 2;
  addPropToScene(sofaGroup, 'home');

  // Rug & Coffee Table
  const tableGroup = new THREE.Group();
  const topMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: COLORS.houseBase, roughness: 0.6 }));
  topMesh.position.y = 0.28;
  topMesh.castShadow = true;
  tableGroup.add(topMesh);
  
  for (let x of [-0.34, 0.34]) {
    for (let z of [-0.54, 0.54]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28), legM);
      leg.position.set(x, 0.14, z);
      leg.castShadow = true;
      tableGroup.add(leg);
    }
  }
  
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0xe07a5f }));
  mug.position.set(0.1, 0.32, 0.15);
  tableGroup.add(mug);
  
  tableGroup.position.set(-3.2, HEIGHTS.ground, 1.2);
  addPropToScene(tableGroup, 'home');

  // Planter Plant
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.34, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  pot.position.y = 0.17;
  pot.castShadow = true;
  plant.add(pot);
  
  for (let i = 0; i < 4; i++) {
    const stem = new THREE.Group();
    stem.position.set(0, 0.28, 0);
    stem.rotation.z = 0.25;
    stem.rotation.y = (i * Math.PI) / 2 + 0.4;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), leafMat);
    leaf.position.y = 0.22;
    leaf.scale.set(1.4, 0.04, 0.7);
    leaf.castShadow = true;
    stem.add(leaf);
    plant.add(stem);
  }
  plant.position.set(-5.8, HEIGHTS.ground, 2.8);
  addPropToScene(plant, 'home');


  // ----------------------------------------------------
  // GROUND RIGHT: CONTACT (PATIO GARDEN)
  // ----------------------------------------------------
  const mailGroup = new THREE.Group();
  const mailboxPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95), woodFurnitureMat);
  mailboxPost.position.y = 0.475;
  mailboxPost.castShadow = true;
  mailGroup.add(mailboxPost);

  const boxHousing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.46), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.45 }));
  boxHousing.position.y = 1.05;
  boxHousing.castShadow = true;
  mailGroup.add(boxHousing);

  const boxRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.46, 12, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x4f5d75 }));
  boxRoof.position.set(0, 1.2, 0);
  boxRoof.rotation.z = Math.PI;
  boxRoof.rotation.y = Math.PI / 2;
  boxRoof.castShadow = true;
  mailGroup.add(boxRoof);

  // Red Flag
  mailboxFlag = new THREE.Group();
  mailboxFlag.position.set(0.158, 1.05, -0.06);
  const flagPost = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.03), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  flagPost.position.y = 0.08;
  mailboxFlag.add(flagPost);
  const flagFin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: COLORS.sofa }));
  flagFin.position.set(0, 0.14, 0.025);
  mailboxFlag.add(flagFin);
  mailboxFlag.rotation.z = -Math.PI / 2.5;
  mailGroup.add(mailboxFlag);

  // Letter Popping Out
  letterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.28), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  letterMesh.position.set(0, 1.0, 0.18);
  letterMesh.rotation.x = 0.12;
  letterMesh.castShadow = true;
  mailGroup.add(letterMesh);

  mailGroup.position.set(2.2, HEIGHTS.ground, 1.2);
  addPropToScene(mailGroup, 'contact');

  // Garden fence
  const fenceGroup = new THREE.Group();
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  for (let z = -3.2; z <= 3.2; z += 0.8) {
    const postMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), fenceMat);
    postMesh.position.set(6.5, 0.225, z);
    postMesh.castShadow = true;
    fenceGroup.add(postMesh);
  }
  const railUpper = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 6.8), fenceMat);
  railUpper.position.set(6.5, 0.35, 0);
  const railLower = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 6.8), fenceMat);
  railLower.position.set(6.5, 0.15, 0);
  fenceGroup.add(railUpper);
  fenceGroup.add(railLower);
  
  const flowerColors = [0xe07a5f, 0xe8c547, 0x81b29a, 0xd9381e];
  for (let i = 0; i < 6; i++) {
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2), leafMat);
    stem.position.y = 0.1;
    flower.add(stem);
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] }));
    bud.position.y = 0.2;
    flower.add(bud);
    flower.position.set(5.0 + Math.random() * 1.0, HEIGHTS.ground, -1.0 + i * 0.4);
    fenceGroup.add(flower);
  }
  addPropToScene(fenceGroup, 'contact');

  // Street Lamp
  const streetLamp = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.3), new THREE.MeshStandardMaterial({ color: 0x2f3e46, roughness: 0.7 }));
  pole.position.y = 1.15;
  pole.castShadow = true;
  streetLamp.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), new THREE.MeshStandardMaterial({ color: 0x2f3e46 }));
  arm.position.set(0, 2.2, -0.15);
  streetLamp.add(arm);

  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.28, 6), new THREE.MeshStandardMaterial({ color: 0x2f3e46, roughness: 0.5 }));
  lantern.position.set(0, 2.12, -0.32);
  lantern.castShadow = true;
  streetLamp.add(lantern);

  // Street lamp bulb (glowing self-luminous basic mesh, saved to bulbMeshes!)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshBasicMaterial({ color: 0x666666 }));
  bulb.position.set(0, 2.06, -0.32);
  streetLamp.add(bulb);
  bulbMeshes.push(bulb); // Save bulb reference
  
  streetLamp.position.set(5.5, HEIGHTS.ground, 2.8);
  addPropToScene(streetLamp, 'contact');

  // Garden Bench
  const bench = new THREE.Group();
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.56), legM);
  legL.position.set(-0.6, 0.19, 0);
  legL.castShadow = true;
  bench.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.56), legM);
  legR.position.set(0.6, 0.19, 0);
  legR.castShadow = true;
  bench.add(legR);
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.14), woodFurnitureMat);
    slat.position.set(0, 0.39, -0.15 + i * 0.15);
    slat.castShadow = true;
    bench.add(slat);
  }
  bench.position.set(4.2, HEIGHTS.ground, 2.2);
  scene.add(bench);


  // ----------------------------------------------------
  // FIRST LEFT: ABOUT (STUDY OFFICE)
  // ----------------------------------------------------
  const deskGroup = new THREE.Group();
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.95), woodFurnitureMat);
  deskTop.position.y = 0.7;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);
  for (let x of [-0.85, 0.85]) {
    for (let z of [-0.3, 0.3]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.66), legM);
      leg.position.set(x, 0.33, z);
      leg.castShadow = true;
      deskGroup.add(leg);
    }
  }
  
  const organizer = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.34), new THREE.MeshStandardMaterial({ color: 0xebdcb9 }));
  organizer.position.set(0.7, 0.76, 0.15);
  deskGroup.add(organizer);

  // Study Desk Lamp Fixture (Detail!)
  const deskLampGroup = new THREE.Group();
  const deskLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 8), legM);
  deskLampBase.position.y = 0.007;
  deskLampGroup.add(deskLampBase);
  const deskLampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34), legM);
  deskLampStem.position.set(0, 0.17, -0.04);
  deskLampStem.rotation.x = -0.22;
  deskLampGroup.add(deskLampStem);
  const deskLampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.09, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  deskLampShade.position.set(0, 0.34, -0.09);
  deskLampShade.rotation.x = 0.45;
  deskLampGroup.add(deskLampShade);
  
  // Desk lamp bulb mesh (Saved to bulbMeshes!)
  const deskLampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), new THREE.MeshBasicMaterial({ color: 0x666666 }));
  deskLampBulb.position.set(0, 0.30, -0.07);
  deskLampGroup.add(deskLampBulb);
  bulbMeshes.push(deskLampBulb); // Save bulb reference

  deskLampGroup.position.set(-0.7, 0.74, -0.15); // Place on desk
  deskGroup.add(deskLampGroup);

  deskGroup.position.set(-3.5, HEIGHTS.first, -1.8);
  addPropToScene(deskGroup, 'about');

  // Office Chair
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.48), new THREE.MeshStandardMaterial({ color: 0x2b2b2b }));
  seat.position.y = 0.42;
  seat.castShadow = true;
  chair.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.38, 0.05), new THREE.MeshStandardMaterial({ color: 0x2b2b2b }));
  back.position.set(0, 0.61, -0.2);
  back.castShadow = true;
  chair.add(back);
  const chairPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38), legM);
  chairPost.position.y = 0.19;
  chair.add(chairPost);
  chair.position.set(-3.5, HEIGHTS.first, -0.9);
  addPropToScene(chair, 'about');

  // Glowing Laptop
  const laptop = new THREE.Group();
  const lBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.24), new THREE.MeshStandardMaterial({ color: 0xc4c4c4, metalness: 0.8 }));
  lBase.position.y = 0.0075;
  laptop.add(lBase);
  laptopScreenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.015), new THREE.MeshBasicMaterial({ color: COLORS.screenOff }));
  laptopScreenMesh.position.set(0, 0.11, -0.11);
  laptopScreenMesh.rotation.x = -0.28;
  laptop.add(laptopScreenMesh);
  laptop.position.set(-3.5, HEIGHTS.first + 0.74, -1.8);
  addPropToScene(laptop, 'about');


  // ----------------------------------------------------
  // FIRST RIGHT: TIMELINE (COZY LIBRARY)
  // ----------------------------------------------------
  const fireplace = new THREE.Group();
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 0.45), new THREE.MeshStandardMaterial({ color: 0x5a3f24, roughness: 0.9 }));
  hearth.position.y = 0.55;
  hearth.castShadow = true;
  fireplace.add(hearth);
  
  const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.35), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  cavity.position.set(0, 0.3, 0.06);
  fireplace.add(cavity);
  
  fireplaceLogMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.16), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  fireplaceLogMesh.position.set(0, 0.05, 0.08);
  fireplace.add(fireplaceLogMesh);
  
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.35), new THREE.MeshStandardMaterial({ color: 0x5a3f24, roughness: 0.9 }));
  chimney.position.set(0, 1.75, 0.02);
  chimney.castShadow = true;
  fireplace.add(chimney);

  fireplace.position.set(5.5, HEIGHTS.first, 0.2);
  fireplace.rotation.y = -Math.PI / 2;
  addPropToScene(fireplace, 'timeline');

  // Library Armchair
  const armchair = new THREE.Group();
  const seatArm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), new THREE.MeshStandardMaterial({ color: 0x8c6239, roughness: 0.8 }));
  seatArm.position.y = 0.15;
  seatArm.castShadow = true;
  armchair.add(seatArm);
  const backArm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x8c6239, roughness: 0.8 }));
  backArm.position.set(0, 0.45, -0.28);
  backArm.castShadow = true;
  armchair.add(backArm);
  armchair.position.set(3.5, HEIGHTS.first, -1.5);
  armchair.rotation.y = Math.PI / 6;
  addPropToScene(armchair, 'timeline');


  // ----------------------------------------------------
  // SECOND LEFT: PROJECTS (TECH WORKSHOP)
  // ----------------------------------------------------
  const workbench = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.76, 0.8), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.45 }));
  workbench.position.set(-3.5, HEIGHTS.second + 0.38, -1.8);
  workbench.castShadow = true;
  workbench.receiveShadow = true;
  addPropToScene(workbench, 'projects');

  // Screens
  const sW = 0.72;
  const sH = 0.46;
  const xOffs = [-4.7, -3.5, -2.3];
  for (let i = 0; i < 3; i++) {
    const mon = new THREE.Group();
    
    const monitorPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12), legM);
    monitorPost.position.y = 0.06;
    monitorPost.castShadow = true;
    mon.add(monitorPost);
    
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.16), legM);
    base.position.y = 0.007;
    mon.add(base);

    const bez = new THREE.Mesh(new THREE.BoxGeometry(sW + 0.03, sH + 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    bez.position.y = 0.32;
    bez.castShadow = true;
    mon.add(bez);

    const disp = new THREE.Mesh(new THREE.BoxGeometry(sW, sH, 0.008), new THREE.MeshBasicMaterial({ color: COLORS.screenOff }));
    disp.position.set(0, 0.32, 0.016);
    mon.add(disp);
    screens.push(disp);

    mon.position.set(xOffs[i], HEIGHTS.second + 0.76, -1.85);
    mon.rotation.y = (i - 1) * 0.15;
    addPropToScene(mon, 'projects');
  }


  // ----------------------------------------------------
  // SECOND RIGHT: SKILLS (INTERACTIVE ARCADE)
  // ----------------------------------------------------
  const arcade = new THREE.Group();
  const arcBody = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.25, 0.65), new THREE.MeshStandardMaterial({ color: 0x3d405b, roughness: 0.6 }));
  arcBody.position.y = 0.625;
  arcBody.castShadow = true;
  arcade.add(arcBody);

  const panelControl = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  panelControl.position.set(0, 0.85, 0.26);
  panelControl.rotation.x = 0.18;
  arcade.add(panelControl);

  const marquee = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.18, 0.35), new THREE.MeshStandardMaterial({ color: COLORS.arcadeMarquee }));
  marquee.position.set(0, 1.28, 0.12);
  marquee.castShadow = true;
  arcade.add(marquee);

  arcadeScreenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.015), new THREE.MeshBasicMaterial({ color: COLORS.screenOff }));
  arcadeScreenMesh.position.set(0, 1.05, 0.16);
  arcadeScreenMesh.rotation.x = -0.22;
  arcade.add(arcadeScreenMesh);

  arcade.position.set(4.8, HEIGHTS.second, -1.2);
  arcade.rotation.y = -Math.PI / 2;
  addPropToScene(arcade, 'skills');

  // Arcade Cabinet Round Stool
  const stool = new THREE.Group();
  const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.8 }));
  stoolSeat.position.y = 0.44;
  stoolSeat.castShadow = true;
  stool.add(stoolSeat);
  
  const stoolLegGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.44);
  for (let angle of [0, Math.PI/2, Math.PI, Math.PI*1.5]) {
    const sLeg = new THREE.Mesh(stoolLegGeo, legM);
    sLeg.position.set(Math.cos(angle) * 0.12, 0.22, Math.sin(angle) * 0.12);
    sLeg.rotation.z = Math.cos(angle) * -0.15;
    sLeg.rotation.x = Math.sin(angle) * 0.15;
    sLeg.castShadow = true;
    stool.add(sLeg);
  }
  stool.position.set(3.8, HEIGHTS.second, -1.0);
  addPropToScene(stool, 'skills');

  // Floating rotating technical logo shapes above display pedestals
  const addTechPodium = (x: number, z: number, geom: THREE.BufferGeometry, color: number) => {
    const podiumGroup = new THREE.Group();
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xe5e5e5, roughness: 0.7 }));
    column.position.y = 0.3;
    column.castShadow = true;
    podiumGroup.add(column);
    
    const shape = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: color }));
    shape.position.y = 0.95;
    podiumGroup.add(shape);
    floatingTechShapes.push(shape);

    podiumGroup.position.set(x, HEIGHTS.second, z);
    addPropToScene(podiumGroup, 'skills');
  };

  addTechPodium(2.6, 1.2, new THREE.BoxGeometry(0.24, 0.24, 0.24), 0x5cdb5c);
  addTechPodium(4.4, 1.2, new THREE.TorusGeometry(0.15, 0.05, 8, 16), 0xe07a5f);
}

// ----------------------------------------------------
// Clickable Floating 3D Labels
// ----------------------------------------------------
function createRoomLabels() {
  const labelTextMap = {
    home: 'Home Lobby',
    contact: 'Mail Patio',
    about: 'Study Desk',
    timeline: 'Library',
    projects: 'Tech Workshop',
    skills: 'Retro Arcade'
  };

  const createTextTexture = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.roundRect ? ctx.roundRect(0, 0, 256, 64, 16) : ctx.rect(0, 0, 256, 64);
    ctx.fill();

    ctx.strokeStyle = '#3d405b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#3d405b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  Object.entries(roomPositions).forEach(([roomName, pos]) => {
    const labelGroup = new THREE.Group();

    const textTex = createTextTexture(labelTextMap[roomName as keyof typeof labelTextMap]);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.26),
      new THREE.MeshBasicMaterial({ map: textTex, transparent: true, side: THREE.DoubleSide })
    );
    board.position.y = 0.15;
    labelGroup.add(board);

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x3d405b })
    );
    labelGroup.add(rod);

    const floatY = pos.h + (roomName === 'home' || roomName === 'contact' ? 1.6 : 1.3);
    labelGroup.position.set(pos.stand.x, floatY, pos.stand.z);
    
    labelGroup.userData = { 
      roomName: roomName,
      baseY: floatY,
      phase: Math.random() * Math.PI 
    };

    labelGroup.traverse(child => {
      child.userData = { roomName: roomName };
      if (child instanceof THREE.Mesh) {
        interactiveObjects.push(child);
      }
    });

    scene.add(labelGroup);
    floatingLabels.push(labelGroup as any);
  });
}

// ----------------------------------------------------
// Model Celestial Environment (Sun, Moon, Stars, Birds, Saturn)
// ----------------------------------------------------
function createCelestialEnvironment() {
  // 1. Sun Group (Day)
  sunGroup = new THREE.Group();
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd27d })
  );
  sunGroup.add(sunMesh);
  
  const sunHalo = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.4, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3cc, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  sunGroup.add(sunHalo);
  sunGroup.position.set(22, 18, -18);
  scene.add(sunGroup);

  // 2. Moon Group (Night)
  moonGroup = new THREE.Group();
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xe6e8ea })
  );
  moonGroup.add(moonMesh);
  
  const moonHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.1, 16),
    new THREE.MeshBasicMaterial({ color: 0xa8dadc, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  moonGroup.add(moonHalo);
  moonGroup.position.set(-20, -8, 20);
  scene.add(moonGroup);

  // 3. Saturn-like Planet Group (Night)
  planetGroup = new THREE.Group();
  const saturn = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xe07a5f })
  );
  planetGroup.add(saturn);
  
  const rings = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.72, 16),
    new THREE.MeshBasicMaterial({ color: 0xfdf0d5, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
  );
  rings.rotation.x = Math.PI / 3.5;
  planetGroup.add(rings);
  
  planetGroup.position.set(-16, 14, -18);
  planetGroup.scale.set(0.001, 0.001, 0.001);
  scene.add(planetGroup);

  // 4. Starfield Particles (Night)
  const starGeo = new THREE.BufferGeometry();
  const starCount = 180;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const angleU = Math.random() * Math.PI * 2;
    const angleV = Math.random() * Math.PI * 0.4 + 0.1;
    const dist = 35 + Math.random() * 8;
    positions[i * 3] = dist * Math.cos(angleU) * Math.sin(angleV);
    positions[i * 3 + 1] = dist * Math.cos(angleV) + 6.0;
    positions[i * 3 + 2] = dist * Math.sin(angleU) * Math.sin(angleV);
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.12,
    transparent: true,
    opacity: 0.0
  });
  starPoints = new THREE.Points(starGeo, starMat);
  scene.add(starPoints);

  // 5. Flapping Flying Birds Group (Day)
  birdsGroup = new THREE.Group();
  const birdColor = new THREE.MeshLambertMaterial({ color: 0x3d405b });
  
  for (let i = 0; i < 3; i++) {
    const bird = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), birdColor);
    bird.add(body);
    
    const leftWingGeom = new THREE.PlaneGeometry(0.16, 0.06);
    leftWingGeom.translate(-0.08, 0, 0);
    const leftWing = new THREE.Mesh(leftWingGeom, birdColor);
    leftWing.position.set(-0.02, 0.01, 0);
    bird.add(leftWing);
    
    const rightWingGeom = new THREE.PlaneGeometry(0.16, 0.06);
    rightWingGeom.translate(0.08, 0, 0);
    const rightWing = new THREE.Mesh(rightWingGeom, birdColor);
    rightWing.position.set(0.02, 0.01, 0);
    bird.add(rightWing);

    bird.userData = {
      offset: i * 2.1,
      leftWing: leftWing,
      rightWing: rightWing
    };

    birdsGroup.add(bird);
    birdsList.push(bird);
  }
  scene.add(birdsGroup);
}

// ----------------------------------------------------
// Navigation & Path Routing (Snap Fast Stride & Instant UI)
// ----------------------------------------------------
function navigateToRoom(targetRoomName: string) {
  if (isTransitioning || targetRoomName === currentRoom) return;
  isTransitioning = true;

  // Mobile portrait layout Y offset: centers target room in the top visible half of the screen
  const isMobile = window.innerWidth / window.innerHeight < 1.0;
  const yOffset = isMobile ? 0.75 : 0.0;

  // Stop auto rotation immediately when user navigates
  controls.autoRotate = false;
  clearTimeout(idleTimer);

  // 1. Hide active overlay card immediately! (UX improvement)
  const activeCard = document.querySelector('.info-card.active');
  if (activeCard) activeCard.classList.remove('active');

  // Deactivate active menu links
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const matchingBtn = document.getElementById(`btn-${targetRoomName}`);
  if (matchingBtn) matchingBtn.classList.add('active');

  // 2. Open targeted content card IMMEDIATELY! (No wait)
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

  const startRoom = currentRoom;
  const startPos = roomPositions[startRoom];
  const targetPos = roomPositions[targetRoomName];
  const hA = startPos.h;
  const hB = targetPos.h;

  const tl = gsap.timeline({
    onComplete: () => {
      onArrival(targetRoomName);
    }
  });

  // Set avatar to walking
  avatar.setState('walking');

  // Stride travel speed increased from 3.2 to 9.5 units per second (snappy runs!)
  const strideVelocity = 9.5; 

  const isStartLeft = startPos.stand.x < 0;
  const startEntranceX = isStartLeft ? -1.0 : 1.0;
  const startEntrance = new THREE.Vector3(startEntranceX, hA, 0);

  // Turn to entrance
  const angle1 = Math.atan2(startEntrance.x - avatar.position.x, startEntrance.z - avatar.position.z);
  tl.to(avatar.rotation, { y: angle1, duration: 0.1 });

  // Walk to entrance
  const dist1 = avatar.position.distanceTo(startEntrance);
  tl.to(avatar.position, { x: startEntrance.x, y: startEntrance.y, z: startEntrance.z, duration: dist1 / strideVelocity, ease: 'none' });

  // If changing floors (requires Elevator trip):
  if (hA !== hB) {
    const boardPos = new THREE.Vector3(0, hA, 0);
    
    // Board elevator
    const angle2 = Math.atan2(boardPos.x - avatar.position.x, boardPos.z - avatar.position.z);
    tl.to(avatar.rotation, { y: angle2, duration: 0.08 });
    tl.to(avatar.position, { x: boardPos.x, y: boardPos.y, z: boardPos.z, duration: 0.15, ease: 'none' });

    // Stand still inside elevator
    tl.add(() => avatar.setState('idle'));

    // Move elevator cabin & avatar vertically in sync
    tl.to([elevator.position, avatar.position], {
      y: hB + 0.01,
      duration: 0.7,
      ease: 'power1.inOut'
    }, '+=0.05');

    // Sweep camera viewport in sync
    const targetView = cameraViews[targetRoomName];
    tl.to(camera.position, {
      x: targetView.position.x,
      y: targetView.position.y + yOffset,
      z: targetView.position.z,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '<');

    tl.to(controls.target, {
      x: targetView.target.x,
      y: targetView.target.y + yOffset,
      z: targetView.target.z,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => controls.update()
    }, '<');

    // Return to walking
    tl.add(() => avatar.setState('walking'));

    // Exit elevator
    const isTargetLeft = targetPos.stand.x < 0;
    const targetEntranceX = isTargetLeft ? -1.0 : 1.0;
    const targetEntrance = new THREE.Vector3(targetEntranceX, hB, 0);

    const angle3 = Math.atan2(targetEntrance.x - avatar.position.x, targetEntrance.z - avatar.position.z);
    tl.to(avatar.rotation, { y: angle3, duration: 0.08 });
    tl.to(avatar.position, { x: targetEntrance.x, y: targetEntrance.y, z: targetEntrance.z, duration: 0.15, ease: 'none' });

    // Walk to target stand point
    const angle4 = Math.atan2(targetPos.stand.x - avatar.position.x, targetPos.stand.z - avatar.position.z);
    tl.to(avatar.rotation, { y: angle4, duration: 0.08 });
    const dist2 = targetEntrance.distanceTo(targetPos.stand);
    tl.to(avatar.position, { x: targetPos.stand.x, y: targetPos.stand.y, z: targetPos.stand.z, duration: dist2 / strideVelocity, ease: 'none' });

  } else {
    // Same floor travel
    const angle3 = Math.atan2(targetPos.stand.x - avatar.position.x, targetPos.stand.z - avatar.position.z);
    tl.to(avatar.rotation, { y: angle3, duration: 0.1 });
    const dist2 = avatar.position.distanceTo(targetPos.stand);
    tl.to(avatar.position, { x: targetPos.stand.x, y: targetPos.stand.y, z: targetPos.stand.z, duration: dist2 / strideVelocity, ease: 'none' });

    // Sweep camera view
    const targetView = cameraViews[targetRoomName];
    tl.to(camera.position, {
      x: targetView.position.x,
      y: targetView.position.y + yOffset,
      z: targetView.position.z,
      duration: 0.65,
      ease: 'power2.inOut'
    }, '<');

    tl.to(controls.target, {
      x: targetView.target.x,
      y: targetView.target.y + yOffset,
      z: targetView.target.z,
      duration: 0.65,
      ease: 'power2.inOut',
      onUpdate: () => controls.update()
    }, '<');
  }

  // Walk to room's action spot
  if (targetPos.action && targetPos.action !== targetPos.stand) {
    const angle5 = Math.atan2(targetPos.action.x - avatar.position.x, targetPos.action.z - avatar.position.z);
    tl.to(avatar.rotation, { y: angle5, duration: 0.08 });
    const dist3 = targetPos.stand.distanceTo(targetPos.action);
    tl.to(avatar.position, { x: targetPos.action.x, y: targetPos.action.y, z: targetPos.action.z, duration: dist3 / strideVelocity, ease: 'none' });
  }
}

// Arrival Actions
function onArrival(targetRoomName: string) {
  currentRoom = targetRoomName;
  isTransitioning = false;

  const roomPos = roomPositions[targetRoomName];
  if (targetRoomName === 'home') {
    avatar.setState('sitting');
    avatar.rotation.y = roomPos.faceDirection;
  } 
  else if (targetRoomName === 'about') {
    avatar.setState('typing');
    avatar.rotation.y = roomPos.faceDirection;
  } 
  else if (targetRoomName === 'timeline') {
    avatar.setState('sitting'); // Armchair sitting
    avatar.rotation.y = roomPos.faceDirection;
  }
  else if (targetRoomName === 'projects') {
    avatar.setState('idle');
    avatar.rotation.y = roomPos.faceDirection;
  } 
  else if (targetRoomName === 'skills') {
    avatar.setState('typing');
    avatar.rotation.y = roomPos.faceDirection;
  }
  else if (targetRoomName === 'contact') {
    avatar.setState('waving');
    avatar.rotation.y = roomPos.faceDirection;
    
    gsap.to(mailboxFlag.rotation, { z: 0, duration: 0.5, ease: 'back.out(2)' });
    gsap.to(letterMesh.position, { z: 0.3, y: 1.15, duration: 0.8, ease: 'power2.out' });
  }

  if (targetRoomName !== 'contact') {
    gsap.to(mailboxFlag.rotation, { z: -Math.PI / 2.5, duration: 0.4 });
    gsap.to(letterMesh.position, { z: 0.18, y: 1.0, duration: 0.4 });
  }

  // Start the idle timeout timer
  resetIdleTimer();
}

// ----------------------------------------------------
// Light & Dark Mode Environment Transition
// ----------------------------------------------------
function toggleTheme() {
  isDarkMode = !isDarkMode;
  const toggleBtn = document.getElementById('theme-toggle-btn');

  if (isDarkMode) {
    document.body.classList.add('dark-theme');
    if (toggleBtn) toggleBtn.innerHTML = '<span class="toggle-icon">☼</span>';
  } else {
    document.body.classList.remove('dark-theme');
    if (toggleBtn) toggleBtn.innerHTML = '<span class="toggle-icon">☾</span>';
  }

  const duration = 1.2;

  // 1. Tween lighting values (Brightened night values for excellent visibility!)
  gsap.to(ambientLight, {
    intensity: isDarkMode ? 0.85 : 1.2,
    duration: duration
  });

  const targetAmbientColor = new THREE.Color(isDarkMode ? 0x6c7cb8 : 0xfff6eb);
  gsap.to(ambientLight.color, {
    r: targetAmbientColor.r,
    g: targetAmbientColor.g,
    b: targetAmbientColor.b,
    duration: duration
  });

  gsap.to(sunLight, {
    intensity: isDarkMode ? 0.0 : 1.4,
    duration: duration
  });

  gsap.to(moonLight, {
    intensity: isDarkMode ? 2.0 : 0.0,
    duration: duration
  });

  // Tween street lamp and study desk point lights
  gsap.to(streetLampLight, {
    intensity: isDarkMode ? 3.0 : 0.1,
    duration: duration
  });

  gsap.to(deskLampLight, {
    intensity: isDarkMode ? 2.5 : 0.0,
    duration: duration
  });

  // 2. Animate Celestial Bodies
  // Sun sets down below base floor at night; Moon rises up
  gsap.to(sunGroup.position, { y: isDarkMode ? -6 : 18, duration: duration, ease: 'power2.inOut' });
  gsap.to(moonGroup.position, { y: isDarkMode ? 14 : -8, duration: duration, ease: 'power2.inOut' });

  // Starfield fades in at night
  gsap.to(starPoints.material, { opacity: isDarkMode ? 1.0 : 0.0, duration: duration });

  // Saturn planet scales up at night
  gsap.to(planetGroup.scale, {
    x: isDarkMode ? 1.0 : 0.001,
    y: isDarkMode ? 1.0 : 0.001,
    z: isDarkMode ? 1.0 : 0.001,
    duration: duration,
    ease: 'power2.out'
  });

  // Birds fly/hide away at night
  gsap.to(birdsGroup.scale, {
    x: isDarkMode ? 0.0 : 1.0,
    y: isDarkMode ? 0.0 : 1.0,
    z: isDarkMode ? 0.0 : 1.0,
    duration: duration
  });

  // 3. Clear Color of Renderer
  const targetColor = new THREE.Color(isDarkMode ? 0x090a14 : 0xfaf8f5);
  gsap.to(scene.background, {
    r: targetColor.r,
    g: targetColor.g,
    b: targetColor.b,
    duration: duration
  });

  // 4. Indoor spot lights activations (Brightened spotlights at night)
  roomLights.forEach(spot => {
    gsap.to(spot, { intensity: isDarkMode ? 2.5 : 0.1, duration: duration });
  });

  // 5. Physical Lightbulbs glow tweening (Off-duty dark grey ➔ self-luminous warm yellow)
  const targetBulbColor = new THREE.Color(isDarkMode ? 0xfff3cc : 0x666666);
  bulbMeshes.forEach(bulb => {
    const bulbMat = bulb.material as THREE.MeshBasicMaterial;
    gsap.to(bulbMat.color, {
      r: targetBulbColor.r,
      g: targetBulbColor.g,
      b: targetBulbColor.b,
      duration: duration
    });
  });

  // 6. Laptop & Arcade glowing screens emission
  const lapScreenMat = laptopScreenMesh.material as THREE.MeshBasicMaterial;
  const arcScreenMat = arcadeScreenMesh.material as THREE.MeshBasicMaterial;
  const logMat = fireplaceLogMesh.material as THREE.MeshStandardMaterial;

  if (isDarkMode) {
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
// UI Bindings & Highlights
// ----------------------------------------------------
function setupEvents() {
  // Navigation & Mobile Hamburger Toggle
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const navbarEl = document.querySelector('.navbar');

  if (menuToggleBtn && navbarEl) {
    menuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navbarEl.classList.toggle('open');
      menuToggleBtn.textContent = navbarEl.classList.contains('open') ? '✕' : '☰';
    });

    // Close menu when clicking outside
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

      // Close mobile drawer navbar on click
      if (navbarEl && menuToggleBtn) {
        navbarEl.classList.remove('open');
        menuToggleBtn.textContent = '☰';
      }
    });
  });

  // Theme Toggle Button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Hover highlights on projects screen
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
  });

  // Contact Form Submission
  const form = document.getElementById('portfolio-contact-form');
  const successEl = document.getElementById('form-success');
  if (form && successEl) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      successEl.style.display = 'block';
      const submitBtn = document.getElementById('form-submit-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitted!';
      }

      // Flash street lamp
      if (streetLampLight) {
        const originalVal = streetLampLight.intensity;
        gsap.timeline()
          .to(streetLampLight, { intensity: 5.5, duration: 0.08, repeat: 6, yoyo: true })
          .to(streetLampLight, { intensity: originalVal, duration: 0.3 });
      }

      setTimeout(() => {
        (form as HTMLFormElement).reset();
        successEl.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      }, 5000);
    });
  }

  // Raycaster Event triggers (Clicking on 3D Rooms/Labels)
  renderer.domElement.addEventListener('click', onCanvasClick);
  renderer.domElement.addEventListener('mousemove', onCanvasMouseMove);

  // OrbitControls interaction triggers (Pause Auto-Rotate)
  controls.addEventListener('start', () => {
    clearTimeout(idleTimer);
    controls.autoRotate = false;
    
    // Sync widget button label
    const toggleSpinBtn = document.getElementById('btn-toggle-spin');
    if (toggleSpinBtn) toggleSpinBtn.textContent = 'Spin: Off';
  });
  
  controls.addEventListener('end', () => {
    resetIdleTimer();
    
    // Sync widget button label back to true after timer triggers if autoRotate resumes
    setTimeout(() => {
      const toggleSpinBtn = document.getElementById('btn-toggle-spin');
      if (toggleSpinBtn) {
        toggleSpinBtn.textContent = controls.autoRotate ? 'Spin: On' : 'Spin: Off';
      }
    }, 6100);
  });

  // ----------------------------------------------------
  // Collapsible Control Deck Dashboard Widget Event Bindings
  // ----------------------------------------------------
  const widgetToggleBtn = document.getElementById('widget-toggle-btn');
  const controlWidget = document.getElementById('control-widget');
  if (widgetToggleBtn && controlWidget) {
    widgetToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      controlWidget.classList.toggle('open');
    });

    // Close panel on clicking anywhere else outside of the panel
    document.addEventListener('click', () => {
      controlWidget.classList.remove('open');
    });

    // Prevent click inside the widget panel from closing the panel
    const widgetPanel = document.getElementById('widget-panel');
    if (widgetPanel) {
      widgetPanel.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  // Reset View Camera Action (Overview Mode)
  const resetViewBtn = document.getElementById('btn-reset-view');
  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
      // Fade out active room content card
      const activeCard = document.querySelector('.info-card.active');
      if (activeCard) activeCard.classList.remove('active');

      // Deactivate menu tabs
      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

      // Set footer room text back to overview
      const labelEl = document.getElementById('current-room-text');
      if (labelEl) labelEl.textContent = 'House Overview';

      // Reset transition state
      isTransitioning = false;
      currentRoom = 'home';

      // Reset avatar animation back to idle/waving at base
      if (avatar) {
        avatar.setState('waving');
      }

      // Smooth camera reset transition
      gsap.to(camera.position, { x: -16.5, y: 12.0, z: 19.5, duration: 1.5, ease: 'power2.inOut' });
      gsap.to(controls.target, { x: 0.0, y: 2.2, z: 0.0, duration: 1.5, ease: 'power2.inOut', onUpdate: () => controls.update() });

      // Start spinning again
      controls.autoRotate = true;
      
      // Close mobile drawer widget panel
      if (controlWidget) controlWidget.classList.remove('open');
    });
  }

  // Toggle Spin Camera Action
  const toggleSpinBtn = document.getElementById('btn-toggle-spin');
  if (toggleSpinBtn) {
    toggleSpinBtn.addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      toggleSpinBtn.textContent = controls.autoRotate ? 'Spin: On' : 'Spin: Off';
    });
  }

  // Floor Grid Room Travel Buttons
  document.querySelectorAll('.widget-btn-room').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomName = (e.currentTarget as HTMLElement).getAttribute('data-room');
      if (roomName) navigateToRoom(roomName);

      // Close mobile drawer widget panel on selection
      if (controlWidget) controlWidget.classList.remove('open');
    });
  });
}

// Raycaster Click Handler
function onCanvasClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, true);

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

// Raycaster Hover Cursor Handler
function onCanvasMouseMove(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, true);

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
  renderer.domElement.style.cursor = foundHoverable ? 'pointer' : 'auto';

  // Toggle hover state on custom cursor ring
  if (cursorRingEl) {
    if (foundHoverable) {
      cursorRingEl.classList.add('hover');
    } else {
      const activeHoverEl = document.querySelector('button:hover, a:hover, .project-card:hover');
      if (!activeHoverEl) {
        cursorRingEl.classList.remove('hover');
      }
    }
  }
}

// Idle timeout to reset auto rotation
function resetIdleTimer() {
  controls.autoRotate = false;
  clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    if (!isTransitioning) {
      controls.autoRotate = true;
    }
  }, 6000);
}

// Screens selection highlight
function highlightScreen(idx: number, turnOn: boolean) {
  if (idx >= 0 && idx < screens.length) {
    const screen = screens[idx];
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

// ----------------------------------------------------
// Window Resize Helper
// ----------------------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  
  // Responsive FOV (Wider field of view for narrow portrait screens so the 3D house fits!)
  if (camera.aspect < 1.0) {
    camera.fov = 56;
  } else {
    camera.fov = 42;
  }
  
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------------------
// Render & Loop
// ----------------------------------------------------
function animate(time: number) {
  requestAnimationFrame(animate);

  const seconds = time * 0.001;

  // Lerp custom cursor ring position (desktop fine pointers only)
  if (cursorRingEl) {
    cursorX += (mouseX - cursorX) * 0.16;
    cursorY += (mouseY - cursorY) * 0.16;
    cursorRingEl.style.left = cursorX + 'px';
    cursorRingEl.style.top = cursorY + 'px';
  }

  // Update controls
  controls.update();

  // Update avatar joints
  if (avatar) {
    avatar.update(seconds);
  }

  // Fireplace log glowing flame flicker in dark mode
  if (fireplaceLight) {
    if (isDarkMode) {
      fireplaceLight.intensity = 2.2 + Math.sin(time * 0.015) * 0.35;
    } else {
      fireplaceLight.intensity = 0.0;
    }
  }

  // Bob floating room labels
  floatingLabels.forEach(label => {
    label.position.y = label.userData.baseY + Math.sin(seconds * 2.0 + label.userData.phase) * 0.05;
    label.lookAt(camera.position);
  });

  // Bob and rotate floating tech shapes
  floatingTechShapes.forEach((shape, index) => {
    shape.position.y = 0.95 + Math.sin(seconds * 2.5 + index) * 0.06;
    shape.rotation.y += 0.015;
    shape.rotation.x += 0.008;
  });

  // Animate Birds flight circles (around chimney at X=5.5, Z=0.2)
  birdsList.forEach((bird) => {
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

  // Render Scene
  renderer.render(scene, camera);
}

// Boot up
window.addEventListener('DOMContentLoaded', init);
