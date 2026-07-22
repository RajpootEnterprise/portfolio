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

// References to Helicopter & Helipad
let helipad: THREE.Group;
let helicopter: THREE.Group;
let mainRotor: THREE.Group;
let tailRotor: THREE.Group;
let rotorSpeed = 0;
let isSpaceTrip = false;
let thrusterFireL: THREE.Mesh;
let thrusterFireR: THREE.Mesh;
let cityGroup: THREE.Group;
const cityHelipads: THREE.Vector3[] = [];
let currentPlanetHelipadIdx = 0;

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

  // Create Helipad & Helicopter
  createHelipad();
  createHelicopter();
  createSpaceCity();

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

  // 4. Solid Room Walls, Columns & Panoramic Glass Facades
  const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wallPlaster, roughness: 0.95 });
  const columnMat = new THREE.MeshStandardMaterial({ color: 0x222533, roughness: 0.5, metalness: 0.1 }); // Dark modern concrete
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.4, metalness: 0.8 }); // Black metal window frames

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.12,
    transmission: 0.98,
    ior: 1.5,
    thickness: 0.05,
    roughness: 0.02,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02
  });

  // Corner Concrete Pillars (Pillars extending from Ground to Roof)
  const addPillar = (x: number, z: number) => {
    const pillarHeight = 6.6;
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, pillarHeight, 0.24),
      columnMat
    );
    pillar.position.set(x, pillarHeight / 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  };

  // Add structural pillars
  addPillar(-6.75, -3.5);
  addPillar(-6.75, 3.5);
  addPillar(6.75, -3.5);
  addPillar(6.75, 3.5);
  addPillar(-0.75, -3.5);
  addPillar(-0.75, 3.5);
  addPillar(0.75, -3.5);
  addPillar(0.75, 3.5);

  // Helper to build Solid Walls
  const addSolidWall = (w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, y + h / 2, z);
    wall.rotation.y = ry;
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  };

  // BACK WALLS (Z = -3.5)
  addSolidWall(5.76, 2.2, 0.12, -3.75, HEIGHTS.ground, -3.44); // Home Back
  addSolidWall(5.76, 2.2, 0.12, -3.75, HEIGHTS.first, -3.44);  // Study Back
  addSolidWall(5.76, 2.2, 0.12, 3.75, HEIGHTS.first, -3.44);   // Library Back
  addSolidWall(5.76, 2.2, 0.12, -3.75, HEIGHTS.second, -3.44); // Workshop Back
  addSolidWall(5.76, 2.2, 0.12, 3.75, HEIGHTS.second, -3.44);  // Arcade Back

  // SIDE WALLS (X = -6.75 / 6.75)
  addSolidWall(0.12, 2.2, 6.76, -6.69, HEIGHTS.ground, 0); // Home Left Side
  addSolidWall(0.12, 2.2, 6.76, -6.69, HEIGHTS.first, 0);  // Study Left Side
  addSolidWall(0.12, 2.2, 6.76, 6.69, HEIGHTS.first, 0);   // Library Right Side
  addSolidWall(0.12, 2.2, 6.76, -6.69, HEIGHTS.second, 0); // Workshop Left Side
  addSolidWall(0.12, 2.2, 6.76, 6.69, HEIGHTS.second, 0);  // Arcade Right Side

  // INTERIOR PARTITION WALLS (Between Left and Right sides, next to elevator)
  const addInteriorWall = (y: number) => {
    addSolidWall(0.12, 2.2, 2.4, -0.69, y, 2.3);
    addSolidWall(0.12, 2.2, 2.4, -0.69, y, -2.3);
    addSolidWall(0.12, 2.2, 2.4, 0.69, y, 2.3);
    addSolidWall(0.12, 2.2, 2.4, 0.69, y, -2.3);
  };
  addInteriorWall(HEIGHTS.ground);
  addInteriorWall(HEIGHTS.first);
  addInteriorWall(HEIGHTS.second);

  // Helper to build Panoramic Glass Facades (with dark frames & mullions)
  const addGlassFacade = (xCenter: number, yBottom: number, zCenter: number, w: number, h: number, ry = 0) => {
    const facade = new THREE.Group();
    facade.position.set(xCenter, yBottom + h / 2, zCenter);
    facade.rotation.y = ry;

    // Glass panel
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), glassMat);
    facade.add(glass);

    // Frame Borders
    const frameThickness = 0.06;
    const borderTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, frameThickness, 0.08), frameMat);
    borderTop.position.y = h / 2 - frameThickness / 2;
    const borderBottom = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, frameThickness, 0.08), frameMat);
    borderBottom.position.y = -h / 2 + frameThickness / 2;
    
    const borderLeft = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, h, 0.08), frameMat);
    borderLeft.position.x = -w / 2 + frameThickness / 2;
    const borderRight = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, h, 0.08), frameMat);
    borderRight.position.x = w / 2 - frameThickness / 2;

    facade.add(borderTop, borderBottom, borderLeft, borderRight);

    // Vertical Division Mullions
    const mullion1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - 0.1, 0.06), frameMat);
    mullion1.position.x = -w / 6;
    const mullion2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - 0.1, 0.06), frameMat);
    mullion2.position.x = w / 6;
    facade.add(mullion1, mullion2);

    scene.add(facade);
  };

  // FRONT GLASS FACADES (Z = 3.44)
  addGlassFacade(-3.75, HEIGHTS.ground, 3.44, 5.76, 2.2); // Home Front Glass
  addGlassFacade(-3.75, HEIGHTS.first, 3.44, 5.76, 2.2);  // Study Front Glass
  addGlassFacade(3.75, HEIGHTS.first, 3.44, 5.76, 2.2);   // Library Front Glass
  addGlassFacade(-3.75, HEIGHTS.second, 3.44, 5.76, 2.2); // Workshop Front Glass
  addGlassFacade(3.75, HEIGHTS.second, 3.44, 5.76, 2.2);  // Arcade Front Glass

  // 5. Solid Roof Structure & Flat Terrace
  const roofY = HEIGHTS.second + 2.2; // Y = 6.6
  
  // FLAT CONCRETE ROOFTOP TERRACE DECK (Left side, X from -6.75 to -0.75, Z from -3.5 to 3.5)
  const roofSlab = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 0.12, 7.0),
    new THREE.MeshStandardMaterial({ color: COLORS.houseBase, roughness: 0.85 })
  );
  roofSlab.position.set(-3.75, roofY - 0.06, 0);
  roofSlab.receiveShadow = true;
  roofSlab.castShadow = true;
  scene.add(roofSlab);

  // GLASS SAFETY RAILINGS around the flat roof terrace
  const addRailing = (w: number, x: number, z: number, ry = 0) => {
    const railGroup = new THREE.Group();
    railGroup.position.set(x, roofY, z);
    railGroup.rotation.y = ry;

    // Glass panel
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.85, 0.02),
      new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.2, transmission: 0.9 })
    );
    glass.position.y = 0.425;
    railGroup.add(glass);

    // Chrome/steel metal supports & handrail
    const postMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.04, 0.04), postMat);
    handrail.position.y = 0.87;
    railGroup.add(handrail);

    const postsCount = Math.max(2, Math.floor(w / 1.5));
    for (let i = 0; i < postsCount; i++) {
      const px = -w / 2 + (i * w) / (postsCount - 1);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85), postMat);
      post.position.set(px, 0.425, 0);
      railGroup.add(post);
    }

    scene.add(railGroup);
  };

  // Add railings for the three outer boundaries of the flat terrace
  addRailing(5.76, -3.75, 3.44, 0);            // Front railing
  addRailing(6.76, -6.69, 0, Math.PI / 2);      // Left railing
  addRailing(5.76, -3.75, -3.44, 0);           // Back railing

  // ELEVATOR PENTHOUSE CORE (Center, X from -0.75 to 0.75)
  const penthouse = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.2, 1.5),
    new THREE.MeshStandardMaterial({ color: COLORS.houseBase, roughness: 0.8 })
  );
  penthouse.position.set(0, roofY + 1.1 - 0.12, 0);
  penthouse.castShadow = true;
  penthouse.receiveShadow = true;
  scene.add(penthouse);

  // Modern horizontal accent trim on penthouse
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.08, 1.56), frameMat);
  trim.position.set(0, roofY + 2.0 - 0.12, 0);
  scene.add(trim);

  // ASYMMETRICAL PITCHED SLATED ROOF (Right side, X from 0.75 to 6.75, Z from -3.5 to 3.5)
  const roofSlope = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.08, 7.05),
    new THREE.MeshStandardMaterial({ color: 0x222533, roughness: 0.7 }) // Charcoal shingle tiles
  );
  roofSlope.position.set(3.75, roofY + 0.465, 0);
  roofSlope.rotation.z = -0.173;
  roofSlope.castShadow = true;
  roofSlope.receiveShadow = true;
  scene.add(roofSlope);

  // 6. Rooftop Luxury Decoration (Empty Roof Fix)
  const woodFurnitureMat = new THREE.MeshStandardMaterial({ color: COLORS.woodFurniture, roughness: 0.75 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });

  // A. Sun Lounger Chairs
  const addSunLounger = (x: number, z: number, ry: number) => {
    const lounger = new THREE.Group();
    lounger.position.set(x, roofY, z);
    lounger.rotation.y = ry;

    // Wooden base frame
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 1.4), woodFurnitureMat);
    base.position.y = 0.04;
    base.castShadow = true;
    lounger.add(base);

    // Reclined back support
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), woodFurnitureMat);
    back.position.set(0, 0.22, -0.4);
    back.rotation.x = -0.4;
    back.castShadow = true;
    lounger.add(back);

    // White cushion top
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.8), cushionMat);
    cushion.position.set(0, 0.1, 0.2);
    const cushionBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.55), cushionMat);
    cushionBack.position.set(0, 0.23, -0.38);
    cushionBack.rotation.x = -0.4;
    lounger.add(cushion, cushionBack);

    scene.add(lounger);
  };
  addSunLounger(-2.0, 2.0, Math.PI / 6);
  addSunLounger(-2.0, 0.8, Math.PI / 5);

  // B. Large Leafy Planter Pots
  const addPlanterPot = (x: number, z: number) => {
    const planter = new THREE.Group();
    planter.position.set(x, roofY, z);

    // Terracotta pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.16, 0.44, 12),
      new THREE.MeshStandardMaterial({ color: 0x4f5d75, roughness: 0.6 })
    );
    pot.position.y = 0.22;
    pot.castShadow = true;
    planter.add(pot);

    // Lush plant leaves
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x2d6a4f });
    for (let i = 0; i < 3; i++) {
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), leafMaterial);
      leaves.position.set(Math.sin(i * 2) * 0.1, 0.44 + i * 0.12, Math.cos(i * 2) * 0.1);
      leaves.scale.set(1.1, 0.85, 1.1);
      leaves.castShadow = true;
      planter.add(leaves);
    }

    scene.add(planter);
  };
  addPlanterPot(-5.8, -2.6);
  addPlanterPot(-5.8, 2.6);

  // C. Modern Solar Panels
  const addSolarPanel = (x: number, z: number) => {
    const panelGroup = new THREE.Group();
    panelGroup.position.set(x, roofY + 0.65, z);
    panelGroup.rotation.z = -0.173;

    const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const rails = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.5), railMat);
    rails.position.y = 0.02;
    panelGroup.add(rails);

    const siliconMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.15
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 1.6), railMat);
    frame.position.y = 0.04;
    const silicon = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.01, 1.52), siliconMat);
    silicon.position.y = 0.055;
    panelGroup.add(frame, silicon);

    scene.add(panelGroup);
  };
  addSolarPanel(3.0, -1.8);
  addSolarPanel(3.0, 1.8);

  // 7. Hanging Light Fixtures with Lightbulbs (suspended from flat ceilings Y=6.6)
  const addHangingLamp = (x: number, y: number, z: number, length: number) => {
    const lamp = new THREE.Group();
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, length), cordMat);
    cord.position.y = -length / 2;
    lamp.add(cord);
    
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 }));
    shade.position.y = -length - 0.07;
    shade.castShadow = true;
    lamp.add(shade);

    const glowBulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0x666666 }));
    glowBulb.position.y = -length - 0.12;
    lamp.add(glowBulb);
    bulbMeshes.push(glowBulb);

    lamp.position.set(x, y, z);
    scene.add(lamp);
  };

  addHangingLamp(-3.5, roofY, -0.6, 0.45); // Projects Lab ceiling
  addHangingLamp(3.5, roofY, -0.6, 0.45);  // Skills Arcade ceiling
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
// Helipad & Stylized Helicopter Models
// ----------------------------------------------------
function createHelipad() {
  helipad = new THREE.Group();
  // Center of the flat concrete roof terrace above Projects room
  helipad.position.set(-3.75, HEIGHTS.second + 2.2, 0);

  // Helipad platform (large concrete circle)
  const platformGeo = new THREE.CylinderGeometry(1.75, 1.75, 0.04, 32);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.receiveShadow = true;
  platform.castShadow = true;
  helipad.add(platform);

  // Outer border ring (yellow warning ring)
  const borderGeo = new THREE.TorusGeometry(1.70, 0.04, 8, 32);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = Math.PI / 2;
  border.position.y = 0.025;
  helipad.add(border);

  // The letter "H" on helipad (white bars)
  const hGroup = new THREE.Group();
  hGroup.position.y = 0.022;
  
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.9), lineMat);
  barL.position.x = -0.3;
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.9), lineMat);
  barR.position.x = 0.3;
  const barC = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.005, 0.16), lineMat);
  
  hGroup.add(barL, barR, barC);
  helipad.add(hGroup);

  // Support mounts holding the helipad on the roof slab
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04), strutMat);
      mount.position.set(i * 1.2, -0.04, j * 1.2);
      mount.castShadow = true;
      helipad.add(mount);
    }
  }

  scene.add(helipad);
}

function createHelicopter() {
  helicopter = new THREE.Group();
  // Sits flat on the new helipad level
  helicopter.position.set(-3.75, HEIGHTS.second + 2.24, 0);

  // 1. Cockpit / Main Cabin (Rounded capsule shape)
  const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
  bodyGeo.scale(1.4, 1.0, 1.0);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  helicopter.add(body);

  // 2. Windshield / Canopy (Transparent dark glass)
  const canopyGeo = new THREE.SphereGeometry(0.24, 16, 16);
  canopyGeo.scale(1.2, 0.8, 1.0);
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.9
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0.22, 0.06, 0);
  helicopter.add(canopy);

  // 3. Tail Boom (Tapering cylinder extending back)
  const boomGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8);
  const boomMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5 });
  const boom = new THREE.Mesh(boomGeo, boomMat);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(-0.75, 0.05, 0);
  boom.castShadow = true;
  helicopter.add(boom);

  // 4. Tail Fin / Rotor Support
  const finGeo = new THREE.BoxGeometry(0.06, 0.32, 0.12);
  const finMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
  const fin = new THREE.Mesh(finGeo, finMat);
  fin.position.set(-1.22, 0.18, 0);
  fin.castShadow = true;
  helicopter.add(fin);

  // 5. Main Rotor Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.set(0.0, 0.4, 0);
  shaft.castShadow = true;
  helicopter.add(shaft);

  // 6. Main Rotor Blades
  mainRotor = new THREE.Group();
  mainRotor.position.set(0.0, 0.49, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.5 });
  const bladeL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.01, 0.08), bladeMat);
  bladeL.castShadow = true;
  const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 1.8), bladeMat);
  bladeR.castShadow = true;
  mainRotor.add(bladeL, bladeR);
  helicopter.add(mainRotor);

  // 7. Tail Rotor Blades
  tailRotor = new THREE.Group();
  tailRotor.position.set(-1.22, 0.18, 0.08);
  const tBladeGeo = new THREE.BoxGeometry(0.01, 0.34, 0.03);
  const tBladeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const tBlade1 = new THREE.Mesh(tBladeGeo, tBladeMat);
  const tBlade2 = new THREE.Mesh(tBladeGeo, tBladeMat);
  tBlade2.rotation.x = Math.PI / 2;
  tailRotor.add(tBlade1, tBlade2);
  helicopter.add(tailRotor);

  // 8. Landing Skids
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
  
  const skidL = new THREE.Group();
  const leg1L = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg1L.position.set(0.15, -0.22, 0.18);
  leg1L.rotation.z = -0.2;
  const leg2L = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg2L.position.set(-0.25, -0.22, 0.18);
  leg2L.rotation.z = 0.2;
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.03), skidMat);
  barL.position.set(-0.05, -0.3, 0.18);
  barL.castShadow = true;
  skidL.add(leg1L, leg2L, barL);
  helicopter.add(skidL);

  const skidR = new THREE.Group();
  const leg1R = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg1R.position.set(0.15, -0.22, -0.18);
  leg1R.rotation.z = -0.2;
  const leg2R = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg2R.position.set(-0.25, -0.22, -0.18);
  leg2R.rotation.z = 0.2;
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.03), skidMat);
  barR.position.set(-0.05, -0.3, -0.18);
  barR.castShadow = true;
  skidR.add(leg1R, leg2R, barR);
  helicopter.add(skidR);

  // 9. Side thruster engines (glowing rocket thrusters for space flight)
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  const thrusterL = new THREE.Group();
  const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8), nozzleMat);
  nozzleL.rotation.z = Math.PI / 2;
  const fireL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glowMat);
  fireL.scale.set(0.1, 1.8, 1.0);
  fireL.rotation.z = Math.PI / 2;
  fireL.position.x = -0.12;
  thrusterL.add(nozzleL, fireL);
  thrusterL.position.set(-0.35, -0.06, 0.28);
  helicopter.add(thrusterL);

  const thrusterR = new THREE.Group();
  const nozzleR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8), nozzleMat);
  nozzleR.rotation.z = Math.PI / 2;
  const fireR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glowMat);
  fireR.scale.set(0.1, 1.8, 1.0);
  fireR.rotation.z = Math.PI / 2;
  fireR.position.x = -0.12;
  thrusterR.add(nozzleR, fireR);
  thrusterR.position.set(-0.35, -0.06, -0.28);
  helicopter.add(thrusterR);

  thrusterL.userData = { fire: fireL };
  thrusterR.userData = { fire: fireR };
  
  thrusterFireL = fireL;
  thrusterFireR = fireR;
  
  // Hide thruster flames initially
  fireL.scale.set(0.001, 0.001, 0.001);
  fireR.scale.set(0.001, 0.001, 0.001);

  scene.add(helicopter);
}

function createSpaceCity() {
  cityGroup = new THREE.Group();
  
  // Platform base plate for the floating district
  const baseGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.15, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
  const cityBase = new THREE.Mesh(baseGeo, baseMat);
  cityBase.position.y = 11.0;
  cityBase.receiveShadow = true;
  cityBase.castShadow = true;
  cityGroup.add(cityBase);

  // Glowing neon ring outlining the floating district
  const ringGeo = new THREE.TorusGeometry(3.7, 0.04, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const glowRing = new THREE.Mesh(ringGeo, ringMat);
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 11.08;
  cityGroup.add(glowRing);

  // Specifications for the 10 futuristic skyscrapers (relative positions & heights)
  const buildingSpecs = [
    { rx: -2.0, rz: -2.0, h: 2.5, color: 0x222533, lightColor: 0x3b82f6 },
    { rx: -0.8, rz: -2.4, h: 3.2, color: 0x181a24, lightColor: 0x10b981 },
    { rx: 1.0, rz: -2.4, h: 2.2, color: 0x272b3c, lightColor: 0xeab308 },
    { rx: 2.2, rz: -1.2, h: 3.0, color: 0x1e202b, lightColor: 0x6366f1 },
    { rx: 2.4, rz: 0.5, h: 2.8, color: 0x222533, lightColor: 0xec4899 },
    { rx: 1.4, rz: 2.0, h: 3.8, color: 0x181a24, lightColor: 0x06b6d4 },
    { rx: -0.4, rz: 2.4, h: 2.4, color: 0x272b3c, lightColor: 0xa855f7 },
    { rx: -2.0, rz: 1.8, h: 3.4, color: 0x1e202b, lightColor: 0xef4444 },
    { rx: -2.5, rz: -0.2, h: 2.8, color: 0x222533, lightColor: 0x10b981 },
    { rx: 0.0, rz: 0.0, h: 4.2, color: 0x0f111a, lightColor: 0xeab308 } // Center tower
  ];

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.5, metalness: 0.8 });

  buildingSpecs.forEach((spec, i) => {
    // 1. Skyscraper Structure
    const bW = i === 9 ? 0.95 : 0.75; // wider center tower
    const bGeo = new THREE.BoxGeometry(bW, spec.h, bW);
    const bMat = new THREE.MeshStandardMaterial({ color: spec.color, metalness: 0.85, roughness: 0.15 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(-16.0 + spec.rx, 11.0 + spec.h / 2, -18.0 + spec.rz);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    cityGroup.add(bMesh);

    // 2. Glowing office window neon bands
    const stripeCount = Math.floor(spec.h / 0.55);
    for (let j = 1; j < stripeCount; j++) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(bW + 0.02, 0.04, bW + 0.02),
        new THREE.MeshBasicMaterial({ color: spec.lightColor })
      );
      band.position.set(
        -16.0 + spec.rx,
        11.0 + j * 0.55,
        -18.0 + spec.rz
      );
      cityGroup.add(band);
    }

    // 3. Helicopter Landing Pad on the roof
    const padRadius = i === 9 ? 0.32 : 0.25;
    const padGroup = new THREE.Group();
    padGroup.position.set(-16.0 + spec.rx, 11.0 + spec.h + 0.005, -18.0 + spec.rz);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(padRadius, padRadius, 0.01, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    padGroup.add(plate);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(padRadius - 0.015, 0.008, 4, 16),
      new THREE.MeshBasicMaterial({ color: spec.lightColor })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.006;
    padGroup.add(ring);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.001, 0.12), lineMat);
    hL.position.set(-0.04, 0.007, 0);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.001, 0.12), lineMat);
    hR.position.set(0.04, 0.007, 0);
    const hC = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.001, 0.02), lineMat);
    hC.position.set(0, 0.007, 0);
    padGroup.add(hL, hR, hC);

    cityGroup.add(padGroup);

    // Save world coordinate of this building's landing zone
    cityHelipads.push(new THREE.Vector3(
      -16.0 + spec.rx,
      11.0 + spec.h + 0.02,
      -18.0 + spec.rz
    ));

    // 4. Rooftop Details: Antennas with blinking lights
    if (i % 2 === 1) {
      const antenna = new THREE.Group();
      antenna.position.set(-16.0 + spec.rx - 0.22, 11.0 + spec.h, -18.0 + spec.rz - 0.22);
      
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.015, 0.4, 8),
        frameMat
      );
      mast.position.y = 0.2;
      antenna.add(mast);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xef4444 }) // Red warning light
      );
      tip.position.y = 0.4;
      antenna.add(tip);

      cityGroup.add(antenna);
    }
  });

  // Start collapsed (will scale up when flying to space)
  cityGroup.scale.set(0.001, 0.001, 0.001);
  scene.add(cityGroup);
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
    card.addEventListener('click', (e) => {
      if (isTransitioning || isSpaceTrip) return;
      const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-proj-id');
      if (idxStr !== null) {
        const idx = parseInt(idxStr);
        flyToPlanet(idx);
      }
    });
  });

  // Return to Earth button click
  const returnBtn = document.getElementById('btn-return-earth');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      returnToEarth();
    });
  }

  // Contact Form Submission
  // To activate free lifetime form storage, replace this email with your own verified email address!
  // FormSubmit.co will send you a one-time verification link upon the first submission.
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

      // Flash street lamp
      if (streetLampLight) {
        const originalVal = streetLampLight.intensity;
        gsap.timeline()
          .to(streetLampLight, { intensity: 5.5, duration: 0.08, repeat: 6, yoyo: true })
          .to(streetLampLight, { intensity: originalVal, duration: 0.3 });
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



  // Update controls vertical bobbing during auto-rotation
  if (controls.autoRotate && !isTransitioning && !isSpaceTrip) {
    camera.position.y = 12.0 + Math.sin(seconds * 0.22) * 2.8;
  }

  // Update controls
  controls.update();

  // Update avatar joints
  if (avatar) {
    avatar.update(seconds);
  }

  // Spin helicopter rotors based on rotorSpeed
  if (helicopter && mainRotor && tailRotor) {
    mainRotor.rotation.y += rotorSpeed;
    tailRotor.rotation.z += rotorSpeed * 1.8;
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

// ----------------------------------------------------
// Project Details Space Animation & Data
// ----------------------------------------------------
interface ProjectDetail {
  meta: string;
  title: string;
  tags: string[];
  desc: string;
  features: string[];
}

const projectDetails: ProjectDetail[] = [
  {
    meta: "01 / MICROSERVICE [LIVE]",
    title: "BroadNet.ai Billing Service",
    tags: ["Java", "Spring Boot", "Kafka", "Docker", "Stripe API", "Kubernetes"],
    desc: "A production-grade, highly scalable billing microservice powering BroadNet.ai. Designed to handle end-to-end user subscription lifecycle management, usage-based consumption calculation, and automatic invoicing.",
    features: [
      "Designed and deployed Spring Boot microservices integrated with Apache Kafka event streams for asynchronous notification delivery.",
      "Integrated Stripe API for secure processing of prepaid top-ups and recurring postpaid credit card billing workflows.",
      "Implemented distributed transactions with resilient fallback strategies to prevent partial processing errors.",
      "Optimized query performance using Redis caching layers, reducing billing computation latency by 45%.",
      "Containerized microservices using Docker and orchestrated deployments on Kubernetes cluster configurations."
    ]
  },
  {
    meta: "02 / CORE JAVA & WEB",
    title: "E-Learning Platform",
    tags: ["Core Java", "Servlets", "JSP", "MySQL", "HTML5", "CSS3", "Apache Tomcat"],
    desc: "An educational platform utilizing role-based access control to partition student workspaces and mentor boards. Designed to host interactive course chapters, progress chapters, and dynamic student quiz panels.",
    features: [
      "Constructed core servlet request routing layers managing secure user sessions and preventing injection attacks.",
      "Built dynamic, interactive JSP templates rendering course content, video links, and student assignments.",
      "Modeled relational database structures in MySQL for users, enrollments, course catalogs, and exam logs.",
      "Implemented a backend automated grading engine mapping multiple-choice quiz submissions in real-time.",
      "Designed a clean responsive CSS workspace ensuring smooth cross-device accessibility for desktop and mobile learners."
    ]
  },
  {
    meta: "03 / AWS CLOUD & R&D",
    title: "AWS Cloud Systems & 5G Research",
    tags: ["AWS", "5G Systems", "EC2", "RDS", "S3", "TSSC Protocols", "Systems Design"],
    desc: "An integration of AWS cloud infrastructure mapping with research into TSSC 5G Advance Competence structures, mapping network signaling routes and cloud-native database replication.",
    features: [
      "Configured secure, high-availability AWS Virtual Private Clouds (VPC) hosting EC2 instances and RDS database clusters.",
      "Researched 5G Core signaling protocols (AMF, SMF, UPF) to model microservices communication topologies.",
      "Designed event-driven serverless architectures leveraging AWS Lambda and S3 storage triggers for file ingestion pipelines.",
      "Produced comprehensive system design diagrams modeling latency constraints, security group policies, and CDN edge caches.",
      "Completed TSSC 5G Advance networking credentials covering packet routing, QoS metrics, and cellular handover signaling."
    ]
  }
];

function flyToPlanet(projectId: number) {
  isSpaceTrip = true;
  isTransitioning = true; // Lock other room transitions

  // Pick a random helipad (0 to 9) in the space city
  currentPlanetHelipadIdx = Math.floor(Math.random() * 10);
  const targetLandingPos = cityHelipads[currentPlanetHelipadIdx];

  // Hide the standard Projects info card panel
  const activeCard = document.querySelector('.info-card.active');
  if (activeCard) activeCard.classList.remove('active');

  // Spin up rotors
  const rotorControl = { value: rotorSpeed };
  gsap.to(rotorControl, {
    value: 0.45,
    duration: 1.5,
    ease: 'power1.in',
    onUpdate: () => {
      rotorSpeed = rotorControl.value;
    }
  });

  // Scale up thruster flames
  if (thrusterFireL && thrusterFireR) {
    gsap.to([thrusterFireL.scale, thrusterFireR.scale], {
      x: 1.0,
      y: 2.2,
      z: 1.0,
      duration: 1.8,
      ease: 'power2.out'
    });
  }

  // Create Flight path Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      // Arrived at the planet city helipad! Open project details overlay
      const detail = projectDetails[projectId];
      document.getElementById('project-detail-meta')!.textContent = detail.meta;
      document.getElementById('project-detail-title')!.textContent = detail.title;
      document.getElementById('project-detail-desc')!.textContent = detail.desc;
      
      const tagsContainer = document.getElementById('project-detail-tags')!;
      tagsContainer.innerHTML = '';
      detail.tags.forEach(tag => {
        const span = document.createElement('span');
        span.textContent = tag;
        tagsContainer.appendChild(span);
      });

      const featuresContainer = document.getElementById('project-detail-features')!;
      featuresContainer.innerHTML = '';
      detail.features.forEach(feat => {
        const li = document.createElement('li');
        li.textContent = feat;
        featuresContainer.appendChild(li);
      });

      document.getElementById('project-detail-overlay')!.classList.add('active');
    }
  });

  // 1. Takeoff (Vertical lift)
  tl.to(helicopter.position, {
    y: HEIGHTS.second + 4.8,
    duration: 1.6,
    ease: 'power1.inOut'
  });

  // 2. Rotate to face the selected skyscraper helipad & tilt forward
  const angleToPlanet = Math.atan2(targetLandingPos.x - (-3.75), targetLandingPos.z - 0);
  tl.to(helicopter.rotation, {
    y: angleToPlanet,
    x: 0.25, // tilt forward
    duration: 1.2,
    ease: 'power1.inOut'
  }, '<+=0.6');

  // 3. Fly to space city (hover above the target helipad)
  tl.to(helicopter.position, {
    x: targetLandingPos.x,
    y: targetLandingPos.y + 0.6, // approach from slightly above
    z: targetLandingPos.z,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '+=0.1');

  // Move camera & controls target to track and frame the landing zone
  tl.to(camera.position, {
    x: targetLandingPos.x + 3.8,
    y: targetLandingPos.y + 2.0,
    z: targetLandingPos.z + 4.2,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '<');

  tl.to(controls.target, {
    x: targetLandingPos.x,
    y: targetLandingPos.y,
    z: targetLandingPos.z,
    duration: 3.5,
    ease: 'power2.inOut',
    onUpdate: () => controls.update()
  }, '<');

  // Transition environmental colors to Deep Space night
  const spaceBgColor = new THREE.Color(0x020206);
  tl.to(scene.background, {
    r: spaceBgColor.r,
    g: spaceBgColor.g,
    b: spaceBgColor.b,
    duration: 3.0
  }, '<');

  tl.to(ambientLight, {
    intensity: 0.35,
    duration: 3.0
  }, '<');

  tl.to(sunLight, {
    intensity: 0.0,
    duration: 3.0
  }, '<');

  tl.to(moonLight, {
    intensity: 0.0,
    duration: 3.0
  }, '<');

  tl.to(starPoints.material, {
    opacity: 1.0,
    duration: 3.0
  }, '<');

  // Scale up the space city group
  tl.to(cityGroup.scale, {
    x: 1.0,
    y: 1.0,
    z: 1.0,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '<');

  // Scale up the planet group to make it even larger
  tl.to(planetGroup.scale, {
    x: 6.5,
    y: 6.5,
    z: 6.5,
    duration: 3.5,
    ease: 'power2.inOut'
  }, '<');

  // 4. Slow down rotors, hover level, and descend to land on skyscraper
  tl.to(helicopter.rotation, {
    x: 0.05, // Level tilt
    duration: 1.0,
    ease: 'power1.out'
  }, '+=0.1');

  if (thrusterFireL && thrusterFireR) {
    tl.to([thrusterFireL.scale, thrusterFireR.scale], {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 1.0
    }, '<');
  }

  tl.to(rotorControl, {
    value: 0.08, // Idle spin
    duration: 1.5,
    ease: 'power1.out',
    onUpdate: () => {
      rotorSpeed = rotorControl.value;
    }
  }, '<');

  // Vertical descent onto the pad
  tl.to(helicopter.position, {
    y: targetLandingPos.y,
    duration: 1.2,
    ease: 'power1.inOut'
  }, '<');
}

function returnToEarth() {
  // Hide details panel
  document.getElementById('project-detail-overlay')!.classList.remove('active');

  const targetLandingPos = cityHelipads[currentPlanetHelipadIdx];

  // Spin up rotors
  const rotorControl = { value: rotorSpeed };
  gsap.to(rotorControl, {
    value: 0.45,
    duration: 1.2,
    ease: 'power1.in',
    onUpdate: () => {
      rotorSpeed = rotorControl.value;
    }
  });

  // Scale up thruster flames
  if (thrusterFireL && thrusterFireR) {
    gsap.to([thrusterFireL.scale, thrusterFireR.scale], {
      x: 1.0,
      y: 2.2,
      z: 1.0,
      duration: 1.2,
      ease: 'power2.out'
    });
  }

  // Turn helicopter to face the house & tilt forward
  const angleToHouse = Math.atan2(-3.75 - targetLandingPos.x, 0 - targetLandingPos.z);
  gsap.to(helicopter.rotation, {
    y: angleToHouse,
    x: 0.25,
    duration: 1.0,
    ease: 'power1.inOut',
    delay: 0.5
  });

  const tl = gsap.timeline({
    onComplete: () => {
      // Descend & Land on the house helipad
      gsap.to(helicopter.position, {
        y: HEIGHTS.second + 2.24,
        duration: 1.8,
        ease: 'power1.inOut',
        onComplete: () => {
          // Power down
          gsap.to(rotorControl, {
            value: 0.0,
            duration: 1.8,
            ease: 'power1.out',
            onUpdate: () => {
              rotorSpeed = rotorControl.value;
            }
          });

          // Reset flight flags
          isSpaceTrip = false;
          isTransitioning = false;

          // Re-activate Projects Card view panel
          const panel = document.querySelector(`.info-card[id-panel="projects"]`);
          if (panel) panel.classList.add('active');
        }
      });

      // Level rotation
      gsap.to(helicopter.rotation, {
        x: 0,
        y: 0,
        duration: 1.2,
        ease: 'power1.inOut'
      });

      if (thrusterFireL && thrusterFireR) {
        gsap.to([thrusterFireL.scale, thrusterFireR.scale], {
          x: 0.001,
          y: 0.001,
          z: 0.001,
          duration: 1.2
        });
      }
    }
  });

  // 1. Takeoff (Vertical lift from skyscraper pad)
  tl.to(helicopter.position, {
    y: targetLandingPos.y + 0.8,
    duration: 1.2,
    ease: 'power1.inOut'
  });

  // 2. Flight back across space
  tl.to(helicopter.position, {
    x: -3.75,
    y: HEIGHTS.second + 4.8,
    z: 0,
    duration: 3.8,
    ease: 'power2.inOut'
  }, '+=0.1');

  // Move camera & controls target back to projects view
  const targetView = cameraViews.projects;
  tl.to(camera.position, {
    x: targetView.position.x,
    y: targetView.position.y,
    z: targetView.position.z,
    duration: 3.8,
    ease: 'power2.inOut'
  }, '<');

  tl.to(controls.target, {
    x: targetView.target.x,
    y: targetView.target.y,
    z: targetView.target.z,
    duration: 3.8,
    ease: 'power2.inOut',
    onUpdate: () => controls.update()
  }, '<');

  // Restore environmental colors based on theme mode
  const bgThemeColor = new THREE.Color(isDarkMode ? 0x090a14 : 0xfaf8f5);
  tl.to(scene.background, {
    r: bgThemeColor.r,
    g: bgThemeColor.g,
    b: bgThemeColor.b,
    duration: 3.2
  }, '<');

  tl.to(ambientLight, {
    intensity: isDarkMode ? 0.85 : 1.2,
    duration: 3.2
  }, '<');

  const ambientThemeColor = new THREE.Color(isDarkMode ? 0x6c7cb8 : 0xfff6eb);
  tl.to(ambientLight.color, {
    r: ambientThemeColor.r,
    g: ambientThemeColor.g,
    b: ambientThemeColor.b,
    duration: 3.2
  }, '<');

  tl.to(sunLight, {
    intensity: isDarkMode ? 0.0 : 1.4,
    duration: 3.2
  }, '<');

  tl.to(moonLight, {
    intensity: isDarkMode ? 2.0 : 0.0,
    duration: 3.2
  }, '<');

  tl.to(starPoints.material, {
    opacity: isDarkMode ? 1.0 : 0.0,
    duration: 3.2
  }, '<');

  // Shrink the space city scale back to collapse
  tl.to(cityGroup.scale, {
    x: 0.001,
    y: 0.001,
    z: 0.001,
    duration: 3.8,
    ease: 'power2.inOut'
  }, '<');

  // Shrink the Saturn planet scale back to original
  tl.to(planetGroup.scale, {
    x: isDarkMode ? 1.0 : 0.001,
    y: isDarkMode ? 1.0 : 0.001,
    z: isDarkMode ? 1.0 : 0.001,
    duration: 3.8,
    ease: 'power2.inOut'
  }, '<');
}

