import * as THREE from 'three';
import { state } from './state';
import { COLORS, HEIGHTS, roomPositions } from './constants';

export function setupLights() {
  // Warm Ambient
  state.ambientLight = new THREE.AmbientLight(0xfff6eb, 1.2);
  state.scene.add(state.ambientLight);

  // Daylight Sun
  state.sunLight = new THREE.DirectionalLight(0xfff9e6, 1.4);
  state.sunLight.position.set(12, 18, 10);
  state.sunLight.castShadow = true;
  
  state.sunLight.shadow.mapSize.width = 2048;
  state.sunLight.shadow.mapSize.height = 2048;
  state.sunLight.shadow.camera.near = 0.5;
  state.sunLight.shadow.camera.far = 40;
  
  const d = 12;
  state.sunLight.shadow.camera.left = -d;
  state.sunLight.shadow.camera.right = d;
  state.sunLight.shadow.camera.top = d;
  state.sunLight.shadow.camera.bottom = -d;
  state.sunLight.shadow.bias = -0.0004;
  state.scene.add(state.sunLight);

  // Moonlight
  state.moonLight = new THREE.DirectionalLight(0x8a9ec4, 0.0);
  state.moonLight.position.set(-12, 18, 14);
  state.moonLight.castShadow = true;
  state.moonLight.shadow.mapSize.width = 1024;
  state.moonLight.shadow.mapSize.height = 1024;
  state.scene.add(state.moonLight);

  // Helper to add interior spots
  const addRoomSpot = (x: number, y: number, z: number) => {
    const spot = new THREE.PointLight(0xffecd2, 0.1, 7.5);
    spot.position.set(x, y - 0.15, z);
    spot.castShadow = true;
    spot.shadow.bias = -0.002;
    state.houseGroup.add(spot);
    state.roomLights.push(spot);

    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.1, 0.12, 8), fixtureMat);
    fixture.position.set(x, y + 0.06, z);
    fixture.castShadow = false;
    fixture.receiveShadow = false;
    state.houseGroup.add(fixture);

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), bulbMat);
    bulb.position.set(x, y, z);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    state.houseGroup.add(bulb);
    state.bulbMeshes.push(bulb);
  };

  addRoomSpot(-3.5, 2.1, 1.2);  // Home
  addRoomSpot(3.5, 2.1, 1.2);   // Contact
  addRoomSpot(-3.5, 4.3, -0.6); // About
  addRoomSpot(3.5, 4.3, -0.6);  // Timeline
  addRoomSpot(-3.5, 6.6, -0.6); // Projects
  addRoomSpot(3.5, 6.6, -0.6);  // Skills

  // Fireplace light
  state.fireplaceLight = new THREE.PointLight(COLORS.fireGlow, 0.0, 4.0);
  state.fireplaceLight.position.set(5.5, HEIGHTS.first + 0.15, 0.2);
  state.fireplaceLight.castShadow = true;
  state.houseGroup.add(state.fireplaceLight);

  // Street lamp light
  state.streetLampLight = new THREE.PointLight(COLORS.lampLight, 0.1, 6.0);
  state.streetLampLight.position.set(5.5, HEIGHTS.ground + 2.06, 2.48);
  state.streetLampLight.castShadow = true;
  state.houseGroup.add(state.streetLampLight);

  // Study desk lamp light
  state.deskLampLight = new THREE.PointLight(0xffecd2, 0.0, 3.0);
  state.deskLampLight.position.set(-4.2, HEIGHTS.first + 1.06, -2.23);
  state.deskLampLight.castShadow = true;
  state.houseGroup.add(state.deskLampLight);
}

export function createHelipad() {
  state.helipad = new THREE.Group();
  state.helipad.position.set(-3.75, HEIGHTS.second + 2.2, 0);

  const platformGeo = new THREE.CylinderGeometry(1.75, 1.75, 0.04, 32);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.receiveShadow = true;
  platform.castShadow = true;
  state.helipad.add(platform);

  const borderGeo = new THREE.TorusGeometry(1.70, 0.04, 8, 32);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = Math.PI / 2;
  border.position.y = 0.025;
  state.helipad.add(border);

  const hGroup = new THREE.Group();
  hGroup.position.y = 0.022;
  
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.9), lineMat);
  barL.position.x = -0.3;
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.9), lineMat);
  barR.position.x = 0.3;
  const barC = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.005, 0.16), lineMat);
  
  hGroup.add(barL, barR, barC);
  state.helipad.add(hGroup);

  const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04), strutMat);
      mount.position.set(i * 1.2, -0.04, j * 1.2);
      mount.castShadow = true;
      state.helipad.add(mount);
    }
  }

  state.houseGroup.add(state.helipad);
}

export function createHelicopter() {
  state.helicopter = new THREE.Group();
  state.helicopter.position.set(-3.75, HEIGHTS.second + 3.56, 0);

  const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
  bodyGeo.scale(1.4, 1.0, 1.0);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  state.helicopter.add(body);

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
  state.helicopter.add(canopy);

  const boomGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8);
  const boomMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5 });
  const boom = new THREE.Mesh(boomGeo, boomMat);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(-0.75, 0.05, 0);
  boom.castShadow = true;
  state.helicopter.add(boom);

  const finGeo = new THREE.BoxGeometry(0.06, 0.32, 0.12);
  const finMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
  const fin = new THREE.Mesh(finGeo, finMat);
  fin.position.set(-1.22, 0.18, 0);
  fin.castShadow = true;
  state.helicopter.add(fin);

  const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.set(0.0, 0.4, 0);
  shaft.castShadow = true;
  state.helicopter.add(shaft);

  state.mainRotor = new THREE.Group();
  state.mainRotor.position.set(0.0, 0.49, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.5 });
  const bladeL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.01, 0.08), bladeMat);
  bladeL.castShadow = true;
  const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 1.8), bladeMat);
  bladeR.castShadow = true;
  state.mainRotor.add(bladeL, bladeR);
  state.helicopter.add(state.mainRotor);

  state.tailRotor = new THREE.Group();
  state.tailRotor.position.set(-1.22, 0.18, 0.08);
  const tBladeGeo = new THREE.BoxGeometry(0.01, 0.34, 0.03);
  const tBladeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const tBlade1 = new THREE.Mesh(tBladeGeo, tBladeMat);
  const tBlade2 = new THREE.Mesh(tBladeGeo, tBladeMat);
  tBlade2.rotation.x = Math.PI / 2;
  state.tailRotor.add(tBlade1, tBlade2);
  state.helicopter.add(state.tailRotor);

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
  state.helicopter.add(skidL);

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
  state.helicopter.add(skidR);

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
  state.helicopter.add(thrusterL);

  const thrusterR = new THREE.Group();
  const nozzleR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8), nozzleMat);
  nozzleR.rotation.z = Math.PI / 2;
  const fireR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glowMat);
  fireR.scale.set(0.1, 1.8, 1.0);
  fireR.rotation.z = Math.PI / 2;
  fireR.position.x = -0.12;
  thrusterR.add(nozzleR, fireR);
  thrusterR.position.set(-0.35, -0.06, -0.28);
  state.helicopter.add(thrusterR);

  thrusterL.userData = { fire: fireL };
  thrusterR.userData = { fire: fireR };
  
  state.thrusterFireL = fireL;
  state.thrusterFireR = fireR;
  
  fireL.scale.set(0.001, 0.001, 0.001);
  fireR.scale.set(0.001, 0.001, 0.001);

  state.scene.add(state.helicopter);
}

export function createSpaceCity() {
  state.cityGroup = new THREE.Group();
  
  const baseGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.15, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
  const cityBase = new THREE.Mesh(baseGeo, baseMat);
  cityBase.position.set(8.0, 12.5, -24.0);
  cityBase.receiveShadow = true;
  cityBase.castShadow = true;
  state.cityGroup.add(cityBase);

  const ringGeo = new THREE.TorusGeometry(3.7, 0.04, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const glowRing = new THREE.Mesh(ringGeo, ringMat);
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.set(8.0, 12.58, -24.0);
  state.cityGroup.add(glowRing);

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
    const bW = i === 9 ? 0.95 : 0.75;
    const bGeo = new THREE.BoxGeometry(bW, spec.h, bW);
    const bMat = new THREE.MeshStandardMaterial({ color: spec.color, metalness: 0.85, roughness: 0.15 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(8.0 + spec.rx, 12.5 + spec.h / 2, -24.0 + spec.rz);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    state.cityGroup.add(bMesh);

    const stripeCount = Math.floor(spec.h / 0.55);
    for (let j = 1; j < stripeCount; j++) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(bW + 0.02, 0.04, bW + 0.02),
        new THREE.MeshBasicMaterial({ color: spec.lightColor })
      );
      band.position.set(
        8.0 + spec.rx,
        12.5 + j * 0.55,
        -24.0 + spec.rz
      );
      state.cityGroup.add(band);
    }

    const padRadius = i === 9 ? 0.32 : 0.25;
    const padGroup = new THREE.Group();
    padGroup.position.set(8.0 + spec.rx, 12.5 + spec.h + 0.005, -24.0 + spec.rz);

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

    state.cityGroup.add(padGroup);

    state.cityHelipads.push(new THREE.Vector3(
      8.0 + spec.rx,
      12.5 + spec.h + 0.02,
      -24.0 + spec.rz
    ));

    if (i % 2 === 1) {
      const antenna = new THREE.Group();
      antenna.position.set(8.0 + spec.rx - 0.22, 12.5 + spec.h, -24.0 + spec.rz - 0.22);
      
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.015, 0.4, 8),
        frameMat
      );
      mast.position.y = 0.2;
      antenna.add(mast);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      tip.position.y = 0.4;
      antenna.add(tip);

      state.cityGroup.add(antenna);
    }
  });

  state.cityGroup.scale.set(0.001, 0.001, 0.001);
  state.scene.add(state.cityGroup);
}

export function createRoomLabels() {
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
    if (ctx.roundRect) ctx.roundRect(0, 0, 256, 64, 16); else ctx.rect(0, 0, 256, 64);
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
        state.interactiveObjects.push(child);
      }
    });

    state.scene.add(labelGroup);
    state.floatingLabels.push(labelGroup as any);
  });
}

export function createCelestialEnvironment() {
  // 1. Sun Group
  state.sunGroup = new THREE.Group();
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd27d })
  );
  state.sunGroup.add(sunMesh);
  
  const sunHalo = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.4, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3cc, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  state.sunGroup.add(sunHalo);
  state.sunGroup.position.set(22, 18, -18);
  state.scene.add(state.sunGroup);

  // 2. Moon Group (With detailed craters canvas texture)
  const createMoonTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Moon base gray
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, 0, 256, 128);
    
    // Draw dark mare (volcanic basins)
    ctx.fillStyle = '#9ca3af';
    const maria = [
      { x: 60, y: 40, r: 24 },
      { x: 100, y: 70, r: 32 },
      { x: 160, y: 50, r: 18 },
      { x: 80, y: 90, r: 15 },
      { x: 200, y: 80, r: 20 }
    ];
    maria.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw crater overlays
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 20; i++) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 128;
      const cr = 2 + Math.random() * 8;
      
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  };

  state.moonGroup = new THREE.Group();
  const moonTexture = createMoonTexture();
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 32, 32),
    new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.95,
      metalness: 0.05,
      emissive: new THREE.Color(0x8a9ec4),
      emissiveIntensity: 0.15
    })
  );
  state.moonGroup.add(moonMesh);
  
  const moonHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.1, 16),
    new THREE.MeshBasicMaterial({ color: 0xa8dadc, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  );
  state.moonGroup.add(moonHalo);
  state.moonGroup.position.set(-20, -8, 20);
  state.scene.add(state.moonGroup);

  // 3. Multi-Planet Space System Container
  state.planetGroup = new THREE.Group();
  
  const addPlanet = (name: string, color: number, center: THREE.Vector3, radius: number, hasRings = false, ringColor = 0xffffff) => {
    const pGroup = new THREE.Group();
    pGroup.position.copy(center);
    
    const sphereMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: name === 'Neptune' ? 0.35 : 0.75,
      metalness: name === 'Neptune' ? 0.25 : 0.05
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 24), sphereMat);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    pGroup.add(sphere);

    if (hasRings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.25, radius * 1.85, 32),
        new THREE.MeshStandardMaterial({ color: ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      ring.rotation.x = Math.PI / 3.2;
      pGroup.add(ring);
    }

    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.5 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), padMat);
    pad.position.y = radius + 0.015;
    pad.castShadow = true;
    pGroup.add(pad);

    const border = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.008, 4, 16),
      new THREE.MeshBasicMaterial({ color: name === 'Venus' ? 0xeab308 : 0x06b6d4 })
    );
    border.rotation.x = Math.PI / 2;
    border.position.y = radius + 0.031;
    pGroup.add(border);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.001, 0.08), lineMat);
    hL.position.set(-0.04, radius + 0.032, 0);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.001, 0.08), lineMat);
    hR.position.set(0.04, radius + 0.032, 0);
    const hC = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.001, 0.015), lineMat);
    hC.position.set(0, radius + 0.032, 0);
    pGroup.add(hL, hR, hC);

    state.planetGroup.add(pGroup);
    state.planetList.push(pGroup);
  };

  addPlanet('Saturn', 0xe07a5f, new THREE.Vector3(-18, 15, -22), 1.8, true, 0xfdf0d5);
  addPlanet('Mars', 0xc32f27, new THREE.Vector3(-6, 17, -26), 1.5);
  addPlanet('Neptune', 0x1d3557, new THREE.Vector3(8, 16, -24), 1.6, true, 0x8ecae6);
  addPlanet('Venus', 0xeab308, new THREE.Vector3(18, 14, -18), 1.4);

  state.planetGroup.scale.set(0.001, 0.001, 0.001);
  state.scene.add(state.planetGroup);

  // 4. Starfield Particles
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
  state.starPoints = new THREE.Points(starGeo, starMat);
  state.scene.add(state.starPoints);

  // 5. Flapping Flying Birds Group
  state.birdsGroup = new THREE.Group();
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

    state.birdsGroup.add(bird);
    state.birdsList.push(bird);
  }
  state.scene.add(state.birdsGroup);

  // 6. Spaceships & UFOs Fleet in Outer Space
  const addUFO = (x: number, y: number, z: number, scale = 1.0) => {
    const ufo = new THREE.Group();
    ufo.position.set(x, y, z);
    ufo.scale.set(scale, scale, scale);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 0.15, 12), bodyMat);
    disk.scale.set(1, 1.4, 1);
    ufo.add(disk);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.8, 0.08, 12), bodyMat);
    rim.position.y = -0.06;
    ufo.add(rim);

    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
      transmission: 0.9,
      ior: 1.4,
      roughness: 0.1,
      metalness: 0.1
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.y = 0.07;
    ufo.add(dome);

    const glowLights: THREE.Mesh[] = [];
    const lightColor = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), lightColor.clone());
      bulb.position.set(Math.cos(angle) * 0.88, -0.02, Math.sin(angle) * 0.88);
      ufo.add(bulb);
      glowLights.push(bulb);
    }
    
    ufo.userData = {
      glowLights,
      pulseSpeed: 4.0 + Math.random() * 2.0,
      hoverOffset: Math.random() * 10,
      orbitCenter: new THREE.Vector3(x, y, z),
      orbitRadius: 2.5 + Math.random() * 3.0,
      orbitSpeed: 0.25 + Math.random() * 0.2
    };

    state.scene.add(ufo);
    state.ufoList.push(ufo);
  };

  const addSpaceship = (x: number, y: number, z: number, colorHex: number, scale = 1.0) => {
    const ship = new THREE.Group();
    ship.position.set(x, y, z);
    ship.scale.set(scale, scale, scale);

    const shipMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 8), shipMat);
    body.rotation.x = Math.PI / 2;
    ship.add(body);

    const wingGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0.0, 0.0, 0.2,     
      -0.6, -0.1, -0.4,  
      0.0, 0.0, -0.2,    
      
      0.0, 0.0, 0.2,     
      0.6, -0.1, -0.4,   
      0.0, 0.0, -0.2     
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    wingGeo.computeVertexNormals();
    const wing = new THREE.Mesh(wingGeo, shipMat);
    ship.add(wing);

    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.03, 0.22, 6), thrusterMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(0, 0, -0.6);
    ship.add(thruster);

    ship.userData = {
      orbitCenter: new THREE.Vector3(x, y, z),
      orbitRadius: 3.5 + Math.random() * 4.0,
      orbitSpeed: 0.15 + Math.random() * 0.15,
      orbitYScale: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2
    };

    state.scene.add(ship);
    state.spaceshipList.push(ship);
  };

  // Add 3 UFOs orbiting around Saturn, Mars, and Neptune
  addUFO(-18, 17, -22, 0.95);
  addUFO(-6, 19, -26, 0.8);
  addUFO(8, 18, -24, 0.85);

  // Add 3 Sleek Spaceships orbiting Venus and Saturn
  addSpaceship(18, 16, -18, 0xef4444, 0.8);   // Red Fighter
  addSpaceship(10, 15, -20, 0x3b82f6, 0.95);  // Blue Explorer
  addSpaceship(-14, 18, -20, 0x10b981, 0.75); // Green Scout

  // ----------------------------------------------------
  // Realistic Planet (R=160) & Environment Landscape
  // ----------------------------------------------------
  const createHomePlanetTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Sapphire ocean gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a192f');
    oceanGrad.addColorStop(0.5, '#0d2b45');
    oceanGrad.addColorStop(1, '#051124');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Draw teal shoreline bases
    ctx.fillStyle = '#22577a';
    for (let i = 0; i < 22; i++) {
      const cx = Math.random() * 1024;
      const cy = 60 + Math.random() * 392;
      const r = 60 + Math.random() * 120;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      
      // Layer realistic forest greens
      ctx.fillStyle = '#1b4332';
      ctx.beginPath();
      ctx.arc(cx + (Math.random()-0.5)*30, cy + (Math.random()-0.5)*30, r * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Layer light grass highlights
      ctx.fillStyle = '#40916c';
      ctx.beginPath();
      ctx.arc(cx + (Math.random()-0.5)*50, cy + (Math.random()-0.5)*50, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#22577a'; 
    }

    // Wispy atmospheric clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * 1024;
      const cy = 100 + Math.random() * 312;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 140 + Math.random() * 180, 24 + Math.random() * 35, Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  };

  const planetTexture = createHomePlanetTexture();
  const planetGeo = new THREE.SphereGeometry(160, 64, 64);
  const planetMat = new THREE.MeshStandardMaterial({
    map: planetTexture,
    roughness: 0.8,
    metalness: 0.05
  });
  const homePlanet = new THREE.Mesh(planetGeo, planetMat);
  homePlanet.position.set(0, -160.05, 0); // Nestles perfectly under house concrete base Y = -0.05
  homePlanet.receiveShadow = true;
  state.scene.add(homePlanet);

  // Shiny 3D Ocean sphere cover (slightly larger than planet for depth)
  const oceanGeo = new THREE.SphereGeometry(160.15, 64, 64);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x0a3c66,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.55
  });
  const homeOcean = new THREE.Mesh(oceanGeo, oceanMat);
  homeOcean.position.copy(homePlanet.position);
  state.scene.add(homeOcean);

  // 1. Flat grass plain plate
  const grassPlain = new THREE.Mesh(
    new THREE.CylinderGeometry(40, 40, 0.1, 48),
    new THREE.MeshStandardMaterial({ color: 0x2d4a22, roughness: 0.95 })
  );
  grassPlain.position.set(0, -0.1, 0); // Flat base Y = -0.05 surface
  grassPlain.receiveShadow = true;
  state.scene.add(grassPlain);

  // 2. Procedural pine forest trees around the house (InstancedMesh for high performance)
  const treeCount = 55;
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.2, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  trunkInst.castShadow = true;
  trunkInst.receiveShadow = true;

  const coneGeos = [
    new THREE.ConeGeometry(0.55, 1.0, 8),
    new THREE.ConeGeometry(0.43, 1.0, 8),
    new THREE.ConeGeometry(0.31, 1.0, 8)
  ];
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.9 });
  const coneInsts = coneGeos.map(geo => {
    const inst = new THREE.InstancedMesh(geo, leavesMat, treeCount);
    inst.castShadow = true;
    inst.receiveShadow = true;
    return inst;
  });

  const treeDummy = new THREE.Object3D();
  for (let i = 0; i < treeCount; i++) {
    let x = 0, z = 0;
    while (true) {
      x = (Math.random() - 0.5) * 64;
      z = (Math.random() - 0.5) * 64;
      const dist = Math.sqrt(x*x + z*z);
      if (dist > 10.0 && dist < 32.0) {
        if (Math.abs(x - (-20)) < 4.0 && Math.abs(z) < 8.0) continue; // runway path
        const rDist = Math.sqrt(x*x + Math.pow(z - (-5), 2));
        if (Math.abs(rDist - 22.0) < 2.0) continue; // track path
        break;
      }
    }
    
    // Position trunk (half-height offset = 0.6 since Cylinder origin is at center)
    treeDummy.position.set(x, 0.55, z);
    treeDummy.rotation.set(0, 0, 0);
    treeDummy.scale.set(1, 1, 1);
    treeDummy.updateMatrix();
    trunkInst.setMatrixAt(i, treeDummy.matrix);

    // Position leaf cones
    for (let j = 0; j < 3; j++) {
      treeDummy.position.set(x, 1.2 + j * 0.55, z);
      treeDummy.updateMatrix();
      coneInsts[j].setMatrixAt(i, treeDummy.matrix);
    }
  }

  state.scene.add(trunkInst);
  coneInsts.forEach(inst => state.scene.add(inst));

  // 3. Airport Terminal and Hangar Runway
  const runway = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.015, 14.0),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 })
  );
  runway.position.set(-20, -0.04, 0);
  runway.receiveShadow = true;
  runway.userData = { targetFocus: new THREE.Vector3(-20, -0.04, 0), focusName: 'airport' };
  state.interactiveObjects.push(runway);
  state.scene.add(runway);

  for (let offset = -6.0; offset <= 6.0; offset += 3.0) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.005, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    line.position.set(-20, -0.03, offset);
    state.scene.add(line);
  }

  // Runway Landing Lights (Green start, Red end)
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  for (let xOffset of [-1.1, 1.1]) {
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), greenLightMat);
    gl.position.set(-20 + xOffset, -0.02, 6.5);
    state.scene.add(gl);
  }
  const redLightMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });
  for (let xOffset of [-1.1, 1.1]) {
    const rl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), redLightMat);
    rl.position.set(-20 + xOffset, -0.02, -6.5);
    state.scene.add(rl);
  }

  const hangar = new THREE.Group();
  hangar.position.set(-24, -0.04, -3);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.6 })
  );
  dome.scale.set(1.0, 0.6, 1.3);
  hangar.add(dome);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 })
  );
  tower.position.set(-2.0, 1.1, 0);
  hangar.add(tower);

  const cab = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.24, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b6cb0, transparent: true, opacity: 0.5 })
  );
  cab.position.set(-2.0, 2.3, 0);
  hangar.add(cab);

  // Red beacon light on tower top
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  beacon.position.set(-2.0, 2.55, 0);
  hangar.add(beacon);

  state.scene.add(hangar);

  // Helper function to build detailed realistic planes
  function buildRealisticAirplane(wingColor: number): THREE.Group {
    const plane = new THREE.Group();
    
    // Fuselage
    const fuse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 1.3, 10),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3, metalness: 0.1 })
    );
    fuse.rotation.x = Math.PI / 2;
    plane.add(fuse);
    
    // Nose Cone
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db })
    );
    nose.position.set(0, 0, 0.65);
    nose.rotation.x = Math.PI / 2;
    plane.add(nose);
    
    // Cockpit window
    const cockpit = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.06, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x111827 })
    );
    cockpit.position.set(0, 0.07, 0.52);
    plane.add(cockpit);
    
    // Swept wings
    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.015, 0.22),
      new THREE.MeshStandardMaterial({ color: wingColor, roughness: 0.4 })
    );
    wingL.position.set(0.4, -0.02, 0.05);
    wingL.rotation.y = -Math.PI / 8;
    
    const wingR = wingL.clone();
    wingR.position.x = -0.4;
    wingR.rotation.y = Math.PI / 8;
    plane.add(wingL, wingR);
    
    // Jet Engines
    const engineGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.22, 8);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.7, roughness: 0.2 });
    const engL = new THREE.Mesh(engineGeo, engineMat);
    engL.rotation.x = Math.PI / 2;
    engL.position.set(0.3, -0.07, 0.05);
    const engR = engL.clone();
    engR.position.x = -0.3;
    plane.add(engL, engR);
    
    // Tail wing stabilizers
    const stabL = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.012, 0.1),
      new THREE.MeshStandardMaterial({ color: wingColor })
    );
    stabL.position.set(0.16, 0.02, -0.5);
    stabL.rotation.y = -Math.PI / 10;
    const stabR = stabL.clone();
    stabR.position.x = -0.16;
    stabR.rotation.y = Math.PI / 10;
    plane.add(stabL, stabR);
    
    // Vertical fin stabilizer
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.24, 0.14),
      new THREE.MeshStandardMaterial({ color: wingColor })
    );
    fin.position.set(0, 0.16, -0.52);
    plane.add(fin);
    
    // Landing Gear wheels
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const wheelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 6);
    const wFront = new THREE.Mesh(wheelGeo, wheelMat);
    wFront.rotation.z = Math.PI / 2;
    wFront.position.set(0, -0.15, 0.45);
    const wBackL = new THREE.Mesh(wheelGeo, wheelMat);
    wBackL.rotation.z = Math.PI / 2;
    wBackL.position.set(0.2, -0.15, -0.1);
    const wBackR = wBackL.clone();
    wBackR.position.x = -0.2;
    plane.add(wFront, wBackL, wBackR);
    
    return plane;
  }

  // Set planes
  state.planeMesh1 = buildRealisticAirplane(0xef4444);
  state.scene.add(state.planeMesh1);
  state.planeMesh2 = buildRealisticAirplane(0x3b82f6);
  state.scene.add(state.planeMesh2);

  // 4. Railway Tracks Circle and Stopping Train
  const railwayGroup = new THREE.Group();
  const trackRadius = 22.0;
  const trackCenterZ = -5.0;

  const tieMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const tiesCount = 120;
  const tieGeo = new THREE.BoxGeometry(0.5, 0.015, 0.12);
  const tieInst = new THREE.InstancedMesh(tieGeo, tieMat, tiesCount);
  const tieDummy = new THREE.Object3D();
  
  for (let i = 0; i < tiesCount; i++) {
    const angle = (i / tiesCount) * Math.PI * 2;
    const tx = Math.cos(angle) * trackRadius;
    const tz = Math.sin(angle) * trackRadius + trackCenterZ;
    
    tieDummy.position.set(tx, -0.045, tz);
    tieDummy.rotation.set(0, -angle, 0);
    tieDummy.scale.set(1, 1, 1);
    tieDummy.updateMatrix();
    tieInst.setMatrixAt(i, tieDummy.matrix);
  }
  railwayGroup.add(tieInst);

  const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
  const railL = new THREE.Mesh(new THREE.TorusGeometry(trackRadius - 0.15, 0.012, 6, 64), railMat);
  railL.rotation.x = Math.PI / 2;
  railL.position.set(0, -0.038, trackCenterZ);
  const railR = new THREE.Mesh(new THREE.TorusGeometry(trackRadius + 0.15, 0.012, 6, 64), railMat);
  railR.rotation.x = Math.PI / 2;
  railR.position.set(0, -0.038, trackCenterZ);
  railwayGroup.add(railL, railR);
  state.scene.add(railwayGroup);

  // Train Station Platform (With brick texture look, waiting bench, name sign, and waiting passengers!)
  const station = new THREE.Group();
  station.position.set(0, -0.04, -28.0);
  const platform = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.8), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 }));
  platform.position.y = 0.04;
  platform.userData = { targetFocus: new THREE.Vector3(0, -0.04, -28), focusName: 'railway' };
  state.interactiveObjects.push(platform);
  station.add(platform);

  const colGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.88);
  const colMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const col1 = new THREE.Mesh(colGeo, colMat); col1.position.set(-1.6, 0.48, -0.2);
  const col2 = new THREE.Mesh(colGeo, colMat); col2.position.set(1.6, 0.48, -0.2);
  station.add(col1, col2);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 0.9), new THREE.MeshStandardMaterial({ color: 0x2b3e50 }));
  canopy.position.set(0, 0.9, -0.1);
  station.add(canopy);

  // Platform Station Sign Board: "SS RAJPOOT STATION"
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  signPost.position.set(0, 0.6, 0.35);
  station.add(signPost);

  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 256;
  boardCanvas.height = 64;
  const bCtx = boardCanvas.getContext('2d')!;
  bCtx.fillStyle = '#18181b';
  bCtx.fillRect(0, 0, 256, 64);
  bCtx.strokeStyle = '#f43f5e';
  bCtx.lineWidth = 3;
  bCtx.strokeRect(2, 2, 252, 60);
  bCtx.fillStyle = '#ffffff';
  bCtx.font = 'bold 15px monospace';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText('SS RAJPOOT STATION', 128, 32);
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  const boardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.22, 0.02),
    new THREE.MeshBasicMaterial({ map: boardTex })
  );
  boardMesh.position.set(0, 0.85, 0.35);
  station.add(boardMesh);

  // Benches on Platform
  const bench = new THREE.Group();
  bench.position.set(-0.8, 0.08, 0);
  const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  benchSeat.position.y = 0.08;
  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.02), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  benchBack.position.set(0, 0.16, -0.1);
  bench.add(benchSeat, benchBack);
  station.add(bench);

  // Waiting passengers on benches
  for (let p = 0; p < 2; p++) {
    const pass = new THREE.Group();
    pass.position.set(-0.95 + p * 0.3, 0.17, 0);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08), new THREE.MeshStandardMaterial({ color: p === 0 ? 0xf59e0b : 0x06b6d4 }));
    torso.position.y = 0.04;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.025), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 0.1;
    pass.add(torso, head);
    station.add(pass);
  }

  state.scene.add(station);

  // Train Engine locomotive
  state.trainGroup = new THREE.Group();
  const engineBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.64), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.3 }));
  engineBody.position.y = 0.18;
  state.trainGroup.add(engineBody);
  const trainCabin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.26), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
  trainCabin.position.set(0, 0.23, -0.16);
  state.trainGroup.add(trainCabin);
  const smokeFunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  smokeFunnel.position.set(0, 0.36, 0.18);
  state.trainGroup.add(smokeFunnel);
  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe699 }));
  headlight.position.set(0, 0.18, 0.325);
  state.trainGroup.add(headlight);
  state.scene.add(state.trainGroup);

  // 2 Train Carriages (Hollow body, transparent glass cover, and sitting passengers!)
  const cColors = [0x1e3a8a, 0x0f766e];
  for (let c = 0; c < 2; c++) {
    const carriage = new THREE.Group();
    const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.52), new THREE.MeshStandardMaterial({ color: cColors[c], roughness: 0.4 }));
    cBody.position.y = 0.17;
    carriage.add(cBody);

    const cabinCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.18, 0.48),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.1 })
    );
    cabinCover.position.set(0, 0.28, 0);
    carriage.add(cabinCover);

    // Place 3 sitting passengers inside the carriage!
    const seatZ = [-0.16, 0, 0.16];
    for (let s = 0; s < 3; s++) {
      const passenger = new THREE.Group();
      passenger.position.set((Math.random() - 0.5) * 0.08, 0.18, seatZ[s]);

      const pTorso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.08),
        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
      );
      pTorso.position.y = 0.04;
      passenger.add(pTorso);

      const pHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.025),
        new THREE.MeshStandardMaterial({ color: 0xffdbac })
      );
      pHead.position.y = 0.1;
      passenger.add(pHead);

      carriage.add(passenger);
    }

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (let wx of [-0.09, 0.09]) {
      for (let wz of [-0.18, 0.18]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 8), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.05, wz);
        carriage.add(wheel);
      }
    }
    state.scene.add(carriage);
    state.trainCarriages.push(carriage);
  }
}
