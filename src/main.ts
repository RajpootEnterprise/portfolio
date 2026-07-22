import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
// @ts-ignore
import gsap from 'gsap';

import {
  PALETTE,
  SkeletalBeam,
  CrystallineHub,
  TranslucentScreen,
  MemoryCube,
  LowPolyIcon,
  CraneArmAssembly
} from './blocks';

// ----------------------------------------------------
// Global App Variables & State
// ----------------------------------------------------
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let controls: OrbitControls;

// State management
type ViewState = 'overview' | 'about' | 'projects' | 'contact';
let currentViewState: ViewState = 'overview';
let isCameraAnimating = false;

// Project retrieval state
let activeProjectScreen: TranslucentScreen | null = null;
let projectOriginalPos = new THREE.Vector3();
let surroundingArchiveStacks: THREE.Group[] = [];

// Spire transmission state
let isTransmitting = false;
let activeSpirePulseParticles: THREE.Mesh[] = [];

// Object collections for animations/raycasting
const updatableObjects: any[] = [];
const hoverableObjects: { mesh: THREE.Object3D; onHover: () => void; onUnhover: () => void; onClick?: () => void }[] = [];

// Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Layout Coordinates
const COORDS = {
  overview: {
    cam: new THREE.Vector3(42, 38, 42),
    target: new THREE.Vector3(0, 0, 0)
  },
  about: {
    origin: new THREE.Vector3(-30, 0, -10),
    milestones: [
      {
        id: 'bio',
        pos: new THREE.Vector3(-25, 0.5, 0),
        cam: new THREE.Vector3(-18, 5, 8),
        target: new THREE.Vector3(-25, 1, 0),
        title: 'SIDDHANT_STREAM_01',
        tags: ['SIDDHANT S. RAJPOOT', 'DEVELOPER', 'CGPA: 8.5'],
        lines: [
          'NAME: SIDDHANT SINGH RAJPOOT',
          'ROLE: ASSOCIATE SOFTWARE DEVELOPER',
          'EMAIL: siddhantsinghrajpoot91@gmail.com',
          'PHONE: +91 6266759537',
          'B.TECH: BADERIA G.I.E.M. (CGPA: 8.5)'
        ],
        metrics: [
          { label: 'CGPA', value: '8.5 / 10', magenta: false },
          { label: 'Status', value: 'Active', magenta: true }
        ]
      },
      {
        id: 'skills',
        pos: new THREE.Vector3(-30, 0.5, -12),
        cam: new THREE.Vector3(-23, 6, -4),
        target: new THREE.Vector3(-30, 1.5, -12),
        title: 'SKILLS_MATRIX_02',
        tags: ['BACKEND', 'MICROSERVICES', 'DEVOPS'],
        lines: [
          'LANGUAGES: Java // DSA // JS // HTML // CSS',
          'FRAMEWORKS: Spring Boot // REST APIs',
          'PLATFORMS: Docker // Kubernetes // Kafka',
          'CERTIFICATION: AWS Cloud Quest Practitioner',
          'CONCEPTS: System Design // Microservices'
        ],
        metrics: [
          { label: 'Core Tech', value: 'Java / Spring', magenta: false },
          { label: 'AWS Cert', value: 'Practitioner', magenta: true }
        ]
      },
      {
        id: 'history',
        pos: new THREE.Vector3(-38, 0.5, -24),
        cam: new THREE.Vector3(-31, 7, -16),
        target: new THREE.Vector3(-38, 1.8, -24),
        title: 'EXPERIENCE_LOGS_03',
        tags: ['EMPLOYMENT', 'LOGS', 'HACKATHONS'],
        lines: [
          'HT INFOSYSTEM: Jun 2026-Present (ASD)',
          'HT INFOSYSTEM: Feb 2026-May 2026 (Intern)',
          'MBG CARDS: Feb 2025-Jun 2025 (GMB Developer)',
          'SIH: Smart India Hackathon Participant',
          'ODOO: Odoo Hackathon Problem-Solving'
        ],
        metrics: [
          { label: 'Experience', value: '1.5 Yrs+', magenta: false },
          { label: 'Hackathons', value: 'Smart India', magenta: true }
        ]
      }
    ]
  },
  projects: {
    origin: new THREE.Vector3(0, 0, 28),
    camFocus: new THREE.Vector3(0, 8, 16),
    targetFocus: new THREE.Vector3(0, 2, 28),
    list: [
      {
        title: 'BROADNET.AI [LIVE]',
        lines: [
          'Live, production-grade billing microservice.',
          'Integrated Stripe payment gateway processing.',
          'Supported prepaid/postpaid billing workflows.',
          'Docker, Kubernetes, and Kafka architecture.',
          'Ensured scaling of live backend systems.'
        ],
        pos: new THREE.Vector3(-4, 2.5, 30),
        tags: ['Java', 'Spring Boot', 'Kafka', 'Docker'],
        metrics: [
          { label: 'Uptime', value: '99.9%', magenta: false },
          { label: 'Architecture', value: 'Microservices', magenta: true }
        ]
      },
      {
        title: 'E-LEARNING PLATFORM',
        lines: [
          'Developed role-based learning system.',
          'Supported students and mentors access levels.',
          'Integrated video-based training modules.',
          'Core Java, Servlets, JSP and MySQL database.',
          'Status: Code available on GitHub profile.'
        ],
        pos: new THREE.Vector3(0, 3.5, 31.5),
        tags: ['Core Java', 'Servlets', 'JSP', 'MySQL'],
        metrics: [
          { label: 'Database', value: 'MySQL', magenta: false },
          { label: 'Codebase', value: 'Open Source', magenta: true }
        ]
      },
      {
        title: 'AWS CLOUD Practitioner',
        lines: [
          'AWS Cloud Quest Cloud Practitioner certification.',
          'Hands-on cloud fundamentals and AWS concepts.',
          'TSSC - 5G Advance Competence Training.',
          'Focus: Networking, Signaling, and Research.',
          'AWS tools: EC2, S3, RDS, IAM deployments.'
        ],
        pos: new THREE.Vector3(4, 2.5, 30),
        tags: ['AWS', 'Cloud', '5G Systems', 'Networking'],
        metrics: [
          { label: 'AWS Quest', value: 'Completed', magenta: false },
          { label: '5G Training', value: 'TSSC Research', magenta: true }
        ]
      }
    ]
  },
  contact: {
    origin: new THREE.Vector3(30, 0, -20),
    cam: new THREE.Vector3(38, 4.5, -12),
    target: new THREE.Vector3(30, 8, -20)
  }
};

// ----------------------------------------------------
// UI Elements Mapping
// ----------------------------------------------------
const hudButtons = document.querySelectorAll('.nav-btn');
const detailPanel = document.getElementById('detail-panel')!;
const closeDetailBtn = document.getElementById('close-detail-btn')!;
const instructionText = document.getElementById('instruction-text')!;
const instructionScrollIcon = document.getElementById('instruction-scroll-icon')!;
const aboutScrollWrapper = document.getElementById('about-scroll-wrapper')!;
const contactConsole = document.getElementById('contact-console')!;
const contactForm = document.getElementById('contact-form') as HTMLFormElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const sendSuccessMsg = document.getElementById('send-success-msg')!;

// Coordinates display HUD
const diagCoordX = document.getElementById('diag-coord-x')!;
const diagCoordY = document.getElementById('diag-coord-y')!;

// Labels HTML
const labelAbout = document.getElementById('label-about')!;
const labelProjects = document.getElementById('label-projects')!;
const labelContact = document.getElementById('label-contact')!;

// Nodes for floating labels sync
let hubAboutNode: CrystallineHub;
let hubProjectsNode: CrystallineHub;
let hubContactNode: CrystallineHub;

// ----------------------------------------------------
// About timeline elements collection
// ----------------------------------------------------
const aboutBeams: SkeletalBeam[] = [];
const aboutHubs: CrystallineHub[] = [];
const aboutCubes: MemoryCube[] = [];
const aboutScreens: TranslucentScreen[] = [];
const aboutIcons: LowPolyIcon[] = [];

// ----------------------------------------------------
// Init System
// ----------------------------------------------------
function init() {
  const container = document.getElementById('canvas-container')!;
  
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.deepSlate);
  scene.fog = new THREE.FogExp2(PALETTE.deepSlate, 0.015);

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.copy(COORDS.overview.cam);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.05; // don't go below floor
  controls.minDistance = 5;
  controls.maxDistance = 120;
  controls.target.copy(COORDS.overview.target);

  // Postprocessing (Bloom Pass)
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.65, 0.35);
  bloomPass.threshold = 0.35; // only bright neon highlights bloom
  bloomPass.strength = 0.45; // softer, elegant glow
  bloomPass.radius = 0.65;

  const outputPass = new OutputPass();

  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(20, 40, 20);
  scene.add(mainLight);

  const cyanLight = new THREE.DirectionalLight(PALETTE.cyan, 0.4);
  cyanLight.position.set(-20, 10, -20);
  scene.add(cyanLight);

  // Build Scene Grid & Architecture
  buildCoreGrid();
  buildOverviewMapHubs();
  buildAboutTimelineScene();
  buildProjectsScene();
  buildContactSpireScene();

  // Setup Event Listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);
  window.addEventListener('keydown', onKeyDown);
  
  // HUD button listeners
  hudButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = (e.currentTarget as HTMLButtonElement).getAttribute('data-target') as ViewState;
      transitionView(target);
    });
  });

  closeDetailBtn.addEventListener('click', closeDetails);

  // Labels overlay navigation clicking
  labelAbout.addEventListener('click', () => transitionView('about'));
  labelProjects.addEventListener('click', () => transitionView('projects'));
  labelContact.addEventListener('click', () => transitionView('contact'));

  // Form submission handler
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerTransmissionSequence();
  });

  // Start Animation Loop
  animate();
}

// ----------------------------------------------------
// Scene Construction functions
// ----------------------------------------------------
function buildCoreGrid() {
  // Infinite Blueprint ground grid
  const gridHelper = new THREE.GridHelper(200, 100, PALETTE.cyan, 0x22262B);
  // @ts-ignore
  gridHelper.material.transparent = true;
  // @ts-ignore
  gridHelper.material.opacity = 0.12;
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  // Minor secondary magenta grid
  const gridHelperMag = new THREE.GridHelper(200, 20, PALETTE.magenta, 0x22262B);
  // @ts-ignore
  gridHelperMag.material.transparent = true;
  // @ts-ignore
  gridHelperMag.material.opacity = 0.05;
  gridHelperMag.position.y = -0.01;
  scene.add(gridHelperMag);

  // Floor plane with reflective characteristics
  const floorGeom = new THREE.PlaneGeometry(300, 300);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x131518,
    roughness: 0.25,
    metalness: 0.8,
    transparent: true,
    opacity: 0.95
  });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  scene.add(floor);
}

function buildOverviewMapHubs() {
  // Neighborhood central points & text tags
  // About node center
  hubAboutNode = new CrystallineHub(2.0);
  hubAboutNode.position.copy(COORDS.about.origin).y = 1.0;
  scene.add(hubAboutNode);
  updatableObjects.push(hubAboutNode);

  // Projects node center
  hubProjectsNode = new CrystallineHub(2.0);
  hubProjectsNode.position.copy(COORDS.projects.origin).y = 1.0;
  scene.add(hubProjectsNode);
  updatableObjects.push(hubProjectsNode);

  // Contact node center
  hubContactNode = new CrystallineHub(2.0);
  hubContactNode.position.copy(COORDS.contact.origin).y = 1.0;
  scene.add(hubContactNode);
  updatableObjects.push(hubContactNode);

  // Raycaster hover configs for neighborhood hub crystal shells
  // Hovering hubs unfolds their skeletal guides
  setupHubInteractions(hubAboutNode, 'about');
  setupHubInteractions(hubProjectsNode, 'projects');
  setupHubInteractions(hubContactNode, 'contact');
}

function setupHubInteractions(hub: CrystallineHub, viewKey: ViewState) {
  // Access the outerCrystal mesh inside the hub to register hover
  const meshToHover = hub.children[0];
  hoverableObjects.push({
    mesh: meshToHover,
    onHover: () => {
      if (currentViewState !== 'overview') return;
      hub.setActive(true, true);
      document.body.style.cursor = 'pointer';
      
      // Update label highlight
      if (viewKey === 'about') {
        labelAbout.classList.add('active');
        aboutBeams.forEach(b => b.setUnfoldProgress(0.4));
      } else if (viewKey === 'projects') {
        labelProjects.classList.add('active');
      } else if (viewKey === 'contact') {
        labelContact.classList.add('active');
      }
    },
    onUnhover: () => {
      if (currentViewState !== 'overview') return;
      hub.setActive(false, true);
      document.body.style.cursor = 'default';
      
      // Reset label highlight
      if (viewKey === 'about') {
        labelAbout.classList.remove('active');
        aboutBeams.forEach(b => b.setUnfoldProgress(0));
      } else if (viewKey === 'projects') {
        labelProjects.classList.remove('active');
      } else if (viewKey === 'contact') {
        labelContact.classList.remove('active');
      }
    },
    onClick: () => {
      if (currentViewState !== 'overview') return;
      transitionView(viewKey);
    }
  });
}

function buildAboutTimelineScene() {
  const group = new THREE.Group();
  scene.add(group);

  // Winding timeline path points
  const p1 = COORDS.about.origin;
  const pBio = COORDS.about.milestones[0].pos;
  const pSkills = COORDS.about.milestones[1].pos;
  const pHistry = COORDS.about.milestones[2].pos;

  // Create Skeletal Beams linking winding path
  // Link Hub to Bio
  const beam1 = new SkeletalBeam(getDistance(p1, pBio), 0.4, 0.4);
  alignBeamBetweenPoints(beam1, p1, pBio);
  group.add(beam1);
  aboutBeams.push(beam1);

  // Link Bio to Skills
  const beam2 = new SkeletalBeam(getDistance(pBio, pSkills), 0.4, 0.4);
  alignBeamBetweenPoints(beam2, pBio, pSkills);
  group.add(beam2);
  aboutBeams.push(beam2);

  // Link Skills to History
  const beam3 = new SkeletalBeam(getDistance(pSkills, pHistry), 0.4, 0.4, true); // magenta beam!
  alignBeamBetweenPoints(beam3, pSkills, pHistry);
  group.add(beam3);
  aboutBeams.push(beam3);

  // Assemble Milestone nodes along path
  COORDS.about.milestones.forEach((milestone, idx) => {
    // 1. Crystalline Hub for each milestone node
    const mHub = new CrystallineHub(0.7);
    mHub.position.copy(milestone.pos);
    group.add(mHub);
    aboutHubs.push(mHub);
    updatableObjects.push(mHub);

    // 2. Translucent Screen projecting details
    const mScreen = new TranslucentScreen(2.8, 1.6, milestone.title, milestone.lines);
    mScreen.position.copy(milestone.pos).y += 1.5;
    mScreen.rotation.y = -Math.PI / 4;
    group.add(mScreen);
    aboutScreens.push(mScreen);
    updatableObjects.push(mScreen);

    // Click trigger on screen mesh
    hoverableObjects.push({
      mesh: mScreen.mesh,
      onHover: () => {
        if (currentViewState !== 'about' || mScreen.state === 'off') return;
        document.body.style.cursor = 'pointer';
        // highlight border
        // @ts-ignore
        gsap.to(mScreen.mesh.material, { opacity: 0.98, duration: 0.2 });
      },
      onUnhover: () => {
        if (currentViewState !== 'about' || mScreen.state === 'off') return;
        document.body.style.cursor = 'default';
        if (mScreen.state !== 'detail') {
          // @ts-ignore
          gsap.to(mScreen.mesh.material, { opacity: 0.6, duration: 0.2 });
        }
      },
      onClick: () => {
        if (currentViewState !== 'about' || mScreen.state === 'off') return;
        openMilestoneDetails(idx);
      }
    });

    // 3. Memory Cube & Low-Poly Icons integration
    if (milestone.id === 'bio') {
      const cube = new MemoryCube(1.0, false);
      cube.position.copy(milestone.pos).x += 1.8;
      cube.position.z -= 1.0;
      group.add(cube);
      aboutCubes.push(cube);
      updatableObjects.push(cube);
    } else if (milestone.id === 'skills') {
      // Code Editor Icon
      const codeIcon = new LowPolyIcon('code', PALETTE.cyan);
      codeIcon.position.copy(milestone.pos).x -= 1.8;
      codeIcon.position.y = 1.0;
      group.add(codeIcon);
      aboutIcons.push(codeIcon);
      updatableObjects.push(codeIcon);

      const cube = new MemoryCube(1.0, true);
      cube.position.copy(milestone.pos).z += 1.8;
      group.add(cube);
      aboutCubes.push(cube);
      updatableObjects.push(cube);
    } else if (milestone.id === 'history') {
      // Character Figure Icon
      const charIcon = new LowPolyIcon('character', PALETTE.magenta);
      charIcon.position.copy(milestone.pos).x += 1.8;
      charIcon.position.y = 1.0;
      group.add(charIcon);
      aboutIcons.push(charIcon);
      updatableObjects.push(charIcon);

      const cube = new MemoryCube(1.0, false);
      cube.position.copy(milestone.pos).z -= 1.8;
      cube.position.x -= 1.2;
      group.add(cube);
      aboutCubes.push(cube);
      updatableObjects.push(cube);
    }
  });
}

function buildProjectsScene() {
  const group = new THREE.Group();
  scene.add(group);

  // Position surrounding project archives stacks (built of boxes & skeletal trusses)
  const stackLeft = new THREE.Group();
  stackLeft.position.set(-6, 0, 31);
  group.add(stackLeft);
  surroundingArchiveStacks.push(stackLeft);

  const stackRight = new THREE.Group();
  stackRight.position.set(6, 0, 31);
  group.add(stackRight);
  surroundingArchiveStacks.push(stackRight);

  // Generate shelf visual blocks
  const shelfMat = new THREE.MeshStandardMaterial({
    color: PALETTE.deepGray,
    roughness: 0.5,
    metalness: 0.6
  });

  // Left stack shapes
  const shelfLeft = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.0, 3.0), shelfMat);
  shelfLeft.position.y = 2.0;
  stackLeft.add(shelfLeft);
  // Add wireframe structural lines for shelf
  const leftWire = new THREE.BoxHelper(shelfLeft, new THREE.Color(PALETTE.cyan));
  // @ts-ignore
  leftWire.material.opacity = 0.25;
  stackLeft.add(leftWire);

  // Right stack shapes
  const shelfRight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.0, 3.0), shelfMat);
  shelfRight.position.y = 2.0;
  stackRight.add(shelfRight);
  const rightWire = new THREE.BoxHelper(shelfRight, new THREE.Color(PALETTE.magenta));
  // @ts-ignore
  rightWire.material.opacity = 0.25;
  stackRight.add(rightWire);

  // 1. Crane Arm Assembly
  const crane = new CraneArmAssembly();
  crane.position.set(0, 0.25, 26); // centered base
  group.add(crane);
  // Store crane in updatable for references
  // @ts-ignore
  group.userData.crane = crane;

  // 2. Project modules and screens layout
  COORDS.projects.list.forEach((proj, idx) => {
    // Holographic flat screen for project thumbnails
    const pScreen = new TranslucentScreen(2.4, 1.4, proj.title, proj.lines);
    pScreen.position.copy(proj.pos);
    pScreen.rotation.y = 0; // facing screen
    group.add(pScreen);
    updatableObjects.push(pScreen);

    // Bind data in userData
    pScreen.userData = { index: idx, originalPos: proj.pos.clone(), projectData: proj };

    // Register raycasting hover and click to grab
    hoverableObjects.push({
      mesh: pScreen.mesh,
      onHover: () => {
        if (currentViewState !== 'projects' || isCameraAnimating) return;
        document.body.style.cursor = 'pointer';
        // highlight glowing border border
        const material = pScreen.mesh.material as THREE.MeshPhysicalMaterial;
        // @ts-ignore
        gsap.to(material, { opacity: 0.98, duration: 0.2 });
      },
      onUnhover: () => {
        if (currentViewState !== 'projects' || isCameraAnimating) return;
        document.body.style.cursor = 'default';
        if (activeProjectScreen !== pScreen) {
          const material = pScreen.mesh.material as THREE.MeshPhysicalMaterial;
          // @ts-ignore
          gsap.to(material, { opacity: 0.6, duration: 0.2 });
        }
      },
      onClick: () => {
        if (currentViewState !== 'projects' || isCameraAnimating) return;
        if (activeProjectScreen === pScreen) return;
        
        triggerProjectRetrievalSequence(pScreen, crane);
      }
    });
  });
}

function buildContactSpireScene() {
  const group = new THREE.Group();
  scene.add(group);

  const basePos = COORDS.contact.origin;
  const height = 18;

  // Spire Main core structure (cylindrical lattice structure)
  const coreGeom = new THREE.CylinderGeometry(0.1, 1.2, height, 4, 10, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x2C3035,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const spireMesh = new THREE.Mesh(coreGeom, coreMat);
  spireMesh.position.copy(basePos).y = height / 2;
  group.add(spireMesh);

  // Outer structural structural supports (cyan skeletal pillars)
  const pillarMat = new THREE.LineBasicMaterial({
    color: PALETTE.cyan,
    transparent: true,
    opacity: 0.7
  });

  const supportPoints = 3;
  const supportRadius = 2.2;
  const supportsVertices: number[] = [];

  for (let i = 0; i < supportPoints; i++) {
    const angle = (i / supportPoints) * Math.PI * 2;
    const xBase = basePos.x + Math.cos(angle) * supportRadius;
    const zBase = basePos.z + Math.sin(angle) * supportRadius;
    
    // Line going to apical transmitter
    supportsVertices.push(
      xBase, 0, zBase,
      basePos.x, height, basePos.z
    );
    
    // Add horizontal structural struts
    supportsVertices.push(
      xBase, 0, zBase,
      basePos.x + Math.cos(angle + (Math.PI*2/3)) * supportRadius, 0, basePos.z + Math.sin(angle + (Math.PI*2/3)) * supportRadius
    );
  }

  const supportGeom = new THREE.BufferGeometry();
  supportGeom.setAttribute('position', new THREE.Float32BufferAttribute(supportsVertices, 3));
  const supports = new THREE.LineSegments(supportGeom, pillarMat);
  group.add(supports);

  // 1. Apical transmitter - crystalline hub placed at apex of spire
  const apexTransmitter = new CrystallineHub(1.4);
  apexTransmitter.position.copy(basePos).y = height;
  group.add(apexTransmitter);
  updatableObjects.push(apexTransmitter);
  group.userData.apexTransmitter = apexTransmitter; // reference for pulse trigger

  // 2. Converging spiral light guide curves
  const spiralMat = new THREE.LineBasicMaterial({
    color: PALETTE.magenta,
    transparent: true,
    opacity: 0.6
  });

  const curvesCount = 3;
  const turns = 2.5;
  const pointsPerCurve = 80;
  
  // Store positions path for light pulses
  const curvesPaths: THREE.Vector3[][] = [];

  for (let c = 0; c < curvesCount; c++) {
    const pathPoints: THREE.Vector3[] = [];
    const baseAngleOffset = (c / curvesCount) * Math.PI * 2;
    const vertices: number[] = [];

    for (let p = 0; p <= pointsPerCurve; p++) {
      const t = p / pointsPerCurve; // 0 to 1
      const angle = baseAngleOffset + t * turns * Math.PI * 2;
      const radius = supportRadius * (1 - t * 0.9); // taper in towards apex
      
      const x = basePos.x + Math.cos(angle) * radius;
      const z = basePos.z + Math.sin(angle) * radius;
      const y = basePos.y + t * height;

      const vec = new THREE.Vector3(x, y, z);
      pathPoints.push(vec);
      vertices.push(x, y, z);
    }
    
    curvesPaths.push(pathPoints);

    // Create segments lines geometry
    const curveGeom = new THREE.BufferGeometry();
    const lineSegmentsVertices: number[] = [];
    for (let k = 0; k < vertices.length - 3; k += 3) {
      lineSegmentsVertices.push(
        vertices[k], vertices[k+1], vertices[k+2],
        vertices[k+3], vertices[k+4], vertices[k+5]
      );
    }
    curveGeom.setAttribute('position', new THREE.Float32BufferAttribute(lineSegmentsVertices, 3));
    const spiralLine = new THREE.LineSegments(curveGeom, spiralMat);
    group.add(spiralLine);
  }

  // Store paths for data pulse mapping
  group.userData.pulsePaths = curvesPaths;

  // Base console display screens
  const consoleScreen = new TranslucentScreen(2.2, 1.2, 'UPLINK TERMINAL', ['SPIRE STATUS: ACQUIRING', 'PACKETS: 0%', 'INPUT PARAMS IN CONSOLE', 'TO TRANSMIT PULSE']);
  consoleScreen.position.copy(basePos).y = 1.6;
  consoleScreen.position.z += 2.8;
  consoleScreen.rotation.y = 0;
  group.add(consoleScreen);
  updatableObjects.push(consoleScreen);
  group.userData.consoleScreen = consoleScreen;
}

// ----------------------------------------------------
// Mathematics & Alignment helpers
// ----------------------------------------------------
function getDistance(p1: THREE.Vector3, p2: THREE.Vector3): number {
  return p1.distanceTo(p2);
}

function alignBeamBetweenPoints(beam: SkeletalBeam, p1: THREE.Vector3, p2: THREE.Vector3) {
  // Position beam center
  const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  beam.position.copy(center);

  // Orient beam pointing along vector p1 -> p2
  const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  
  // Calculate quaternion
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
  beam.quaternion.copy(quaternion);

  // Since structural truss geometry was made along X axis in constructor,
  // we rotate it by PI/2 inside group to match the alignment path
  beam.rotation.z = Math.PI / 2;
}

// ----------------------------------------------------
// Navigation / Camera flight sequence
// ----------------------------------------------------
function transitionView(targetState: ViewState) {
  if (isCameraAnimating) return;
  if (targetState === currentViewState) return;

  isCameraAnimating = true;
  currentViewState = targetState;

  // Update nav sidebar buttons visual active class
  hudButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-target') === targetState) {
      btn.classList.add('active');
    }
  });

  // Reset overlay labels display
  labelAbout.style.display = targetState === 'overview' ? 'block' : 'none';
  labelProjects.style.display = targetState === 'overview' ? 'block' : 'none';
  labelContact.style.display = targetState === 'overview' ? 'block' : 'none';

  // Toggle scroll layers based on state
  if (targetState === 'about') {
    aboutScrollWrapper.classList.add('active');
    aboutScrollWrapper.scrollTop = 0;
    instructionScrollIcon.style.display = 'inline-block';
    instructionText.innerText = 'Scroll to Assemble Bio-Timeline';
  } else {
    aboutScrollWrapper.classList.remove('active');
    instructionScrollIcon.style.display = 'none';
  }

  // Toggle Project Stack recovery elements
  if (targetState !== 'projects') {
    closeDetails();
  } else {
    instructionText.innerText = 'Click project thumbnails in stack archives to retrieve data';
  }

  // Toggle Contact Spire details console
  if (targetState === 'contact') {
    contactConsole.classList.add('visible');
    instructionText.innerText = 'Input packet details in console and hit Transmit';
  } else {
    contactConsole.classList.remove('visible');
    sendSuccessMsg.style.display = 'none';
  }

  // Handle default instructions
  if (targetState === 'overview') {
    instructionText.innerText = 'Hover labels or nodes to activate skeletal blueprint lines';
  }

  // Target camera state
  let targetCamPos = new THREE.Vector3();
  let targetLookAt = new THREE.Vector3();
  let easePreset = 'power3.inOut';

  if (targetState === 'overview') {
    targetCamPos.copy(COORDS.overview.cam);
    targetLookAt.copy(COORDS.overview.target);
    
    // Set active crystal hubs back to inactive
    hubAboutNode.setActive(false);
    hubProjectsNode.setActive(false);
    hubContactNode.setActive(false);

    // Collapse Skeletal path
    aboutBeams.forEach(b => b.setUnfoldProgress(0));
    aboutHubs.forEach(h => h.setActive(false));
    aboutCubes.forEach(c => c.setActive(false));
    aboutScreens.forEach(s => s.transitionTo('off'));
  } 
  else if (targetState === 'about') {
    // Activate home hub crystal
    hubAboutNode.setActive(true);
    
    // Snap to the first section (Bio)
    const firstSection = COORDS.about.milestones[0];
    targetCamPos.copy(firstSection.cam);
    targetLookAt.copy(firstSection.target);
    
    // Trigger biological timelines unfolding sequence for section 1
    animateAboutSectionStates(0);
  } 
  else if (targetState === 'projects') {
    hubProjectsNode.setActive(true);
    targetCamPos.copy(COORDS.projects.camFocus);
    targetLookAt.copy(COORDS.projects.targetFocus);

    // Turn screens on
    scene.traverse(child => {
      if (child instanceof TranslucentScreen && child.position.z > 25) {
        child.transitionTo('activating');
      }
    });
  } 
  else if (targetState === 'contact') {
    hubContactNode.setActive(true);
    targetCamPos.copy(COORDS.contact.cam);
    targetLookAt.copy(COORDS.contact.target);

    // Console Screen activation
    scene.traverse(child => {
      if (child instanceof TranslucentScreen && child.position.z < 0 && child.position.x > 25) {
        child.transitionTo('activating');
      }
    });
  }

  // Disable controls temporarily during flight
  controls.enabled = false;

  // Execute Flight sequence
  gsap.to(camera.position, {
    x: targetCamPos.x,
    y: targetCamPos.y,
    z: targetCamPos.z,
    duration: 1.8,
    ease: easePreset,
  });

  gsap.to(controls.target, {
    x: targetLookAt.x,
    y: targetLookAt.y,
    z: targetLookAt.z,
    duration: 1.8,
    ease: easePreset,
    onComplete: () => {
      isCameraAnimating = false;
      controls.enabled = true;
    }
  });
}

// ----------------------------------------------------
// About timeline linked scroll logic
// ----------------------------------------------------
// Check scroll events on About container
aboutScrollWrapper.addEventListener('scroll', () => {
  if (currentViewState !== 'about' || isCameraAnimating) return;

  const scrollHeight = aboutScrollWrapper.scrollHeight - aboutScrollWrapper.clientHeight;
  const scrollTop = aboutScrollWrapper.scrollTop;
  const scrollProgress = scrollTop / scrollHeight; // 0 to 1

  // Section threshold mapping
  const numSections = COORDS.about.milestones.length;
  const step = 1 / (numSections - 1);
  const activeIdx = Math.round(scrollProgress / step);

  // Update target lookAt coordinates depending on scroll locks
  const activeMilestone = COORDS.about.milestones[activeIdx];
  
  // Smoothly travel camera lock on active scrolling anchor
  // @ts-ignore
  gsap.to(camera.position, {
    x: activeMilestone.cam.x,
    y: activeMilestone.cam.y,
    z: activeMilestone.cam.z,
    duration: 1.2,
    ease: 'power2.out'
  });
  // @ts-ignore
  gsap.to(controls.target, {
    x: activeMilestone.target.x,
    y: activeMilestone.target.y,
    z: activeMilestone.target.z,
    duration: 1.2,
    ease: 'power2.out'
  });

  // Animate structures assembling based on scroll index
  animateAboutSectionStates(activeIdx);
});

function animateAboutSectionStates(activeIndex: number) {
  // Progressively unfold skeletal beams up to the activeIndex
  // Bio path: beams[0] unfolds, hub[0] lights up
  // Skills path: beams[1] unfolds, hub[1] lights up
  // History path: beams[2] unfolds, hub[2] lights up
  
  aboutBeams.forEach((beam, idx) => {
    const targetProgress = idx <= activeIndex ? 1.0 : 0.0;
    gsap.to(beam, {
      progress: targetProgress,
      duration: 0.8,
      onUpdate: () => beam.setUnfoldProgress(beam.progress)
    });
  });

  aboutHubs.forEach((hub, idx) => {
    const isPast = idx <= activeIndex;
    hub.setActive(isPast, true);
  });

  aboutCubes.forEach((cube, idx) => {
    // Cube activation matching sections
    const isPast = idx <= activeIndex;
    cube.setActive(isPast, true);
  });

  aboutScreens.forEach((screen, idx) => {
    // Screen actived when reached
    if (idx === activeIndex) {
      screen.transitionTo('activating');
    } else if (idx < activeIndex) {
      screen.transitionTo('activating'); // keep active
    } else {
      screen.transitionTo('off');
    }
  });
}

function openMilestoneDetails(index: number) {
  const milestone = COORDS.about.milestones[index];
  const screen = aboutScreens[index];
  
  // Set screen detail state
  screen.transitionTo('detail');

  // Fill HTML panel
  document.getElementById('panel-title')!.innerText = `MILESTONE_DETAILS // ${milestone.id.toUpperCase()}`;
  document.getElementById('panel-heading')!.innerText = milestone.title;
  document.getElementById('panel-desc')!.innerText = milestone.lines.join('\n');
  
  // Set tags
  const tagsContainer = document.getElementById('panel-tags')!;
  tagsContainer.innerHTML = '';
  milestone.tags.forEach(t => {
    const span = document.createElement('span');
    span.className = 'detail-tag';
    span.innerText = t;
    tagsContainer.appendChild(span);
  });

  // Metrics
  const metricsContainer = document.getElementById('panel-metrics')!;
  metricsContainer.innerHTML = '';
  milestone.metrics.forEach(m => {
    const card = document.createElement('div');
    card.className = `metric-card ${m.magenta ? 'magenta' : ''}`;
    card.innerHTML = `
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value}</div>
    `;
    metricsContainer.appendChild(card);
  });

  detailPanel.classList.add('visible');
}

// ----------------------------------------------------
// Projects retrieval assembly sequences
// ----------------------------------------------------
function triggerProjectRetrievalSequence(screen: TranslucentScreen, crane: CraneArmAssembly) {
  isCameraAnimating = true;
  controls.enabled = false;

  // If there's already an active screen details, reset it first
  if (activeProjectScreen) {
    closeDetails();
  }

  activeProjectScreen = screen;
  projectOriginalPos.copy(screen.userData.originalPos);
  const projData = screen.userData.projectData;

  // Move camera slightly closer to focus screen
  const targetCamPos = new THREE.Vector3(0, 4.5, 23.5);
  const targetLookAt = new THREE.Vector3(0, 2.5, 28);

  gsap.to(camera.position, {
    x: targetCamPos.x,
    y: targetCamPos.y,
    z: targetCamPos.z,
    duration: 1.0,
    ease: 'power2.inOut'
  });

  gsap.to(controls.target, {
    x: targetLookAt.x,
    y: targetLookAt.y,
    z: targetLookAt.z,
    duration: 1.0,
    ease: 'power2.inOut'
  });

  // Crane grabs the chosen project screen
  const grabWorldPos = screen.position.clone();
  crane.animateGrab(grabWorldPos, () => {
    // Grabbing completed! Now smart animate screen pulling forward
    // @ts-ignore
    gsap.to(screen.position, {
      x: 0,
      y: 2.8,
      z: 25.8, // pull forward in Z-space towards crane wrist
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        screen.transitionTo('detail');
        isCameraAnimating = false;
        controls.enabled = true;
      }
    });

    // Fold surrounding archive stacks slightly back in Z-space and scale down
    surroundingArchiveStacks.forEach(stack => {
      // @ts-ignore
      gsap.to(stack.position, {
        z: 32.5, // push back in Z
        x: stack.position.x < 0 ? -6.8 : 6.8, // push aside in X
        duration: 0.8,
        ease: 'power2.out'
      });
      // @ts-ignore
      gsap.to(stack.scale, {
        x: 0.85,
        y: 0.85,
        z: 0.85,
        duration: 0.8,
        ease: 'power2.out'
      });
    });

    // Populate Sidebar Detail Panel
    document.getElementById('panel-title')!.innerText = `PROJECT_RETRIEVAL // ${projData.title}`;
    document.getElementById('panel-heading')!.innerText = projData.title;
    document.getElementById('panel-desc')!.innerText = projData.lines.join('\n');
    
    // Set tags
    const tagsContainer = document.getElementById('panel-tags')!;
    tagsContainer.innerHTML = '';
    projData.tags.forEach((t: string) => {
      const span = document.createElement('span');
      span.className = 'detail-tag magenta'; // magenta for projects
      span.innerText = t;
      tagsContainer.appendChild(span);
    });

    // Metrics
    const metricsContainer = document.getElementById('panel-metrics')!;
    metricsContainer.innerHTML = '';
    projData.metrics.forEach((m: { label: string; value: string; magenta: boolean }) => {
      const card = document.createElement('div');
      card.className = `metric-card ${m.magenta ? 'magenta' : ''}`;
      card.innerHTML = `
        <div class="metric-label">${m.label}</div>
        <div class="metric-value">${m.value}</div>
      `;
      metricsContainer.appendChild(card);
    });

    detailPanel.classList.add('visible');
  });
}

function closeDetails() {
  if (currentViewState === 'about') {
    aboutScreens.forEach(s => {
      if (s.state === 'detail') s.transitionTo('activating');
    });
    detailPanel.classList.remove('visible');
    return;
  }

  if (currentViewState === 'projects' && activeProjectScreen) {
    const screen = activeProjectScreen;
    activeProjectScreen = null;

    // Reset details screen state
    screen.transitionTo('activating');

    // Slide screen back to original shelf coordinates
    // @ts-ignore
    gsap.to(screen.position, {
      x: projectOriginalPos.x,
      y: projectOriginalPos.y,
      z: projectOriginalPos.z,
      duration: 0.7,
      ease: 'power2.inOut',
      onComplete: () => {
        // Reset crane pose
        const projectsGrp = scene.children.find((c: THREE.Object3D) => c instanceof THREE.Group && c.userData.crane !== undefined);
        if (projectsGrp) {
          // @ts-ignore
          projectsGrp.userData.crane.animateReset();
        }
      }
    });

    // Return surrounding archive shelves stacks to rest coords
    surroundingArchiveStacks.forEach(stack => {
      const restX = stack.position.x < 0 ? -6.0 : 6.0;
      // @ts-ignore
      gsap.to(stack.position, {
        x: restX,
        z: 31,
        duration: 0.7,
        ease: 'power2.inOut'
      });
      // @ts-ignore
      gsap.to(stack.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.7,
        ease: 'power2.inOut'
      });
    });

    // Reset camera position to neighborhood standard
    gsap.to(camera.position, {
      x: COORDS.projects.camFocus.x,
      y: COORDS.projects.camFocus.y,
      z: COORDS.projects.camFocus.z,
      duration: 0.8,
      ease: 'power2.inOut'
    });

    gsap.to(controls.target, {
      x: COORDS.projects.targetFocus.x,
      y: COORDS.projects.targetFocus.y,
      z: COORDS.projects.targetFocus.z,
      duration: 0.8,
      ease: 'power2.inOut'
    });

    detailPanel.classList.remove('visible');
  }
}

// ----------------------------------------------------
// Spire Transmission Firing Flow
// ----------------------------------------------------
function triggerTransmissionSequence() {
  if (isTransmitting) return;

  const nameInput = (document.getElementById('contact-name') as HTMLInputElement).value;
  const msgInput = (document.getElementById('contact-msg') as HTMLInputElement).value;

  if (!nameInput || !msgInput) return;

  isTransmitting = true;
  sendBtn.disabled = true;
  sendBtn.innerText = 'ENCODING SIGNAL...';

  // Get Spire Group references
  const spireGrp = scene.children.find((c: THREE.Object3D) => c instanceof THREE.Group && c.userData.pulsePaths !== undefined);
  if (!spireGrp) {
    isTransmitting = false;
    sendBtn.disabled = false;
    sendBtn.innerText = 'TRANSMIT DATA PACKET';
    return;
  }

  // Console Screen text load update
  const cScreen = spireGrp.userData.consoleScreen as TranslucentScreen;
  cScreen.updateCanvasText('SIGNAL TRANSMITTING', [
    `SOURCE ID: ${nameInput.toUpperCase()}`,
    'SIGNAL ENVELOPE: VOLUMETRIC',
    'CONVERGING SPATIAL CHANNELS...',
    'DATA PACKETS UPLINKING NOW.'
  ], true); // magenta warnings warning theme!

  // Retrieve coordinates path guides
  const paths = spireGrp.userData.pulsePaths as THREE.Vector3[][];
  const apexTransmitter = spireGrp.userData.apexTransmitter as CrystallineHub;

  // Create neon pulse particles along curves
  const pulseGeom = new THREE.SphereGeometry(0.18, 5, 5);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: PALETTE.magenta,
    transparent: true,
    opacity: 0.95
  });

  const timeline = gsap.timeline();

  // Instantiate 3 particles (one for each spiral light guide curve)
  const particles: THREE.Mesh[] = [];
  paths.forEach(path => {
    const pMesh = new THREE.Mesh(pulseGeom, pulseMat);
    pMesh.position.copy(path[0]);
    scene.add(pMesh);
    particles.push(pMesh);
    activeSpirePulseParticles.push(pMesh);
  });

  // Animate particles moving along paths using custom progress variable
  const progressObj = { t: 0 };
  
  timeline.to(progressObj, {
    t: 1.0,
    duration: 1.8,
    ease: 'power2.in',
    onUpdate: () => {
      const idx = Math.min(
        Math.floor(progressObj.t * (paths[0].length - 1)),
        paths[0].length - 1
      );
      
      // Update each particle position mapping to index path progress
      particles.forEach((pMesh, pIdx) => {
        pMesh.position.copy(paths[pIdx][idx]);
      });
    },
    onComplete: () => {
      // Particles reached apex! Trigger Flash on apical transmitter hub
      particles.forEach(p => scene.remove(p));
      activeSpirePulseParticles = [];

      // Flash Apical Transmitter Crystal Hub
      apexTransmitter.setActive(true, false);
      const lightObj = apexTransmitter.children.find((c: THREE.Object3D) => c instanceof THREE.PointLight) as THREE.PointLight;
      const coreObj = apexTransmitter.children[2] as THREE.Mesh;
      
      // Volumetric wave expanding rings effect
      const waveGeom = new THREE.RingGeometry(0.5, 0.6, 12);
      const waveMat = new THREE.MeshBasicMaterial({
        color: PALETTE.magenta,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const wave = new THREE.Mesh(waveGeom, waveMat);
      wave.position.copy(apexTransmitter.position);
      wave.rotation.x = Math.PI / 2; // flat horizontal wave
      scene.add(wave);

      gsap.to(wave.scale, {
        x: 18,
        y: 18,
        z: 18,
        duration: 1.2,
        ease: 'power1.out'
      });

      gsap.to(waveMat, {
        opacity: 0,
        duration: 1.2,
        onComplete: () => {
          scene.remove(wave);
        }
      });

      // Spire core flash
      gsap.timeline()
        .to(lightObj, { intensity: 35.0, duration: 0.1 })
        .to(coreObj.scale, { x: 3.5, y: 3.5, z: 3.5, duration: 0.1 }, '-=0.1')
        .to(lightObj, { intensity: 4.5, duration: 1.0, ease: 'power2.out' })
        .to(coreObj.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 1.0, ease: 'power2.out' }, '-=1.0')
        .onComplete(() => {
          // Set back to default active state
          apexTransmitter.setActive(true, true);
        });

      // Update terminal console screen text
      cScreen.updateCanvasText('SIGNAL TRANSMITTED', [
        'PACKETS DEPLOYED: 100%',
        `TRANSMITTER: ${nameInput.toUpperCase()}`,
        'STATUS: BROADCASTING APICAL',
        'TRANSMISSION COMPLETED SUCCESSFULLY.'
      ]);

      // Complete transmission reset inputs
      sendSuccessMsg.style.display = 'block';
      sendBtn.innerText = 'TRANSMITTED';
      
      setTimeout(() => {
        contactForm.reset();
        sendBtn.disabled = false;
        sendBtn.innerText = 'TRANSMIT DATA PACKET';
        isTransmitting = false;
      }, 3000);
    }
  });
}

// ----------------------------------------------------
// Raycasting Event Handlers
// ----------------------------------------------------
let lastHoveredObject: any = null;

function onMouseMove(event: MouseEvent) {
  // Update mouse coordinate vectors
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Diagnostics HUD updating coords
  diagCoordX.innerText = mouse.x.toFixed(2);
  diagCoordY.innerText = mouse.y.toFixed(2);

  if (isCameraAnimating) return;

  // Perform Raycast hover checking
  raycaster.setFromCamera(mouse, camera);
  const targets = hoverableObjects.map(obj => obj.mesh);
  const intersects = raycaster.intersectObjects(targets, true);

  if (intersects.length > 0) {
    let hitMesh = intersects[0].object;
    // Find matched hoverable item configurations
    const hoveredItem = hoverableObjects.find(obj => {
      // Direct child check or nested mesh check
      return obj.mesh === hitMesh || obj.mesh.uuid === hitMesh.uuid || isParentOf(obj.mesh, hitMesh);
    });

    if (hoveredItem) {
      if (lastHoveredObject && lastHoveredObject !== hoveredItem) {
        lastHoveredObject.onUnhover();
      }
      hoveredItem.onHover();
      lastHoveredObject = hoveredItem;
    }
  } else {
    if (lastHoveredObject) {
      lastHoveredObject.onUnhover();
      lastHoveredObject = null;
    }
  }
}

function onClick() {
  if (isCameraAnimating || !lastHoveredObject) return;
  if (lastHoveredObject.onClick) {
    lastHoveredObject.onClick();
  }
}

function isParentOf(parent: THREE.Object3D, child: THREE.Object3D): boolean {
  let p = child.parent;
  while (p !== null) {
    if (p === parent) return true;
    p = p.parent;
  }
  return false;
}

// Keydown listeners (ESC or A/B/C navigations)
function onKeyDown(event: KeyboardEvent) {
  if (isCameraAnimating) return;

  const key = event.key.toUpperCase();
  if (key === 'ESCAPE') {
    transitionView('overview');
  } else if (key === 'A') {
    transitionView('about');
  } else if (key === 'B') {
    transitionView('projects');
  } else if (key === 'C') {
    transitionView('contact');
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------------------
// HTML Overlay Labels project layout synchronization
// ----------------------------------------------------
const tempV = new THREE.Vector3();

function updateOverlayHTML_Labels() {
  if (currentViewState !== 'overview') {
    labelAbout.style.display = 'none';
    labelProjects.style.display = 'none';
    labelContact.style.display = 'none';
    return;
  }

  // Sync About hub label
  syncLabelPosition(hubAboutNode, labelAbout);
  // Sync Projects hub label
  syncLabelPosition(hubProjectsNode, labelProjects);
  // Sync Contact hub label
  syncLabelPosition(hubContactNode, labelContact);
}

function syncLabelPosition(mesh: THREE.Object3D, labelEl: HTMLElement) {
  mesh.updateMatrixWorld();
  tempV.setFromMatrixPosition(mesh.matrixWorld);
  tempV.y += 2.8; // position slightly above crystallines
  
  // Project vectors coords to normalized screen dimensions
  tempV.project(camera);

  // Check bounds
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  
  const meshDir = new THREE.Vector3().subVectors(mesh.position, camera.position).normalize();
  const isBehind = meshDir.dot(dir) < 0;

  if (isBehind) {
    labelEl.style.display = 'none';
    return;
  }

  labelEl.style.display = 'block';
  
  // Calculate viewport pixel dimensions
  const x = (tempV.x * .5 + .5) * window.innerWidth;
  const y = (-(tempV.y * .5) + .5) * window.innerHeight;

  labelEl.style.left = `${x}px`;
  labelEl.style.top = `${y}px`;
}

// ----------------------------------------------------
// Animation Engine / RequestAnimationFrame loop
// ----------------------------------------------------
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Update OrbitControls
  controls.update();

  // Run updates on active updatables
  updatableObjects.forEach(obj => {
    if (obj.update) {
      obj.update(elapsedTime);
    }
  });

  // Project floating overview label coords
  updateOverlayHTML_Labels();

  // Render Postprocessing pass composer
  composer.render();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  init();
});
