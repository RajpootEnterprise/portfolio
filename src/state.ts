import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export const state = {
  // Core Three.js references
  scene: null as unknown as THREE.Scene,
  camera: null as unknown as THREE.PerspectiveCamera,
  renderer: null as unknown as THREE.WebGLRenderer,
  controls: null as unknown as OrbitControls,
  avatar: null as any,
  houseGroup: null as unknown as THREE.Group,
  flagMesh: null as unknown as THREE.Mesh,
  ufoList: [] as THREE.Group[],
  spaceshipList: [] as THREE.Group[],
  
  // Raycasting & Cursors
  raycaster: new THREE.Raycaster(),
  mouse: new THREE.Vector2(),
  interactiveObjects: [] as THREE.Object3D[],
  
  // References to moving parts
  elevator: null as unknown as THREE.Group,
  mailboxFlag: null as unknown as THREE.Group,
  letterMesh: null as unknown as THREE.Mesh,
  windmillBlades: null as any,
  
  // References to Helicopter & Helipad
  helipad: null as unknown as THREE.Group,
  helicopter: null as unknown as THREE.Group,
  mainRotor: null as unknown as THREE.Group,
  tailRotor: null as unknown as THREE.Group,
  rotorSpeed: 0,
  isSpaceTrip: false,
  thrusterFireL: null as unknown as THREE.Mesh,
  thrusterFireR: null as unknown as THREE.Mesh,
  cityGroup: null as unknown as THREE.Group,
  cityHelipads: [] as THREE.Vector3[],
  currentPlanetHelipadIdx: 0,
  activeSpacePlanetIdx: 0,
  
  // References to environment elements
  sunGroup: null as unknown as THREE.Group,
  moonGroup: null as unknown as THREE.Group,
  planetGroup: null as unknown as THREE.Group,
  planetList: [] as THREE.Group[],
  riverMesh1: null as unknown as THREE.Mesh,
  riverMesh2: null as unknown as THREE.Mesh,
  starPoints: null as unknown as THREE.Points,
  birdsGroup: null as unknown as THREE.Group,
  birdsList: [] as THREE.Group[],
  serverLights: [] as THREE.Mesh[],
  fairyLights: [] as THREE.Mesh[],
  
  // References to lights
  ambientLight: null as unknown as THREE.AmbientLight,
  sunLight: null as unknown as THREE.DirectionalLight,
  moonLight: null as unknown as THREE.DirectionalLight,
  streetLampLight: null as unknown as THREE.PointLight,
  fireplaceLight: null as unknown as THREE.PointLight,
  deskLampLight: null as unknown as THREE.PointLight,
  roomLights: [] as THREE.PointLight[],
  
  // References to physical bulb meshes that turn on/off visually
  bulbMeshes: [] as THREE.Mesh[],
  
  // References to interactive materials
  screens: [] as THREE.Mesh[],
  laptopScreenMesh: null as unknown as THREE.Mesh,
  arcadeScreenMesh: null as unknown as THREE.Mesh,
  fireplaceLogMesh: null as unknown as THREE.Mesh,
  
  // Floating lists
  floatingLabels: [] as THREE.Mesh[],
  floatingTechShapes: [] as THREE.Mesh[],
  
  // State logic
  currentRoom: 'overview',
  isTransitioning: false,
  isDarkMode: false,
  idleTimer: undefined as any,
  
  // Airplane and train animations
  planeMesh1: null as unknown as THREE.Group,
  planeMesh2: null as unknown as THREE.Group,
  trainGroup: null as unknown as THREE.Group,
  trainCarriages: [] as THREE.Group[],
  trainAngle: 0,
  trainSpeed: 0.22,
  trainState: 'running' as 'running' | 'decelerating' | 'stopped' | 'accelerating',
  trainStopTimer: 0,
  
  // Audio synthesizer state
  synthAudio: null as any
};
