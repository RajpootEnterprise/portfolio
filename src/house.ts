import * as THREE from 'three';
import { state } from './state';
import { COLORS, HEIGHTS } from './constants';

export function createHouseStructure() {
  const slabH = 0.12;
  const floorH = 3.2; // Taller luxury floor height (increased from 2.2)
  const wallH = floorH - 0.12; // Wall height fits between floor slabs (3.08 units)
  
  const slabMat = new THREE.MeshStandardMaterial({ color: COLORS.houseBase, roughness: 0.85 });

  // ----------------------------------------------------
  // Dynamic Premium Procedural Textures
  // ----------------------------------------------------
  
  // 1. Carrara White Marble with soft grey & gold veins (Lobby)
  const createMarbleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fafafb'; 
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.08)';
    ctx.lineWidth = 2.0;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 512) {
        x += (Math.random() - 0.5) * 45;
        y += Math.random() * 60 + 15;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Gold accents
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.06)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 512) {
        x += (Math.random() - 0.5) * 60;
        y += Math.random() * 80 + 20;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.8, 1.8);
    return tex;
  };

  // 2. Dark Herringbone Walnut Wood Floor (Study)
  const createHerringboneTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#3e2a1b'; 
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.strokeStyle = '#2b1c11';
    ctx.lineWidth = 2.5;
    const w = 32; 
    const h = 128; 
    for (let y = -256; y < 768; y += h) {
      for (let x = -256; x < 768; x += w) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + w);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w, y + w);
        ctx.lineTo(x, y + 2 * w);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  };

  // 3. Basalt Epoxy Tiles with Gold grout joints (Tech Lab)
  const createBasaltGoldTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#26282e'; 
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.strokeStyle = '#cfa758'; // Gold joint lines
    ctx.lineWidth = 2.0;
    const size = 128;
    for (let i = 0; i <= 512; i += size) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  };

  const marbleTex = createMarbleTexture();
  const herringboneTex = createHerringboneTexture();
  const basaltGoldTex = createBasaltGoldTexture();

  // 1. Concrete ground base
  const groundBase = new THREE.Mesh(new THREE.BoxGeometry(14.6, slabH, 7.6), slabMat);
  groundBase.position.set(0, -slabH / 2 - 0.01, 0); // Lowered to prevent floor slab Z-fighting
  groundBase.receiveShadow = true;
  state.houseGroup.add(groundBase);

  // Helper to add Floor Slabs per quadrant
  const addFloorSlab = (w: number, d: number, px: number, py: number, pz: number, material: THREE.Material, roomName: string) => {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, slabH, d), material);
    floor.position.set(px, py - slabH / 2, pz);
    floor.receiveShadow = true;
    floor.userData = { roomName: roomName };
    state.houseGroup.add(floor);
    state.interactiveObjects.push(floor);
  };

  // Ground Floor Rooms (Home & Patio)
  const lobbyFloorMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.15, metalness: 0.1 });
  const patioGrassMat = new THREE.MeshStandardMaterial({ color: COLORS.floorLightRight, roughness: 0.8 });
  addFloorSlab(6.0, 7.0, -3.75, HEIGHTS.ground, 0, lobbyFloorMat, 'home');
  addFloorSlab(6.0, 7.0, 3.75, HEIGHTS.ground, 0, patioGrassMat, 'contact');

  // Decorative deck walkway path (Teak wood)
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.02, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x9a7b56, roughness: 0.5 })
    );
    plank.position.set(1.2 + i * 0.44, HEIGHTS.ground + 0.015, 1.0);
    plank.receiveShadow = true;
    plank.userData = { roomName: 'contact' };
    state.houseGroup.add(plank);
    state.interactiveObjects.push(plank);
  }

  // First Floor Rooms
  const studyWoodMat = new THREE.MeshStandardMaterial({ map: herringboneTex, roughness: 0.35 });
  const timelineLibraryMat = new THREE.MeshStandardMaterial({ color: COLORS.floorTimeline, roughness: 0.8 });
  addFloorSlab(6.0, 7.0, -3.75, HEIGHTS.first, 0, studyWoodMat, 'about');
  addFloorSlab(6.0, 7.0, 3.75, HEIGHTS.first, 0, timelineLibraryMat, 'timeline');

  // Second Floor Rooms
  const projectsLabMat = new THREE.MeshStandardMaterial({ map: basaltGoldTex, roughness: 0.25 });
  const skillsArcadeMat = new THREE.MeshStandardMaterial({ color: COLORS.floorArcade, roughness: 0.7 });
  addFloorSlab(6.0, 7.0, -3.75, HEIGHTS.second, 0, projectsLabMat, 'projects');
  addFloorSlab(6.0, 7.0, 3.75, HEIGHTS.second, 0, skillsArcadeMat, 'skills');

  // Decorative Baseboards Molding
  const addBaseboard = (w: number, px: number, py: number, pz: number, ry = 0, roomName: string) => {
    const baseboard = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.08, 0.02),
      new THREE.MeshStandardMaterial({ color: COLORS.wallTrim, roughness: 0.6 })
    );
    baseboard.position.set(px, py + 0.04, pz);
    baseboard.rotation.y = ry;
    baseboard.userData = { roomName: roomName };
    state.houseGroup.add(baseboard);
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
  const elevatorTravelHeight = HEIGHTS.second + 2.0; 
  const railGeo = new THREE.CylinderGeometry(0.04, 0.04, elevatorTravelHeight, 8);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
  
  const railPositions = [
    [-0.65, 0.65],
    [-0.65, -0.65],
    [0.65, 0.65],
    [0.65, -0.65]
  ];

  railPositions.forEach(pos => {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(pos[0], elevatorTravelHeight / 2, pos[1]);
    rail.castShadow = true;
    state.houseGroup.add(rail);
  });

  // 3. Central Elevator Platform
  state.elevator = new THREE.Group();
  const platformBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 }));
  platformBase.position.y = 0.04;
  platformBase.castShadow = true;
  platformBase.receiveShadow = true;
  state.elevator.add(platformBase);

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
    state.elevator.add(railGroup);
  };

  addGlassRail(1.18, 0.8, 0.04, 0, 0.08, -0.58);
  addGlassRail(1.18, 0.8, 0.04, -0.58, 0.08, 0, Math.PI / 2);
  addGlassRail(1.18, 0.8, 0.04, 0.58, 0.08, 0, Math.PI / 2);

  state.elevator.position.set(0, 0.01, 0);
  state.houseGroup.add(state.elevator);

  // 4. Solid Room Walls, Columns & Panoramic Glass Facades
  const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wallPlaster, roughness: 0.95 });
  const columnMat = new THREE.MeshStandardMaterial({ color: 0x2b251f, roughness: 0.45, metalness: 0.2 }); 
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.4, metalness: 0.8 }); 

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

  // Corner Concrete Pillars
  const addPillar = (x: number, z: number) => {
    const pillarHeight = HEIGHTS.second + floorH; 
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, pillarHeight, 0.24),
      columnMat
    );
    pillar.position.set(x, pillarHeight / 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    state.houseGroup.add(pillar);
  };

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
    state.houseGroup.add(wall);
  };

  // BACK WALLS (Z = -3.5)
  addSolidWall(5.76, wallH, 0.09, -3.75, HEIGHTS.ground, -3.42); 
  addSolidWall(5.76, wallH, 0.09, -3.75, HEIGHTS.first, -3.42);  
  addSolidWall(5.76, wallH, 0.09, 3.75, HEIGHTS.first, -3.42);   
  addSolidWall(5.76, wallH, 0.09, -3.75, HEIGHTS.second, -3.42); 
  addSolidWall(5.76, wallH, 0.09, 3.75, HEIGHTS.second, -3.42);  

  // SIDE WALLS (X = -6.75 / 6.75)
  addSolidWall(0.09, wallH, 6.70, -6.68, HEIGHTS.ground, 0); 
  addSolidWall(0.09, wallH, 6.70, -6.68, HEIGHTS.first, 0);  
  addSolidWall(0.09, wallH, 6.70, 6.68, HEIGHTS.first, 0);   
  addSolidWall(0.09, wallH, 6.70, -6.68, HEIGHTS.second, 0); 
  addSolidWall(0.09, wallH, 6.70, 6.68, HEIGHTS.second, 0);  

  // INTERIOR PARTITION WALLS
  const addInteriorWall = (y: number) => {
    addSolidWall(0.09, wallH, 2.38, -0.67, y, 2.3);
    addSolidWall(0.09, wallH, 2.38, -0.67, y, -2.3);
    addSolidWall(0.09, wallH, 2.38, 0.67, y, 2.3);
    addSolidWall(0.09, wallH, 2.38, 0.67, y, -2.3);
  };
  addInteriorWall(HEIGHTS.ground);
  addInteriorWall(HEIGHTS.first);
  addInteriorWall(HEIGHTS.second);

  // Helper to build Panoramic Glass Facades
  const addGlassFacade = (xCenter: number, yBottom: number, zCenter: number, w: number, h: number, ry = 0) => {
    const facade = new THREE.Group();
    facade.position.set(xCenter, yBottom + h / 2, zCenter);
    facade.rotation.y = ry;

    const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), glassMat);
    facade.add(glass);

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

    const mullion1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - 0.1, 0.06), frameMat);
    mullion1.position.x = -w / 6;
    const mullion2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - 0.1, 0.06), frameMat);
    mullion2.position.x = w / 6;
    facade.add(mullion1, mullion2);

    state.houseGroup.add(facade);
  };

  // FRONT GLASS FACADES
  addGlassFacade(-3.75, HEIGHTS.ground, 3.44, 5.76, wallH); 
  addGlassFacade(-3.75, HEIGHTS.first, 3.44, 5.76, wallH);  
  addGlassFacade(3.75, HEIGHTS.first, 3.44, 5.76, wallH);   
  addGlassFacade(-3.75, HEIGHTS.second, 3.44, 5.76, wallH); 
  addGlassFacade(3.75, HEIGHTS.second, 3.44, 5.76, wallH);  

  // 5. Solid Roof Structure & Flat Terrace
  const roofY = HEIGHTS.second + floorH; 
  
  // FLAT CONCRETE ROOFTOP TERRACE DECK
  const roofSlab = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 0.12, 7.0),
    new THREE.MeshStandardMaterial({ color: COLORS.houseBase, roughness: 0.85 })
  );
  roofSlab.position.set(-3.75, roofY - 0.06, 0);
  roofSlab.receiveShadow = true;
  roofSlab.castShadow = true;
  state.houseGroup.add(roofSlab);

  // GLASS SAFETY RAILINGS
  const addRailing = (w: number, x: number, z: number, ry = 0) => {
    const railGroup = new THREE.Group();
    railGroup.position.set(x, roofY, z);
    railGroup.rotation.y = ry;

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.85, 0.02),
      new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.2, transmission: 0.9 })
    );
    glass.position.y = 0.425;
    railGroup.add(glass);

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

    state.houseGroup.add(railGroup);
  };

  addRailing(5.76, -3.75, 3.44, 0);            
  addRailing(6.76, -6.69, 0, Math.PI / 2);      
  addRailing(5.76, -3.75, -3.44, 0);           

  // ELEVATOR PENTHOUSE CORE
  const penthouse = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, wallH, 1.5),
    new THREE.MeshStandardMaterial({ color: COLORS.houseBase, roughness: 0.8 })
  );
  penthouse.position.set(0, roofY + wallH / 2 - 0.12, 0);
  penthouse.castShadow = true;
  penthouse.receiveShadow = true;
  state.houseGroup.add(penthouse);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.08, 1.56), frameMat);
  trim.position.set(0, roofY + wallH - 0.12, 0);
  state.houseGroup.add(trim);

  // Flagpole and Banner flag "Rajpoot Enterprises"
  const flagpoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8);
  const flagpoleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
  const flagpole = new THREE.Mesh(flagpoleGeo, flagpoleMat);
  flagpole.position.set(0, roofY + wallH + 0.9, 0);
  flagpole.castShadow = true;
  state.houseGroup.add(flagpole);

  // Create Canvas Flag Texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 500, 244);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Rajpoot Enterprises', 256, 128);

  const flagTexture = new THREE.CanvasTexture(canvas);
  const flagGeo = new THREE.BoxGeometry(1.2, 0.6, 0.02);
  const flagMat = new THREE.MeshStandardMaterial({
    map: flagTexture,
    roughness: 0.6,
    metalness: 0.1
  });
  state.flagMesh = new THREE.Mesh(flagGeo, flagMat);
  state.flagMesh.position.set(0.6, roofY + wallH + 1.4, 0);
  state.flagMesh.castShadow = true;
  state.houseGroup.add(state.flagMesh);

  // ASYMMETRICAL PITCHED SLATED ROOF
  const roofSlope = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.08, 7.05),
    new THREE.MeshStandardMaterial({ color: 0x222533, roughness: 0.7 }) 
  );
  roofSlope.position.set(3.75, roofY + 0.465, 0);
  roofSlope.rotation.z = -0.173;
  roofSlope.castShadow = true;
  roofSlope.receiveShadow = true;
  state.houseGroup.add(roofSlope);

  // 6. Rooftop Luxury Decoration
  const woodFurnitureMat = new THREE.MeshStandardMaterial({ color: COLORS.woodFurniture, roughness: 0.75 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });

  // A. Sun Lounger Chairs
  const addSunLounger = (x: number, z: number, ry: number) => {
    const lounger = new THREE.Group();
    lounger.position.set(x, roofY, z);
    lounger.rotation.y = ry;

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 1.4), woodFurnitureMat);
    base.position.y = 0.04;
    base.castShadow = true;
    lounger.add(base);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), woodFurnitureMat);
    back.position.set(0, 0.22, -0.4);
    back.rotation.x = -0.4;
    back.castShadow = true;
    lounger.add(back);

    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.8), cushionMat);
    cushion.position.set(0, 0.1, 0.2);
    const cushionBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.55), cushionMat);
    cushionBack.position.set(0, 0.23, -0.38);
    cushionBack.rotation.x = -0.4;
    lounger.add(cushion, cushionBack);

    state.houseGroup.add(lounger);
  };
  addSunLounger(-2.0, 2.0, Math.PI / 6);
  addSunLounger(-2.0, 0.8, Math.PI / 5);

  // B. Large Leafy Planter Pots
  const addPlanterPot = (x: number, z: number) => {
    const planter = new THREE.Group();
    planter.position.set(x, roofY, z);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.16, 0.44, 12),
      new THREE.MeshStandardMaterial({ color: 0x4f5d75, roughness: 0.6 })
    );
    pot.position.y = 0.22;
    pot.castShadow = true;
    planter.add(pot);

    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x2d6a4f });
    for (let i = 0; i < 3; i++) {
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), leafMaterial);
      leaves.position.set(Math.sin(i * 2) * 0.1, 0.44 + i * 0.12, Math.cos(i * 2) * 0.1);
      leaves.scale.set(1.1, 0.85, 1.1);
      leaves.castShadow = true;
      planter.add(leaves);
    }

    state.houseGroup.add(planter);
  };
  addPlanterPot(-5.8, -2.6);
  addPlanterPot(-5.8, 2.6);

  // C. Modern Solar Panels
  const addSolarPanel = (x: number, z: number) => {
    const panelGroup = new THREE.Group();
    const deltaX = x - 3.75;
    const roofSlantedY = (roofY + 0.465) - deltaX * Math.tan(-0.173);
    
    panelGroup.position.set(x, roofSlantedY + 0.18, z);
    panelGroup.rotation.z = -0.173; 

    const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.04, 0.04), railMat);
    railL.position.set(0, -0.04, -0.5);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.04, 0.04), railMat);
    railR.position.set(0, -0.04, 0.5);
    panelGroup.add(railL, railR);

    const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18);
    const legFL = new THREE.Mesh(legGeo, railMat);
    legFL.position.set(-0.45, -0.13, -0.5);
    const legFR = new THREE.Mesh(legGeo, railMat);
    legFR.position.set(0.45, -0.13, -0.5);
    const legBL = new THREE.Mesh(legGeo, railMat);
    legBL.position.set(-0.45, -0.13, 0.5);
    const legBR = new THREE.Mesh(legGeo, railMat);
    legBR.position.set(0.45, -0.13, 0.5);
    panelGroup.add(legFL, legFR, legBL, legBR);

    const siliconMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, 
      metalness: 0.25,
      roughness: 0.65 
    });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.6), railMat);
    frame.position.y = 0.02;
    frame.castShadow = true;
    
    const silicon = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.01, 1.52), siliconMat);
    silicon.position.set(0, 0.04, 0);
    panelGroup.add(frame, silicon);

    const gridMat = new THREE.MeshStandardMaterial({ color: 0x090b11, metalness: 0.1, roughness: 0.8 });
    const gridV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 1.52), gridMat);
    gridV.position.set(0, 0.045, 0);
    panelGroup.add(gridV);

    for (let offset of [-0.48, -0.16, 0.16, 0.48]) {
      const gridH = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.012, 0.015), gridMat);
      gridH.position.set(0, 0.045, offset);
      panelGroup.add(gridH);
    }

    state.houseGroup.add(panelGroup);
  };
  
  addSolarPanel(3.0, -1.8);
  addSolarPanel(3.0, 1.8);

  // 7. Hanging Light Fixtures
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
    state.bulbMeshes.push(glowBulb);

    lamp.position.set(x, y, z);
    state.houseGroup.add(lamp);
  };

  addHangingLamp(-3.5, roofY, -0.6, 0.85); 
  addHangingLamp(3.5, roofY, -0.6, 0.85);  
}
