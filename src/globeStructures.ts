import * as THREE from 'three';
import { projectObjectToGlobe } from './environment';
import { state } from './state';

export function createGlobeStructures() {
  const structuresGroup = new THREE.Group();

  // 1. Secondary House: Modern A-Frame Cabin
  const cabin = new THREE.Group();
  
  // Wooden deck base
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.15, 4.0),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 })
  );
  deck.position.y = 0.075;
  cabin.add(deck);

  // A-Frame structural walls
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.4 });

  const aFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 3.6), roofMat);
  aFrameL.position.set(-1.0, 1.4, 0);
  aFrameL.rotation.z = Math.PI / 6;
  const aFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 3.6), roofMat);
  aFrameR.position.set(1.0, 1.4, 0);
  aFrameR.rotation.z = -Math.PI / 6;
  cabin.add(aFrameL, aFrameR);

  // Glass front and back triangles
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xddf2f8,
    transparent: true,
    opacity: 0.4,
    transmission: 0.6,
    roughness: 0.1,
    metalness: 0.1
  });
  const frontGlass = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.7, 4), glassMat);
  frontGlass.rotation.y = Math.PI / 4;
  frontGlass.position.set(0, 1.35, 1.7);
  cabin.add(frontGlass);

  // Place cabin on the globe (coordinate: x = 18, z = -18)
  projectObjectToGlobe(cabin, 18.0, -0.04, -18.0, -Math.PI / 4);
  structuresGroup.add(cabin);

  // 2. Third House: Futuristic Dome Observatory
  const observatory = new THREE.Group();

  // Concrete foundation ring
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.2, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 })
  );
  ring.position.y = 0.15;
  observatory.add(ring);

  // Metallic dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd5dbdb, metalness: 0.8, roughness: 0.2 })
  );
  dome.position.y = 0.3;
  observatory.add(dome);

  // Glowing dome slit (neon core)
  const slit = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1.8, 0.4),
    new THREE.MeshBasicMaterial({ color: 0x3498db })
  );
  slit.position.set(0, 0.9, 1.45);
  slit.rotation.x = -Math.PI / 10;
  observatory.add(slit);

  // Place observatory on the globe (coordinate: x = -15, z = 18)
  projectObjectToGlobe(observatory, -15.0, -0.04, 18.0, Math.PI / 3);
  structuresGroup.add(observatory);

  // 3. Spinning Windmill (Wind Turbine)
  const windmill = new THREE.Group();

  // Tapered tower post
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.28, 4.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.6 })
  );
  tower.position.y = 2.25;
  windmill.add(tower);

  // Nacelle (generator cabin at top)
  const nacelle = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.4 })
  );
  nacelle.position.set(0, 4.5, 0.15);
  windmill.add(nacelle);

  // Spinning blades rotor assembly
  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0, 4.5, 0.5);

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
  );
  bladeGroup.add(hub);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.02), bladeMat);
    blade.position.set(Math.sin(angle) * 0.9, Math.cos(angle) * 0.9, 0);
    blade.rotation.z = -angle;
    bladeGroup.add(blade);
  }
  
  windmill.add(bladeGroup);
  // Store reference to bladeGroup in state for rotation animation in render loop
  state.windmillBlades = bladeGroup;

  // Place windmill on the globe (coordinate: x = 25, z = 10)
  projectObjectToGlobe(windmill, 25.0, -0.04, 10.0);
  structuresGroup.add(windmill);

  state.scene.add(structuresGroup);
}
