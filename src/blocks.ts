import * as THREE from 'three';
import gsap from 'gsap';

// Global Palette Colors
export const PALETTE = {
  deepSlate: 0x1A1D21,
  deepGray: 0x2C3035,
  cyan: 0x00FFFF,
  magenta: 0xFF00FF,
  darkSlateStr: '#1A1D21',
  deepGrayStr: '#2C3035',
  cyanStr: '#00FFFF',
  magentaStr: '#FF00FF',
};

// ----------------------------------------------------
// Skeletal Beam
// ----------------------------------------------------
export class SkeletalBeam extends THREE.Group {
  public length: number;
  public height: number;
  public width: number;
  public progress: number = 0; // 0 = Folded (flat line), 1 = Unfolded (3D truss)

  private mainLine: THREE.LineSegments;
  private trussLines: THREE.LineSegments;
  private cyanColor: number;

  constructor(length: number = 5, width: number = 0.5, height: number = 0.5, isMagenta: boolean = false) {
    super();
    this.length = length;
    this.width = width;
    this.height = height;
    this.cyanColor = isMagenta ? PALETTE.magenta : PALETTE.cyan;

    // Create the geometry for a 3D truss structure
    // We will have vertical lines, horizontal lines, and diagonal braces
    const vertices: number[] = [];
    const trussVertices: number[] = [];

    // Main bottom rail (folded baseline)
    vertices.push(
      -length / 2, 0, 0,
      length / 2, 0, 0
    );

    // 3D structural outline vertices (to be expanded dynamically)
    // Left, right, top, bottom edges
    // We will build a truss structure with N subdivisions along length
    const subdivisions = Math.max(1, Math.round(length / 1.5));
    const step = length / subdivisions;

    for (let i = 0; i <= subdivisions; i++) {
      const x = -length / 2 + i * step;

      // Vertical segments at each subdivision
      trussVertices.push(
        x, -height / 2, -width / 2,   x, height / 2, -width / 2,
        x, -height / 2, width / 2,    x, height / 2, width / 2,
        x, -height / 2, -width / 2,   x, -height / 2, width / 2,
        x, height / 2, -width / 2,    x, height / 2, width / 2
      );

      // Longitudinal lines (excluding first, connected to next)
      if (i < subdivisions) {
        const nextX = x + step;
        // Top-left, top-right, bottom-left, bottom-right rails
        trussVertices.push(
          x, height / 2, -width / 2,   nextX, height / 2, -width / 2,
          x, height / 2, width / 2,    nextX, height / 2, width / 2,
          x, -height / 2, -width / 2,  nextX, -height / 2, -width / 2,
          x, -height / 2, width / 2,   nextX, -height / 2, width / 2
        );

        // Diagonal trusses (X-bracing on sides)
        // Side 1 (Z = -width/2)
        trussVertices.push(
          x, -height / 2, -width / 2,  nextX, height / 2, -width / 2,
          x, height / 2, -width / 2,   nextX, -height / 2, -width / 2
        );
        // Side 2 (Z = width/2)
        trussVertices.push(
          x, -height / 2, width / 2,   nextX, height / 2, width / 2,
          x, height / 2, width / 2,    nextX, -height / 2, width / 2
        );
        // Top Face (Y = height/2)
        trussVertices.push(
          x, height / 2, -width / 2,   nextX, height / 2, width / 2,
          x, height / 2, width / 2,    nextX, height / 2, -width / 2
        );
        // Bottom Face (Y = -height/2)
        trussVertices.push(
          x, -height / 2, -width / 2,  nextX, -height / 2, width / 2,
          x, -height / 2, width / 2,   nextX, -height / 2, -width / 2
        );
      }
    }

    const mainGeom = new THREE.BufferGeometry();
    mainGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const trussGeom = new THREE.BufferGeometry();
    trussGeom.setAttribute('position', new THREE.Float32BufferAttribute(trussVertices, 3));

    // Materials
    const mainMat = new THREE.LineBasicMaterial({
      color: this.cyanColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });

    const trussMat = new THREE.LineBasicMaterial({
      color: this.cyanColor,
      transparent: true,
      opacity: 0, // initially folded, opacity 0
    });

    this.mainLine = new THREE.LineSegments(mainGeom, mainMat);
    this.trussLines = new THREE.LineSegments(trussGeom, trussMat);

    // Position truss lines slightly offset in Y so it folds flat into Y=0
    this.trussLines.scale.set(1, 0.01, 0.01);
    this.trussLines.position.set(0, 0, 0);

    this.add(this.mainLine);
    this.add(this.trussLines);

    this.setUnfoldProgress(0);
  }

  public setUnfoldProgress(progress: number) {
    this.progress = progress;
    // Scale the 3D truss structure based on progress
    // Y-scale and Z-scale go from 0.01 to 1.0
    const scaleY = THREE.MathUtils.lerp(0.01, 1, progress);
    const scaleZ = THREE.MathUtils.lerp(0.01, 1, progress);

    this.trussLines.scale.set(1, scaleY, scaleZ);

    // Fade in the truss lines as progress increases
    const material = this.trussLines.material as THREE.LineBasicMaterial;
    material.opacity = THREE.MathUtils.lerp(0, 0.75, progress);

    // Shift main line opacity slightly or shift position
    const mainMat = this.mainLine.material as THREE.LineBasicMaterial;
    mainMat.opacity = THREE.MathUtils.lerp(0.9, 0.3, progress);
  }
}

// ----------------------------------------------------
// Crystalline Hub
// ----------------------------------------------------
export class CrystallineHub extends THREE.Group {
  public active: boolean = false;
  private outerCrystal: THREE.Mesh;
  private outerWireframe: THREE.LineSegments;
  private innerCore: THREE.Mesh;
  private pointLight: THREE.PointLight;

  constructor(size: number = 1.2) {
    super();

    // Outer crystal - low-poly icosahedron
    const outerGeom = new THREE.IcosahedronGeometry(size, 0); // icosahedron (low-poly)
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: PALETTE.deepSlate,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.15,
      metalness: 0.3,
      ior: 1.5,
      thickness: 1.5,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    this.outerCrystal = new THREE.Mesh(outerGeom, outerMat);

    // Wireframe outline for outer crystal
    const wireGeom = new THREE.WireframeGeometry(outerGeom);
    const wireMat = new THREE.LineBasicMaterial({
      color: PALETTE.deepGray, // Inactive is deep gray
      transparent: true,
      opacity: 0.8,
    });
    this.outerWireframe = new THREE.LineSegments(wireGeom, wireMat);

    // Inner core - smaller high-poly sphere that will glow
    const innerGeom = new THREE.IcosahedronGeometry(size * 0.4, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: PALETTE.cyan,
      transparent: true,
      opacity: 0.1, // barely visible initially
    });
    this.innerCore = new THREE.Mesh(innerGeom, innerMat);

    // Nested point light for active bloom
    this.pointLight = new THREE.PointLight(PALETTE.cyan, 0, 8);
    this.pointLight.position.set(0, 0, 0);

    this.add(this.outerCrystal);
    this.add(this.outerWireframe);
    this.add(this.innerCore);
    this.add(this.pointLight);

    this.setActive(false);
  }

  public setActive(active: boolean, animate: boolean = true) {
    this.active = active;
    const targetLightIntensity = active ? 1.2 : 0;
    const targetCoreOpacity = active ? 0.95 : 0.05;
    const targetWireColor = active ? PALETTE.cyan : PALETTE.deepGray;
    const targetScale = active ? 1.1 : 1.0;

    if (animate) {
      // Smooth animations using GSAP
      // @ts-ignore
      gsap.to(this.pointLight, { intensity: targetLightIntensity, duration: 0.8, ease: 'power2.out' });
      // @ts-ignore
      gsap.to(this.innerCore.material, { opacity: targetCoreOpacity, duration: 0.8 });
      // @ts-ignore
      gsap.to(this.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 0.6, ease: 'back.out(1.7)' });

      const colorObj = new THREE.Color(targetWireColor);
      // @ts-ignore
      gsap.to(this.outerWireframe.material.color, {
        r: colorObj.r,
        g: colorObj.g,
        b: colorObj.b,
        duration: 0.8,
      });

      // Animate core pulsing if active
      if (active) {
        this.animatePulse();
      }
    } else {
      this.pointLight.intensity = targetLightIntensity;
      // @ts-ignore
      this.innerCore.material.opacity = targetCoreOpacity;
      // @ts-ignore
      this.outerWireframe.material.color.setHex(targetWireColor);
      this.scale.set(targetScale, targetScale, targetScale);
    }
  }

  private animatePulse() {
    if (!this.active) return;
    // Core heartbeat pulse
    // @ts-ignore
    gsap.to(this.innerCore.scale, {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      duration: 0.6,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut',
      onComplete: () => {
        if (this.active) {
          setTimeout(() => this.animatePulse(), 1200);
        } else {
          this.innerCore.scale.set(1, 1, 1);
        }
      }
    });
  }

  public update(time: number) {
    // Continuous rotation for aesthetic premium feel
    const rotationSpeed = this.active ? 0.015 : 0.003;
    this.outerCrystal.rotation.y += rotationSpeed;
    this.outerCrystal.rotation.x += rotationSpeed * 0.5;
    this.outerWireframe.rotation.y += rotationSpeed;
    this.outerWireframe.rotation.x += rotationSpeed * 0.5;

    if (this.active) {
      // Subtle float up and down
      this.position.y += Math.sin(time * 2.5) * 0.002;
    }
  }
}

// ----------------------------------------------------
// Translucent Screen
// ----------------------------------------------------
export class TranslucentScreen extends THREE.Group {
  public state: 'off' | 'activating' | 'detail' = 'off';
  public mesh: THREE.Mesh;
  private border: THREE.LineSegments;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private screenMaterial: THREE.MeshPhysicalMaterial;

  constructor(width: number = 3.5, height: number = 2.0, title: string = 'DATA SCREEN', lines: string[] = []) {
    super();

    // Create dynamic canvas for holographic text
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Draw initial text texture
    this.updateCanvasText(title, lines);

    this.texture = new THREE.CanvasTexture(this.canvas);

    // Glass Screen Plane
    const screenGeom = new THREE.PlaneGeometry(width, height);
    this.screenMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1A1D21,
      transparent: true,
      opacity: 0, // start invisible (off)
      transmission: 0.75,
      roughness: 0.15,
      metalness: 0.2,
      ior: 1.45,
      map: this.texture,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(screenGeom, this.screenMaterial);

    // Cyber Border outline with cyan color
    const borderGeom = new THREE.EdgesGeometry(screenGeom);
    const borderMat = new THREE.LineBasicMaterial({
      color: PALETTE.cyan,
      transparent: true,
      opacity: 0, // start invisible (off)
    });
    this.border = new THREE.LineSegments(borderGeom, borderMat);

    this.add(this.mesh);
    this.add(this.border);

    // Initial scale
    this.scale.set(0.001, 0.001, 0.001);
  }

  public updateCanvasText(title: string, lines: string[], isWarning: boolean = false) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear with dark blue semi-transparent overlay
    ctx.fillStyle = 'rgba(26, 29, 33, 0.95)';
    ctx.fillRect(0, 0, w, h);

    // Draw cyber grid background inside screen
    ctx.strokeStyle = isWarning ? 'rgba(255, 0, 255, 0.08)' : 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 16;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Border corners
    ctx.strokeStyle = isWarning ? PALETTE.magentaStr : PALETTE.cyanStr;
    ctx.lineWidth = 4;
    const cornerSize = 15;
    // TL
    ctx.beginPath(); ctx.moveTo(0, cornerSize); ctx.lineTo(0, 0); ctx.lineTo(cornerSize, 0); ctx.stroke();
    // TR
    ctx.beginPath(); ctx.moveTo(w, cornerSize); ctx.lineTo(w, 0); ctx.lineTo(w - cornerSize, 0); ctx.stroke();
    // BL
    ctx.beginPath(); ctx.moveTo(0, h - cornerSize); ctx.lineTo(0, h); ctx.lineTo(cornerSize, h); ctx.stroke();
    // BR
    ctx.beginPath(); ctx.moveTo(w, h - cornerSize); ctx.lineTo(w, h); ctx.lineTo(w - cornerSize, h); ctx.stroke();

    // Draw Title (Space Grotesk style)
    ctx.fillStyle = isWarning ? PALETTE.magentaStr : PALETTE.cyanStr;
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`// ${title.toUpperCase()}`, 30, 45);

    // Draw separation line
    ctx.strokeStyle = isWarning ? 'rgba(255, 0, 255, 0.3)' : 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 60);
    ctx.lineTo(w - 30, 60);
    ctx.stroke();

    // Draw Content Lines
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px monospace';
    let startY = 90;
    lines.forEach((line, index) => {
      ctx.fillText(line, 35, startY + index * 26);
    });

    // Draw loading indicators / status bar
    ctx.fillStyle = isWarning ? 'rgba(255, 0, 255, 0.4)' : 'rgba(0, 255, 255, 0.4)';
    ctx.font = '11px monospace';
    ctx.fillText('STATUS: ONLINE // SECURE_CHANNEL_A', 35, h - 25);
    ctx.fillText('SYS_LOC: ISOGRID_44', w - 180, h - 25);

    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  public transitionTo(targetState: 'off' | 'activating' | 'detail', animate: boolean = true) {
    this.state = targetState;

    let targetScale = 1.0;
    let targetOpacity = 0.95;
    let targetBorderOpacity = 0.8;

    if (targetState === 'off') {
      targetScale = 0.001;
      targetOpacity = 0;
      targetBorderOpacity = 0;
    } else if (targetState === 'activating') {
      targetScale = 1.0;
      targetOpacity = 0.6;
      targetBorderOpacity = 0.5;
    } else if (targetState === 'detail') {
      targetScale = 1.15;
      targetOpacity = 0.98;
      targetBorderOpacity = 1.0;
    }

    if (animate) {
      // @ts-ignore
      gsap.to(this.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 0.6,
        ease: targetState === 'off' ? 'power2.in' : 'back.out(1.5)',
      });
      // @ts-ignore
      gsap.to(this.screenMaterial, {
        opacity: targetOpacity,
        duration: 0.6,
      });
      // @ts-ignore
      gsap.to(this.border.material, {
        opacity: targetBorderOpacity,
        duration: 0.6,
      });

      // Simple screen flicker/glitch effect on activation
      if (targetState === 'activating' || targetState === 'detail') {
        const borderMat = this.border.material as THREE.LineBasicMaterial;
        // @ts-ignore
        gsap.timeline()
          .to(borderMat, { opacity: 0.1, duration: 0.05, repeat: 3, yoyo: true })
          .to(borderMat, { opacity: targetBorderOpacity, duration: 0.1 });
      }
    } else {
      this.scale.set(targetScale, targetScale, targetScale);
      this.screenMaterial.opacity = targetOpacity;
      (this.border.material as THREE.LineBasicMaterial).opacity = targetBorderOpacity;
    }
  }

  public update(time: number) {
    if (this.state !== 'off') {
      // Holographic hover float
      this.position.y += Math.sin(time * 3 + this.id) * 0.0025;
    }
  }
}

// ----------------------------------------------------
// Memory Cube
// ----------------------------------------------------
export class MemoryCube extends THREE.Group {
  public active: boolean = false;
  private outerCube: THREE.Mesh;
  private outline: THREE.BoxHelper;
  private internalFigure: THREE.Group;
  private pointLight: THREE.PointLight;

  constructor(size: number = 1.5, isMagenta: boolean = false) {
    super();

    // Outer glass cube mesh
    const cubeGeom = new THREE.BoxGeometry(size, size, size);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: PALETTE.deepSlate,
      transmission: 0.9,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.outerCube = new THREE.Mesh(cubeGeom, cubeMat);

    // Bright colored outline
    const frameColor = isMagenta ? PALETTE.magenta : PALETTE.cyan;
    this.outline = new THREE.BoxHelper(this.outerCube, new THREE.Color(frameColor));
    // @ts-ignore
    this.outline.material.transparent = true;
    // @ts-ignore
    this.outline.material.opacity = 0.25; // low opacity initially

    // Internal low-poly humanoid figure
    this.internalFigure = new THREE.Group();
    this.createHumanoidFigure(size * 0.7, frameColor);
    this.internalFigure.position.set(0, -size * 0.35, 0); // rest on cube bottom

    // Light source inside
    this.pointLight = new THREE.PointLight(frameColor, 0, 5);

    this.add(this.outerCube);
    this.add(this.outline);
    this.add(this.internalFigure);
    this.add(this.pointLight);

    this.setActive(false, false);
  }

  private createHumanoidFigure(height: number, color: number) {
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.8,
      emissive: color,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.1, // faded when inactive
    });

    // Leg base
    const legsGeom = new THREE.BoxGeometry(height * 0.3, height * 0.4, height * 0.25);
    const legs = new THREE.Mesh(legsGeom, mat);
    legs.position.y = height * 0.2;

    // Torso block
    const torsoGeom = new THREE.BoxGeometry(height * 0.4, height * 0.4, height * 0.3);
    const torso = new THREE.Mesh(torsoGeom, mat);
    torso.position.y = height * 0.6;

    // Head sphere (low poly)
    const headGeom = new THREE.IcosahedronGeometry(height * 0.15, 0);
    const head = new THREE.Mesh(headGeom, mat);
    head.position.y = height * 0.95;

    // Arm blocks
    const leftArmGeom = new THREE.BoxGeometry(height * 0.12, height * 0.35, height * 0.12);
    const leftArm = new THREE.Mesh(leftArmGeom, mat);
    leftArm.position.set(-height * 0.26, height * 0.6, 0);

    const rightArmGeom = new THREE.BoxGeometry(height * 0.12, height * 0.35, height * 0.12);
    const rightArm = new THREE.Mesh(rightArmGeom, mat);
    rightArm.position.set(height * 0.26, height * 0.6, 0);

    this.internalFigure.add(legs, torso, head, leftArm, rightArm);
  }

  public setActive(active: boolean, animate: boolean = true) {
    this.active = active;
    const targetLightIntensity = active ? 1.0 : 0;
    const targetOutlineOpacity = active ? 0.9 : 0.25;
    const targetFigureIntensity = active ? 1.2 : 0.05;
    const targetFigureOpacity = active ? 0.95 : 0.1;

    // Animate children
    this.internalFigure.children.forEach(mesh => {
      const m = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (animate) {
        // @ts-ignore
        gsap.to(m, { emissiveIntensity: targetFigureIntensity, opacity: targetFigureOpacity, duration: 0.7 });
      } else {
        m.emissiveIntensity = targetFigureIntensity;
        m.opacity = targetFigureOpacity;
      }
    });

    if (animate) {
      // @ts-ignore
      gsap.to(this.pointLight, { intensity: targetLightIntensity, duration: 0.7 });
      // @ts-ignore
      gsap.to(this.outline.material, { opacity: targetOutlineOpacity, duration: 0.7 });
      // @ts-ignore
      gsap.to(this.outerCube.scale, {
        x: active ? 1.05 : 1.0,
        y: active ? 1.05 : 1.0,
        z: active ? 1.05 : 1.0,
        duration: 0.5,
        ease: 'back.out'
      });
    } else {
      this.pointLight.intensity = targetLightIntensity;
      // @ts-ignore
      this.outline.material.opacity = targetOutlineOpacity;
      this.outerCube.scale.set(active ? 1.05 : 1.0, active ? 1.05 : 1.0, active ? 1.05 : 1.0);
    }
  }

  public update(time: number) {
    if (this.active) {
      // Rotate the internal figure slowly inside the active cube
      this.internalFigure.rotation.y += 0.01;
      this.outerCube.rotation.y = Math.sin(time * 0.5) * 0.05;
    }
  }
}

// ----------------------------------------------------
// Low-poly Icons
// ----------------------------------------------------
export class LowPolyIcon extends THREE.Group {
  constructor(type: 'code' | 'character', color: number = PALETTE.cyan) {
    super();

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.8,
      emissive: color,
      emissiveIntensity: 0.4,
      flatShading: true,
    });

    if (type === 'code') {
      // Generate bracket geometries < / >
      // Left bracket '<' using thin lines/boxes
      const scale = 0.5;
      const leftPart1 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.7 * scale, 0.1 * scale), mat);
      leftPart1.rotation.z = Math.PI / 4;
      leftPart1.position.set(-0.5 * scale, 0.3 * scale, 0);

      const leftPart2 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.7 * scale, 0.1 * scale), mat);
      leftPart2.rotation.z = -Math.PI / 4;
      leftPart2.position.set(-0.5 * scale, -0.3 * scale, 0);

      // Right bracket '>'
      const rightPart1 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.7 * scale, 0.1 * scale), mat);
      rightPart1.rotation.z = -Math.PI / 4;
      rightPart1.position.set(0.5 * scale, 0.3 * scale, 0);

      const rightPart2 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.7 * scale, 0.1 * scale), mat);
      rightPart2.rotation.z = Math.PI / 4;
      rightPart2.position.set(0.5 * scale, -0.3 * scale, 0);

      // Slash '/'
      const slash = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 1.2 * scale, 0.08 * scale), mat);
      slash.rotation.z = -Math.PI / 8;
      slash.position.set(0, 0, 0);

      this.add(leftPart1, leftPart2, rightPart1, rightPart2, slash);
    } else {
      // Humanoid character icon
      // Head
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), mat);
      head.position.y = 0.45;

      // Torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.5, 5), mat);
      torso.position.y = 0.05;

      // Arms
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), mat);
      leftArm.rotation.z = 0.3;
      leftArm.position.set(-0.25, 0.1, 0);

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), mat);
      rightArm.rotation.z = -0.3;
      rightArm.position.set(0.25, 0.1, 0);

      this.add(head, torso, leftArm, rightArm);
    }
  }

  public update(time: number) {
    // Elegant hovering and rotating animation
    this.rotation.y = time * 0.8;
    this.position.y = Math.sin(time * 2) * 0.05;
  }
}

// ----------------------------------------------------
// Crane Arm Assembly
// ----------------------------------------------------
export class CraneArmAssembly extends THREE.Group {
  public baseNode: THREE.Mesh;
  public lowerArm: THREE.Group;
  public upperArm: THREE.Group;
  public clawLeft: THREE.Mesh;
  public clawRight: THREE.Mesh;

  constructor() {
    super();

    const mat = new THREE.MeshPhysicalMaterial({
      color: PALETTE.deepGray,
      roughness: 0.3,
      metalness: 0.8,
      clearcoat: 0.5,
      side: THREE.DoubleSide,
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cyan,
      emissive: PALETTE.cyan,
      emissiveIntensity: 0.3,
      metalness: 0.9,
    });

    // 1. Base cylindrical rotator
    const baseGeom = new THREE.CylinderGeometry(0.8, 1.0, 0.5, 8);
    this.baseNode = new THREE.Mesh(baseGeom, mat);
    this.add(this.baseNode);

    // 2. Lower Arm Group (pivot at bottom hinge)
    this.lowerArm = new THREE.Group();
    this.lowerArm.position.set(0, 0.25, 0); // sit on top of base
    this.baseNode.add(this.lowerArm);

    // Lower Arm structure (two parallel truss plates)
    const lowerBeamL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 0.2), mat);
    lowerBeamL.position.set(-0.25, 1.75, 0);
    const lowerBeamR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 0.2), mat);
    lowerBeamR.position.set(0.25, 1.75, 0);
    this.lowerArm.add(lowerBeamL, lowerBeamR);

    // Elbow Joint connector
    const elbowJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8), jointMat);
    elbowJoint.rotation.z = Math.PI / 2;
    elbowJoint.position.set(0, 3.5, 0);
    this.lowerArm.add(elbowJoint);

    // 3. Upper Arm Group (pivot at elbow joint)
    this.upperArm = new THREE.Group();
    this.upperArm.position.set(0, 3.5, 0); // elbow position
    this.lowerArm.add(this.upperArm);

    // Upper Arm beam extending out
    const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.0, 0.2), mat);
    upperBeam.position.set(0, 1.5, 0);
    this.upperArm.add(upperBeam);

    // Wrist Joint connector
    const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), jointMat);
    wristJoint.position.set(0, 3.0, 0);
    this.upperArm.add(wristJoint);

    // 4. Claw effector (pivot at wrist)
    const clawBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), mat);
    clawBase.position.set(0, 3.1, 0);
    this.upperArm.add(clawBase);

    // Left and Right claws
    const clawGeom = new THREE.BoxGeometry(0.1, 0.6, 0.15);
    
    this.clawLeft = new THREE.Mesh(clawGeom, mat);
    this.clawLeft.position.set(-0.2, 3.4, 0);
    this.clawLeft.rotation.z = -0.2; // slightly tilted inwards
    this.upperArm.add(this.clawLeft);

    this.clawRight = new THREE.Mesh(clawGeom, mat);
    this.clawRight.position.set(0.2, 3.4, 0);
    this.clawRight.rotation.z = 0.2; // tilted inwards
    this.upperArm.add(this.clawRight);

    // Initialize angles (Folded/Rest state)
    this.setRestPose();
  }

  public setRestPose() {
    this.baseNode.rotation.y = 0;
    this.lowerArm.rotation.z = -Math.PI / 4; // angle back
    this.upperArm.rotation.z = Math.PI / 2.2;  // angle forward
    this.clawLeft.position.x = -0.2;
    this.clawRight.position.x = 0.2;
  }

  /**
   * Animates the crane to extend and grab a target 3D point.
   */
  public animateGrab(targetPosition: THREE.Vector3, onGrab: () => void) {
    // 1. Calculate direction vectors from crane base to target
    const localTarget = this.worldToLocal(targetPosition.clone());
    
    // Calculate rotation angle around Y axis
    const angleY = Math.atan2(localTarget.x, localTarget.z);
    
    // Simple kinematics / aesthetic interpolation:
    // We animate rotation of base towards the target, then lower and upper arm angles.
    // The claw opens before grab, closes on grab, and moves to target.
    
    // @ts-ignore
    const tl = gsap.timeline();
    
    // Open claw claws
    tl.to([this.clawLeft.position, this.clawRight.position], {
      x: (index: number) => index === 0 ? -0.32 : 0.32,
      duration: 0.3
    });
    
    // Rotate base and adjust arm angles
    tl.to(this.baseNode.rotation, {
      y: angleY,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.2');

    // Calculate approximate joint angles to reach the height and distance of localTarget
    const dist2D = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
    const height = localTarget.y;

    // Aesthetic target angles
    const targetLowerZ = -Math.PI / 12 - (height * 0.05);
    const targetUpperZ = Math.PI / 5 + (dist2D * 0.08);

    tl.to(this.lowerArm.rotation, {
      z: targetLowerZ,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '-=0.4');

    tl.to(this.upperArm.rotation, {
      z: targetUpperZ,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '-=0.8');

    // Close claw (grab!)
    tl.to(this.clawLeft.position, { x: -0.15, duration: 0.2 });
    tl.to(this.clawRight.position, { x: 0.15, duration: 0.2, onComplete: onGrab }, '-=0.2');

    // Move slightly back to pull screen forward
    tl.to(this.lowerArm.rotation, {
      z: -Math.PI / 5,
      duration: 0.6,
      ease: 'power2.out'
    });
    tl.to(this.upperArm.rotation, {
      z: Math.PI / 3,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.6');

    // Return claw to normal open
    tl.to([this.clawLeft.position, this.clawRight.position], {
      x: (index: number) => index === 0 ? -0.2 : 0.2,
      duration: 0.3
    });
  }

  public animateReset() {
    // @ts-ignore
    gsap.to(this.baseNode.rotation, { y: 0, duration: 0.8 });
    // @ts-ignore
    gsap.to(this.lowerArm.rotation, { z: -Math.PI / 4, duration: 0.8 });
    // @ts-ignore
    gsap.to(this.upperArm.rotation, { z: Math.PI / 2.2, duration: 0.8 });
    // @ts-ignore
    gsap.to(this.clawLeft.position, { x: -0.2, duration: 0.5 });
    // @ts-ignore
    gsap.to(this.clawRight.position, { x: 0.2, duration: 0.5 });
  }
}
