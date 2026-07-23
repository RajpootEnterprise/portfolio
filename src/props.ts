import * as THREE from 'three';
import { state } from './state';
import { COLORS, HEIGHTS } from './constants';

export function createRoomProps() {
  // ----------------------------------------------------
  // Dynamic Premium Materials
  // ----------------------------------------------------
  const walnutMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.45, metalness: 0.1 });
  const metalSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.05 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.4, metalness: 0.8 });

  // Re-create a local marble texture for luxury tabletops
  const createMarbleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fafafb'; 
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.08)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = Math.random() * 256;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 256) {
        x += (Math.random() - 0.5) * 20;
        y += Math.random() * 30 + 10;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  };
  const marbleTex = createMarbleTexture();

  const addPropToScene = (mesh: THREE.Object3D, roomName: string) => {
    mesh.traverse((child: THREE.Object3D) => {
      child.userData = { roomName: roomName };
      if (child instanceof THREE.Mesh) {
        state.interactiveObjects.push(child);
      }
    });
    state.houseGroup.add(mesh);
  };

  // ----------------------------------------------------
  // GROUND LEFT: HOME (LIVING ROOM)
  // ----------------------------------------------------
  const sofaGroup = new THREE.Group();
  
  // Sofa Base Frame (Walnut)
  const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 0.92), walnutMat);
  baseFrame.position.y = 0.14;
  baseFrame.castShadow = true;
  sofaGroup.add(baseFrame);

  // Polished gold metal legs
  for (let x of [-0.95, 0.95]) {
    for (let z of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.12), goldMat);
      leg.position.set(x, 0.06, z);
      leg.castShadow = true;
      sofaGroup.add(leg);
    }
  }

  // Premium tufted leather seat body (rich tan leather)
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.38, metalness: 0.1 });
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 0.9), leatherMat);
  sofaBase.position.y = 0.265;
  sofaBase.castShadow = true;
  sofaBase.receiveShadow = true;
  sofaGroup.add(sofaBase);

  // Sofa Back with gold decorative lining at top
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.22), leatherMat);
  sofaBack.position.set(0, 0.59, -0.34);
  sofaBack.castShadow = true;
  sofaGroup.add(sofaBack);

  const trimBack = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.03, 0.24), goldMat);
  trimBack.position.set(0, 0.85, -0.34);
  sofaGroup.add(trimBack);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.9), leatherMat);
  armL.position.set(-1.0, 0.39, 0);
  armL.castShadow = true;
  sofaGroup.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.9), leatherMat);
  armR.position.set(1.0, 0.39, 0);
  armR.castShadow = true;
  sofaGroup.add(armR);
  
  // Pillows
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xfdf0d5, roughness: 0.8 });
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.15), pillowMat);
  pillow1.position.set(-0.7, 0.44, -0.15);
  pillow1.rotation.set(0.1, 0.2, -0.15);
  sofaGroup.add(pillow1);
  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.15), pillowMat);
  pillow2.position.set(0.7, 0.44, -0.15);
  pillow2.rotation.set(0.1, -0.2, 0.15);
  sofaGroup.add(pillow2);

  sofaGroup.position.set(-4.8, HEIGHTS.ground, 1.2);
  sofaGroup.rotation.y = Math.PI / 2;
  addPropToScene(sofaGroup, 'home');

  // White Carrara Marble & Gold pedestal Coffee Table
  const tableGroup = new THREE.Group();
  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.24, 16), goldMat);
  tableBase.position.y = 0.12;
  tableBase.castShadow = true;
  tableGroup.add(tableBase);

  const topMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 24), new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.15 }));
  topMesh.position.y = 0.255;
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  tableGroup.add(topMesh);
  
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 8), new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.4 }));
  mug.position.set(0.1, 0.3, 0.15);
  tableGroup.add(mug);

  const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.32), new THREE.MeshStandardMaterial({ color: 0xc32f27, roughness: 0.8 }));
  book1.position.set(-0.15, 0.28, -0.1);
  book1.rotation.y = 0.12;
  const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.26), new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.8 }));
  book2.position.set(-0.13, 0.315, -0.08);
  book2.rotation.y = -0.18;
  tableGroup.add(book1, book2);
  
  tableGroup.position.set(-3.2, HEIGHTS.ground, 1.2);
  addPropToScene(tableGroup, 'home');

  // Luxury Media Center (TV & Console)
  const mediaGroup = new THREE.Group();
  const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.38), walnutMat);
  consoleMesh.position.set(0, 0.175, 0);
  consoleMesh.castShadow = true;
  consoleMesh.receiveShadow = true;
  mediaGroup.add(consoleMesh);

  // Chrome TV console feet
  for (let x of [-0.7, 0.7]) {
    for (let z of [-0.14, 0.14]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04), chromeMat);
      foot.position.set(x, 0.02, z);
      mediaGroup.add(foot);
    }
  }

  // Television Stand & Panel
  const tvBase = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.016, 0.22), metalSteelMat);
  tvBase.position.set(0, 0.355, 0);
  mediaGroup.add(tvBase);
  const tvStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18), metalSteelMat);
  tvStem.position.set(0, 0.44, 0);
  mediaGroup.add(tvStem);
  
  // Thin border screen with glossy display
  const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.76, 0.03), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.15, metalness: 0.9 }));
  tvScreen.position.set(0, 0.9, 0);
  tvScreen.castShadow = true;
  mediaGroup.add(tvScreen);

  const tvDisplay = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.72, 0.01), new THREE.MeshBasicMaterial({ color: 0x0c0f12 }));
  tvDisplay.position.set(0, 0.9, 0.012);
  mediaGroup.add(tvDisplay);

  mediaGroup.position.set(-3.5, HEIGHTS.ground, -0.65);
  addPropToScene(mediaGroup, 'home');

  // Indoor Potted Fiddle Leaf Fig
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.34, 12), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 }));
  pot.position.y = 0.17;
  pot.castShadow = true;
  plant.add(pot);

  const stemMat = new THREE.MeshLambertMaterial({ color: 0x6e4e37 });
  const leavesMat = new THREE.MeshLambertMaterial({ color: 0x1b4332 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.75), stemMat);
  stem.position.y = 0.54;
  plant.add(stem);

  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), leavesMat);
    leaf.scale.set(1.4, 0.25, 0.95);
    const angle = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.16, 0.44 + i * 0.08, Math.sin(angle) * 0.16);
    leaf.rotation.set(0.4, angle, 0.15);
    leaf.castShadow = true;
    plant.add(leaf);
  }
  plant.position.set(-5.8, HEIGHTS.ground, 2.8);
  addPropToScene(plant, 'home');


  // ----------------------------------------------------
  // GROUND RIGHT: PATIO GARDEN
  // ----------------------------------------------------
  
  // Luxury Postbox on gold pedestal
  const mailGroup = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.96), goldMat);
  post.position.y = 0.48;
  post.castShadow = true;
  mailGroup.add(post);

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.36), new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.5, metalness: 0.2 }));
  box.position.y = 1.09;
  box.castShadow = true;
  mailGroup.add(box);

  const flagG = new THREE.Group();
  flagG.position.set(0.125, 1.09, 0.05);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.14, 0.025), new THREE.MeshBasicMaterial({ color: 0x999999 }));
  arm.position.y = 0.07;
  const flagPiece = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.09), new THREE.MeshBasicMaterial({ color: 0xe07a5f }));
  flagPiece.position.set(0, 0.11, -0.045);
  flagG.add(arm, flagPiece);
  flagG.rotation.z = -Math.PI / 2.5; 
  mailGroup.add(flagG);
  state.mailboxFlag = flagG;

  const letterGeo = new THREE.BoxGeometry(0.15, 0.015, 0.1);
  const letterMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  state.letterMesh = new THREE.Mesh(letterGeo, letterMat);
  state.letterMesh.position.set(0, 1.0, 0.18); 
  mailGroup.add(state.letterMesh);

  mailGroup.position.set(2.2, HEIGHTS.ground, 1.2);
  addPropToScene(mailGroup, 'contact');

  // Multi-colored garden flower block details
  const flowerColors = [0xe07a5f, 0xf4a261, 0xe9c46a, 0x2a9d8f, 0x8ab17d];
  for (let i = 0; i < 9; i++) {
    const flower = new THREE.Group();
    const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24 + Math.random() * 0.12), new THREE.MeshLambertMaterial({ color: 0x3a5a40 }));
    stemMesh.position.y = 0.12;
    flower.add(stemMesh);

    const petalMat = new THREE.MeshLambertMaterial({ color: flowerColors[i % flowerColors.length] });
    const petals = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), petalMat);
    petals.position.y = 0.24;
    flower.add(petals);

    flower.position.set(5.0 + Math.random() * 1.0, HEIGHTS.ground, -1.0 + i * 0.4);
    addPropToScene(flower, 'contact');
  }

  // Teak Patio Streetlamp Post
  const streetLamp = new THREE.Group();
  const basePole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.3), metalSteelMat);
  basePole.position.y = 1.15;
  basePole.castShadow = true;
  streetLamp.add(basePole);

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.035, 0.035), metalSteelMat);
  crossbar.position.set(0.18, 2.22, 0);
  streetLamp.add(crossbar);

  const headFixture = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.16, 6), metalSteelMat);
  headFixture.position.set(0.36, 2.14, 0);
  streetLamp.add(headFixture);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe699 }));
  bulb.position.set(0.36, 2.06, 0);
  streetLamp.add(bulb);
  state.bulbMeshes.push(bulb);

  streetLamp.position.set(5.5, HEIGHTS.ground, 2.8);
  addPropToScene(streetLamp, 'contact');

  // Upgraded Teak & White Fabric L-Shape Sectional Sofa (replacing simple bench)
  const bench = new THREE.Group();
  const teakMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.6 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.85 });

  const base1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.8), teakMat);
  base1.position.set(0, 0.04, 0);
  base1.castShadow = true;
  bench.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 1.2), teakMat);
  base2.position.set(0.4, 0.04, -0.6);
  base2.castShadow = true;
  bench.add(base2);

  const cushion1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.72), fabricMat);
  cushion1.position.set(-0.02, 0.15, 0.02);
  cushion1.castShadow = true;
  bench.add(cushion1);

  const cushion2 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 1.1), fabricMat);
  cushion2.position.set(0.42, 0.15, -0.58);
  cushion2.castShadow = true;
  bench.add(cushion2);

  const back1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.38, 0.08), teakMat);
  back1.position.set(0, 0.27, -0.36);
  back1.castShadow = true;
  bench.add(back1);

  const back2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 1.2), teakMat);
  back2.position.set(0.76, 0.27, -0.6);
  back2.castShadow = true;
  bench.add(back2);

  bench.position.set(4.2, HEIGHTS.ground, 2.2);
  state.houseGroup.add(bench);

  // Hanging Garden Fairy String Lights (Quadratic Catenary Curve)
  const pStart = new THREE.Vector3(5.5, HEIGHTS.ground + 2.3, 2.8); 
  const pEnd = new THREE.Vector3(6.5, HEIGHTS.ground + 0.4, 1.2);   
  const lightsCount = 8;
  for (let k = 0; k <= lightsCount; k++) {
    const t = k / lightsCount;
    const lx = pStart.x + (pEnd.x - pStart.x) * t;
    const lz = pStart.z + (pEnd.z - pStart.z) * t;
    const baseHeight = pStart.y + (pEnd.y - pStart.y) * t;
    const ly = baseHeight - 0.4 * Math.sin(t * Math.PI);

    const lightBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x666666 })
    );
    lightBulb.position.set(lx, ly, lz);
    state.houseGroup.add(lightBulb);
    state.fairyLights.push(lightBulb);
  }


  // ----------------------------------------------------
  // FIRST LEFT: ABOUT (STUDY OFFICE)
  // ----------------------------------------------------
  const deskGroup = new THREE.Group();
  
  // Executive walnut desk top
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.95), walnutMat);
  deskTop.position.y = 0.7;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  // Luxury Gold framing border
  const deskBorder = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.09, 0.99), goldMat);
  deskBorder.position.y = 0.695;
  deskGroup.add(deskBorder);

  // Gold legs
  for (let x of [-0.85, 0.85]) {
    for (let z of [-0.3, 0.3]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.022, 0.66), goldMat);
      leg.position.set(x, 0.33, z);
      leg.castShadow = true;
      deskGroup.add(leg);
    }
  }
  
  const organizer = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.34), new THREE.MeshStandardMaterial({ color: 0xebdcb9 }));
  organizer.position.set(0.7, 0.76, 0.15);
  deskGroup.add(organizer);

  // Keyboard
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.11), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 }));
  keyboard.position.set(0, 0.748, -0.06);
  deskGroup.add(keyboard);

  // Curved secondary monitor setup
  const officeMonitor = new THREE.Group();
  const monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), goldMat);
  monStand.position.y = 0.08;
  officeMonitor.add(monStand);
  const monBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 0.12), goldMat);
  monBase.position.y = 0.005;
  officeMonitor.add(monBase);
  const monBez = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.3, 0.015), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
  monBez.position.y = 0.23;
  officeMonitor.add(monBez);
  const monScreen = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.005), new THREE.MeshBasicMaterial({ color: COLORS.screenOff }));
  monScreen.position.set(0, 0.23, 0.008);
  officeMonitor.add(monScreen);
  state.screens.push(monScreen);

  officeMonitor.position.set(0.38, 0.74, -0.22);
  officeMonitor.rotation.y = -0.3;
  deskGroup.add(officeMonitor);

  const deskBook1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.038, 0.28), new THREE.MeshStandardMaterial({ color: 0xd9381e, roughness: 0.8 }));
  deskBook1.position.set(-0.7, 0.759, 0.2);
  deskBook1.rotation.y = 0.15;
  const deskBook2 = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.038, 0.24), new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.8 }));
  deskBook2.position.set(-0.68, 0.797, 0.22);
  deskBook2.rotation.y = -0.08;
  deskGroup.add(deskBook1, deskBook2);

  // Gold stem study lamp
  const deskLampGroup = new THREE.Group();
  const deskLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 8), goldMat);
  deskLampBase.position.y = 0.007;
  deskLampGroup.add(deskLampBase);
  const deskLampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34), goldMat);
  deskLampStem.position.set(0, 0.17, -0.04);
  deskLampStem.rotation.x = -0.22;
  deskLampGroup.add(deskLampStem);
  
  const deskLampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 0.1, 8), goldMat);
  deskLampShade.position.set(0, 0.33, -0.09);
  deskLampShade.rotation.x = 0.44;
  deskLampGroup.add(deskLampShade);

  deskLampGroup.position.set(-0.7, 0.74, -0.2);
  deskGroup.add(deskLampGroup);

  deskGroup.position.set(-3.5, HEIGHTS.first, -1.8);
  addPropToScene(deskGroup, 'about');

  // Ergonomic Gold & Black Leather office task chair
  const chair = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.48), seatMat);
  seat.position.y = 0.42;
  seat.castShadow = true;
  chair.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.38, 0.05), seatMat);
  back.position.set(0, 0.61, -0.2);
  back.castShadow = true;
  chair.add(back);

  // Gold structural armrests
  const armLGeo = new THREE.BoxGeometry(0.04, 0.18, 0.36);
  const armLeft = new THREE.Mesh(armLGeo, goldMat);
  armLeft.position.set(-0.25, 0.51, 0);
  const armRight = new THREE.Mesh(armLGeo, goldMat);
  armRight.position.set(0.25, 0.51, 0);
  chair.add(armLeft, armRight);

  const chairPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38), goldMat);
  chairPost.position.y = 0.19;
  chair.add(chairPost);

  // Swivel Star Leg Base
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const starLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.05), goldMat);
    starLeg.position.set(Math.cos(angle) * 0.13, 0.02, Math.sin(angle) * 0.13);
    starLeg.rotation.y = -angle;
    chair.add(starLeg);
  }

  chair.position.set(-3.5, HEIGHTS.first, -0.9);
  addPropToScene(chair, 'about');

  // Glowing Laptop
  const laptop = new THREE.Group();
  const lBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.24), new THREE.MeshStandardMaterial({ color: 0xc4c4c4, metalness: 0.8 }));
  lBase.position.y = 0.0075;
  laptop.add(lBase);
  state.laptopScreenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.015), new THREE.MeshBasicMaterial({ color: COLORS.screenOff }));
  state.laptopScreenMesh.position.set(0, 0.11, -0.11);
  state.laptopScreenMesh.rotation.x = -0.28;
  laptop.add(state.laptopScreenMesh);
  laptop.position.set(-3.55, HEIGHTS.first + 0.74, -1.8);
  addPropToScene(laptop, 'about');


  // ----------------------------------------------------
  // FIRST RIGHT: TIMELINE (LIBRARY ROOM)
  // ----------------------------------------------------
  
  // Upgraded Stone Slate Hearth Fireplace
  const fireplace = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }); 
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });

  const fSideL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.35), stoneMat);
  fSideL.position.set(-0.48, 1.4, 0);
  const fSideR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.35), stoneMat);
  fSideR.position.set(0.48, 1.4, 0);
  fireplace.add(fSideL, fSideR);

  const mantel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.42), stoneMat);
  mantel.position.set(0, 1.1, 0.04);
  const mantelBrass = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.02, 0.44), brassMat);
  mantelBrass.position.set(0, 1.17, 0.04);
  fireplace.add(mantel, mantelBrass);

  state.fireplaceLogMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
  state.fireplaceLogMesh.position.set(0, 0.05, 0.08);
  fireplace.add(state.fireplaceLogMesh);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.32), stoneMat);
  chimney.position.set(0, 2.2, 0.02);
  chimney.castShadow = true;
  fireplace.add(chimney);

  fireplace.position.set(5.5, HEIGHTS.first, 0.2);
  fireplace.rotation.y = -Math.PI / 2;
  addPropToScene(fireplace, 'timeline');

  // Deep Blue Velvet Armchair with gold metal legs
  const armchair = new THREE.Group();
  const velvetMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.92, metalness: 0.1 });
  
  const seatArm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.7), velvetMat);
  seatArm.position.y = 0.18;
  seatArm.castShadow = true;
  armchair.add(seatArm);
  
  const backArm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.2), velvetMat);
  backArm.position.set(0, 0.48, -0.28);
  backArm.castShadow = true;
  armchair.add(backArm);

  // Gold legs
  for (let x of [-0.28, 0.28]) {
    for (let z of [-0.28, 0.28]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.25), goldMat);
      leg.position.set(x, 0.06, z);
      leg.rotation.z = x > 0 ? -0.15 : 0.15;
      leg.castShadow = true;
      armchair.add(leg);
    }
  }

  armchair.position.set(3.5, HEIGHTS.first, -1.5);
  armchair.rotation.y = Math.PI / 6;
  addPropToScene(armchair, 'timeline');

  // Cozy Library Upgraded Wooden Bookcase - Scaled taller (2.7 units) for increased floor height
  const bookcase = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.7, 0.32), walnutMat);
  frame.position.y = 1.35;
  frame.castShadow = true;
  bookcase.add(frame);

  // Gold piping borders
  const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.7), goldMat);
  pipeL.position.set(-0.51, 1.35, 0.16);
  const pipeR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.7), goldMat);
  pipeR.position.set(0.51, 1.35, 0.16);
  bookcase.add(pipeL, pipeR);

  // Horizontal shelves (5 shelves)
  const shelfThickness = 0.035;
  const sHeights = [0.5, 1.0, 1.5, 2.0, 2.4];
  sHeights.forEach(shY => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.92, shelfThickness, 0.28), walnutMat);
    shelf.position.y = shY;
    bookcase.add(shelf);

    const booksCount = 6 + Math.floor(Math.random() * 3);
    const stepX = 0.76 / booksCount;
    for (let b = 0; b < booksCount; b++) {
      const bookH = 0.22 + Math.random() * 0.1;
      const bookW = 0.03 + Math.random() * 0.025;
      const bookD = 0.18 + Math.random() * 0.05;
      
      const bookColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const bookMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bookW, bookH, bookD),
        new THREE.MeshStandardMaterial({ color: bookColor, roughness: 0.8 })
      );
      
      const bx = -0.38 + b * stepX + (Math.random() - 0.5) * 0.02;
      const by = shY + shelfThickness / 2 + bookH / 2;
      const bz = (Math.random() - 0.5) * 0.02;
      bookMesh.position.set(bx, by, bz);
      
      // Random tilt for organic library feel
      if (Math.random() > 0.82 && b < booksCount - 1) {
        bookMesh.rotation.z = (Math.random() - 0.5) * 0.22;
        bookMesh.position.y -= 0.015;
      }
      bookMesh.castShadow = true;
      bookcase.add(bookMesh);
    }
  });

  bookcase.position.set(3.2, HEIGHTS.first, 1.6);
  addPropToScene(bookcase, 'timeline');


  // ----------------------------------------------------
  // SECOND LEFT: PROJECTS (TECH WORKSHOP)
  // ----------------------------------------------------
  const workbench = new THREE.Group();
  
  // Luxury Gold-framed projects metal desk
  const topBench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.95), metalSteelMat);
  topBench.position.y = 0.38;
  topBench.castShadow = true;
  workbench.add(topBench);

  const topBenchTrim = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.09, 0.99), goldMat);
  topBenchTrim.position.y = 0.375;
  workbench.add(topBenchTrim);

  for (let x of [-1.0, 1.0]) {
    for (let z of [-0.3, 0.3]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.08), goldMat);
      leg.position.set(x, 0, z);
      leg.castShadow = true;
      workbench.add(leg);
    }
  }

  // Dual Desktop rig console monitor displays
  for (let xOff of [-0.55, 0.55]) {
    const miniStand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), goldMat);
    miniStand.position.set(xOff, 0.46, -0.2);
    workbench.add(miniStand);

    const devScreen = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.44, 0.02), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    devScreen.position.set(xOff, 0.68, -0.2);
    devScreen.castShadow = true;
    workbench.add(devScreen);
  }

  workbench.position.set(-3.5, HEIGHTS.second + 0.38, -1.8);
  addPropToScene(workbench, 'projects');

  // Tall Glass & Metal Server Rack cabinet
  const serverRack = new THREE.Group();
  const metalFrame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.7, 0.7), metalSteelMat);
  metalFrame.position.y = 0.85;
  metalFrame.castShadow = true;
  serverRack.add(metalFrame);

  // Tinted luxury glass door
  const doorGeo = new THREE.BoxGeometry(0.66, 1.62, 0.02);
  const doorMat = new THREE.MeshPhysicalMaterial({ color: 0x222222, transparent: true, opacity: 0.4, transmission: 0.8, roughness: 0.1 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.85, 0.35);
  serverRack.add(door);

  // Server components with blinking indicator LEDs
  for (let u = 0; u < 9; u++) {
    const unit = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.64), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    unit.position.set(0, 0.12 + u * 0.17, 0);
    serverRack.add(unit);

    // Indicator LEDs (flashing BasicMaterials)
    for (let l = 0; l < 4; l++) {
      const ledColor = l === 3 ? 0xef4444 : 0x10b981; // Red/Green
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshBasicMaterial({ color: ledColor }));
      led.position.set(-0.25 + l * 0.14, 0.12 + u * 0.17, 0.325);
      serverRack.add(led);
      state.serverLights.push(led);
    }
  }

  serverRack.position.set(-5.4, HEIGHTS.second, 0.8);
  addPropToScene(serverRack, 'projects');

  // Wall-mounted floating project screens
  const xOffs = [-5.5, -3.5, -1.5];
  for (let i = 0; i < 3; i++) {
    const mon = new THREE.Group();
    const border = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 0.03), frameMat);
    mon.add(border);

    const disp = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.66, 0.01), new THREE.MeshBasicMaterial({ color: COLORS.screenOff }));
    disp.position.z = 0.012;
    mon.add(disp);
    state.screens.push(disp);

    mon.position.set(xOffs[i], HEIGHTS.second + 1.26, -3.42); 
    addPropToScene(mon, 'projects');
  }


  // ----------------------------------------------------
  // SECOND RIGHT: SKILLS (ARCADE ROOM)
  // ----------------------------------------------------
  
  // Cyberpunk Arcade Cabinet Cabinet
  const arcade = new THREE.Group();
  const cabColorMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.6 }); // Deep indigo body 
  
  // Cabinet Base structure
  const baseCab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.7), cabColorMat);
  baseCab.position.y = 0.5;
  baseCab.castShadow = true;
  arcade.add(baseCab);

  const monitorBezel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.66, 0.5), cabColorMat);
  monitorBezel.position.set(0, 1.25, -0.1);
  arcade.add(monitorBezel);

  // Slanted dashboard controls with gold joysticks
  const dash = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.08, 0.38), cabColorMat);
  dash.position.set(0, 1.0, 0.18);
  dash.rotation.x = 0.18;
  arcade.add(dash);

  const jStickL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08), metalSteelMat);
  jStickL.position.set(-0.2, 1.05, 0.22);
  jStickL.rotation.x = -0.18;
  const jStickLBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  jStickLBall.position.set(-0.2, 1.09, 0.22);
  
  const jStickR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08), metalSteelMat);
  jStickR.position.set(0.2, 1.05, 0.22);
  jStickR.rotation.x = -0.18;
  const jStickRBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  jStickRBall.position.set(0.2, 1.09, 0.22);
  arcade.add(jStickL, jStickLBall, jStickR, jStickRBall);

  // Screen display
  state.arcadeScreenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.02), new THREE.MeshBasicMaterial({ color: COLORS.screenOff }));
  state.arcadeScreenMesh.position.set(0, 1.25, 0.125);
  state.arcadeScreenMesh.rotation.x = -0.15;
  arcade.add(state.arcadeScreenMesh);

  // Marquee light banner
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.44), new THREE.MeshStandardMaterial({ color: 0xd946ef }));
  marquee.position.set(0, 1.62, 0.02);
  marquee.castShadow = true;
  arcade.add(marquee);

  arcade.position.set(4.8, HEIGHTS.second, -1.2);
  addPropToScene(arcade, 'skills');

  // Luxury Bar stool (Gold base & black leather seat cushion)
  const stool = new THREE.Group();
  const seatStool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }));
  seatStool.position.y = 0.58;
  seatStool.castShadow = true;
  stool.add(seatStool);

  const columnStool = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.54), goldMat);
  columnStool.position.y = 0.27;
  columnStool.castShadow = true;
  stool.add(columnStool);

  const baseStool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 12), goldMat);
  baseStool.position.y = 0.01;
  stool.add(baseStool);

  stool.position.set(3.8, HEIGHTS.second, -1.0);
  addPropToScene(stool, 'skills');

  // Glowing Skill Podium Stands (teak and gold bases)
  const addPodium = (x: number, z: number, shape: THREE.BufferGeometry, colorHex: number) => {
    const podiumGroup = new THREE.Group();
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.88, 12), teakMat);
    pedestal.position.y = 0.44;
    pedestal.castShadow = true;
    podiumGroup.add(pedestal);

    const pedestalGoldTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 12), goldMat);
    pedestalGoldTop.position.y = 0.89;
    podiumGroup.add(pedestalGoldTop);

    // Floating hologram shape
    const techShapeMat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
      ior: 1.4
    });
    const floatingShape = new THREE.Mesh(shape, techShapeMat);
    floatingShape.position.set(0, 1.15, 0);
    podiumGroup.add(floatingShape);
    state.floatingTechShapes.push(floatingShape);

    podiumGroup.position.set(x, HEIGHTS.second, z);
    addPropToScene(podiumGroup, 'skills');
  };

  addPodium(2.0, 1.8, new THREE.BoxGeometry(0.15, 0.15, 0.15), 0x06b6d4);       // Cyan cube (Frontend)
  addPodium(3.6, 1.8, new THREE.OctahedronGeometry(0.12), 0xef4444);          // Red octahedron (Backend)
  addPodium(5.2, 1.8, new THREE.TorusGeometry(0.08, 0.03, 8, 24), 0xeab308);  // Gold ring (DevOps)
}
