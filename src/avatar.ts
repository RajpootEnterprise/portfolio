import * as THREE from 'three';

export class Avatar extends THREE.Group {
  // Parts references
  private bodyGroup: THREE.Group;
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArmPivot: THREE.Group;
  private rightArmPivot: THREE.Group;
  private leftLegPivot: THREE.Group;
  private rightLegPivot: THREE.Group;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  
  // State management
  private state: 'idle' | 'walking' | 'sitting' | 'typing' | 'waving' = 'idle';
  private walkCycleTime: number = 0;
  
  constructor() {
    super();
    
    // Create the root group for character elements
    this.bodyGroup = new THREE.Group();
    this.add(this.bodyGroup);
    
    // Color Palette
    const skinColor = 0xffdfd0;      // Soft light skin tone
    const hoodieColor = 0x81b29a;    // Soft green hoodie
    const pantsColor = 0x3d405b;     // Dark blue pants
    const shoesColor = 0xf4f1de;     // Cream shoes
    const hairColor = 0x2f3e46;      // Dark slate/brown hair
    const glassesColor = 0x333333;   // Dark grey frame
    
    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const hoodieMat = new THREE.MeshLambertMaterial({ color: hoodieColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
    const shoesMat = new THREE.MeshLambertMaterial({ color: shoesColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const glassesMat = new THREE.MeshBasicMaterial({ color: glassesColor });
    const lensMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.4 
    });

    // 1. Torso (Hoodie)
    const torsoGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 12);
    // Move geometry up so pivot is at the bottom center of torso
    torsoGeom.translate(0, 0.3, 0);
    this.torso = new THREE.Mesh(torsoGeom, hoodieMat);
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.bodyGroup.add(this.torso);

    // Hoodie Hood (back bump)
    const hoodGeom = new THREE.SphereGeometry(0.18, 10, 10);
    const hood = new THREE.Mesh(hoodGeom, hoodieMat);
    hood.position.set(0, 0.45, -0.15);
    hood.scale.set(1, 1.2, 0.8);
    this.bodyGroup.add(hood);

    // 2. Head
    const headGeom = new THREE.SphereGeometry(0.2, 16, 16);
    this.head = new THREE.Mesh(headGeom, skinMat);
    this.head.position.set(0, 0.75, 0);
    this.head.castShadow = true;
    this.bodyGroup.add(this.head);

    // Hair - Cap
    const hairCapGeom = new THREE.SphereGeometry(0.21, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.8);
    const hairCap = new THREE.Mesh(hairCapGeom, hairMat);
    hairCap.position.set(0, 0.02, -0.01);
    hairCap.rotation.x = -0.1;
    this.head.add(hairCap);

    // Hair - Front fringe/messy bits
    const hairTuftGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    for (let i = 0; i < 5; i++) {
      const tuft = new THREE.Mesh(hairTuftGeom, hairMat);
      tuft.position.set(-0.1 + i * 0.05, 0.16, 0.12);
      tuft.rotation.set(0.2, 0.1, 0.3 * (i - 2));
      tuft.scale.set(0.8, 1, 1.5);
      this.head.add(tuft);
    }

    // Glasses Frame (Two rings and a bridge)
    const glassFrameGeom = new THREE.RingGeometry(0.05, 0.065, 16);
    
    // Left eye lens and frame
    const leftFrame = new THREE.Mesh(glassFrameGeom, glassesMat);
    leftFrame.position.set(-0.07, 0.02, 0.19);
    const leftLens = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), lensMat);
    leftLens.position.set(-0.07, 0.02, 0.188);
    this.head.add(leftFrame);
    this.head.add(leftLens);

    // Right eye lens and frame
    const rightFrame = new THREE.Mesh(glassFrameGeom, glassesMat);
    rightFrame.position.set(0.07, 0.02, 0.19);
    const rightLens = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), lensMat);
    rightLens.position.set(0.07, 0.02, 0.188);
    this.head.add(rightFrame);
    this.head.add(rightLens);

    // Glasses Bridge
    const bridgeGeom = new THREE.BoxGeometry(0.05, 0.015, 0.015);
    const bridge = new THREE.Mesh(bridgeGeom, glassesMat);
    bridge.position.set(0, 0.025, 0.19);
    this.head.add(bridge);

    // Glasses Temple (sides)
    const templeGeom = new THREE.BoxGeometry(0.01, 0.01, 0.2);
    const leftTemple = new THREE.Mesh(templeGeom, glassesMat);
    leftTemple.position.set(-0.13, 0.02, 0.09);
    leftTemple.rotation.y = 0.08;
    const rightTemple = new THREE.Mesh(templeGeom, glassesMat);
    rightTemple.position.set(0.13, 0.02, 0.09);
    rightTemple.rotation.y = -0.08;
    this.head.add(leftTemple);
    this.head.add(rightTemple);

    // Nose
    const noseGeom = new THREE.ConeGeometry(0.025, 0.06, 4);
    const nose = new THREE.Mesh(noseGeom, skinMat);
    nose.position.set(0, -0.03, 0.2);
    nose.rotation.x = -Math.PI / 12;
    this.head.add(nose);

    // 3. Arms
    const armGeom = new THREE.CylinderGeometry(0.065, 0.055, 0.45, 8);
    // Align arm geometry down from pivot
    armGeom.translate(0, -0.2, 0);
    
    const handGeom = new THREE.SphereGeometry(0.06, 8, 8);
    handGeom.translate(0, -0.42, 0);

    // Left Arm Group
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.3, 0.55, 0);
    this.leftArm = new THREE.Mesh(armGeom, hoodieMat);
    this.leftArm.castShadow = true;
    this.leftArmPivot.add(this.leftArm);
    const leftHand = new THREE.Mesh(handGeom, skinMat);
    this.leftArmPivot.add(leftHand);
    this.bodyGroup.add(this.leftArmPivot);

    // Right Arm Group
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.3, 0.55, 0);
    this.rightArm = new THREE.Mesh(armGeom, hoodieMat);
    this.rightArm.castShadow = true;
    this.rightArmPivot.add(this.rightArm);
    const rightHand = new THREE.Mesh(handGeom, skinMat);
    this.rightArmPivot.add(rightHand);
    this.bodyGroup.add(this.rightArmPivot);

    // 4. Legs
    const legGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 8);
    legGeom.translate(0, -0.22, 0);

    const footGeom = new THREE.BoxGeometry(0.09, 0.07, 0.16);
    footGeom.translate(0, -0.45, 0.04);

    // Left Leg Group
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.12, 0.2, 0);
    this.leftLeg = new THREE.Mesh(legGeom, pantsMat);
    this.leftLeg.castShadow = true;
    this.leftLegPivot.add(this.leftLeg);
    const leftFoot = new THREE.Mesh(footGeom, shoesMat);
    this.leftLegPivot.add(leftFoot);
    this.bodyGroup.add(this.leftLegPivot);

    // Right Leg Group
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.12, 0.2, 0);
    this.rightLeg = new THREE.Mesh(legGeom, pantsMat);
    this.rightLeg.castShadow = true;
    this.rightLegPivot.add(this.rightLeg);
    const rightFoot = new THREE.Mesh(footGeom, shoesMat);
    this.rightLegPivot.add(rightFoot);
    this.bodyGroup.add(this.rightLegPivot);
  }

  // Set the avatar state and reset appropriate rotations
  public setState(state: 'idle' | 'walking' | 'sitting' | 'typing' | 'waving') {
    if (this.state === state) return;
    this.state = state;
    this.resetRotations();
  }

  public getState() {
    return this.state;
  }

  // Set standard alignments for reset
  private resetRotations() {
    this.bodyGroup.position.set(0, 0, 0);
    this.bodyGroup.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    
    this.leftArmPivot.rotation.set(0, 0, 0);
    this.rightArmPivot.rotation.set(0, 0, 0);
    this.leftLegPivot.rotation.set(0, 0, 0);
    this.rightLegPivot.rotation.set(0, 0, 0);

    if (this.state === 'sitting') {
      // Rotate legs to point straight out in front
      this.leftLegPivot.rotation.x = -Math.PI / 2;
      this.rightLegPivot.rotation.x = -Math.PI / 2;
      // Lower body group to couch level
      this.bodyGroup.position.y = -0.15;
      
      // Arms resting on legs
      this.leftArmPivot.rotation.x = -Math.PI / 6;
      this.leftArmPivot.rotation.z = -Math.PI / 18;
      this.rightArmPivot.rotation.x = -Math.PI / 6;
      this.rightArmPivot.rotation.z = Math.PI / 18;
    } else if (this.state === 'typing') {
      // Sitting at desk pose
      this.leftLegPivot.rotation.x = -Math.PI / 2;
      this.rightLegPivot.rotation.x = -Math.PI / 2;
      this.bodyGroup.position.y = -0.12;

      // Arms raised over desk typing
      this.leftArmPivot.rotation.x = -Math.PI / 3;
      this.leftArmPivot.rotation.y = Math.PI / 12;
      this.rightArmPivot.rotation.x = -Math.PI / 3;
      this.rightArmPivot.rotation.y = -Math.PI / 12;
    } else if (this.state === 'waving') {
      // Standing waving gesture
      this.rightArmPivot.rotation.z = Math.PI * 0.75;
      this.rightArmPivot.rotation.x = -Math.PI / 6;
    }
  }

  // Update animations based on delta time
  public update(time: number) {
    if (this.state === 'walking') {
      this.walkCycleTime += 0.35;
      
      // Swing legs back and forth
      this.leftLegPivot.rotation.x = Math.sin(this.walkCycleTime) * 0.6;
      this.rightLegPivot.rotation.x = -Math.sin(this.walkCycleTime) * 0.6;
      
      // Swing arms opposite to legs
      this.leftArmPivot.rotation.x = -Math.sin(this.walkCycleTime) * 0.4;
      this.leftArmPivot.rotation.z = -0.05 - Math.abs(Math.sin(this.walkCycleTime)) * 0.05;
      this.rightArmPivot.rotation.x = Math.sin(this.walkCycleTime) * 0.4;
      this.rightArmPivot.rotation.z = 0.05 + Math.abs(Math.sin(this.walkCycleTime)) * 0.05;
      
      // Bob body slightly up and down
      this.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycleTime * 2)) * 0.06;
      
      // Tilt torso slightly forward while walking
      this.torso.rotation.x = 0.05;
      
      // Slight head bobbing
      this.head.rotation.x = Math.sin(this.walkCycleTime * 2) * 0.03;
    } else {
      this.torso.rotation.x = 0;
      this.walkCycleTime = 0;
      
      // Tiny breathing animation for idle states
      const breathe = Math.sin(time * 2.5) * 0.015;
      this.bodyGroup.position.y += breathe;
      
      if (this.state === 'idle') {
        // Simple idle arm details
        this.leftArmPivot.rotation.z = -0.05 + Math.sin(time * 1.5) * 0.02;
        this.rightArmPivot.rotation.z = 0.05 - Math.sin(time * 1.5) * 0.02;
        this.head.rotation.y = Math.sin(time * 0.8) * 0.08;
      } 
      else if (this.state === 'typing') {
        this.leftLegPivot.rotation.x = -Math.PI / 2;
        this.rightLegPivot.rotation.x = -Math.PI / 2;
        this.bodyGroup.position.y = -0.12 + breathe;

        // Animate arms rapidly as if typing
        this.leftArmPivot.rotation.x = -Math.PI / 3 + Math.sin(time * 20) * 0.08;
        this.leftArmPivot.rotation.y = Math.PI / 12 + Math.cos(time * 15) * 0.04;
        this.rightArmPivot.rotation.x = -Math.PI / 3 + Math.cos(time * 20) * 0.08;
        this.rightArmPivot.rotation.y = -Math.PI / 12 + Math.sin(time * 15) * 0.04;
        
        // Head looks slightly down towards laptop
        this.head.rotation.x = 0.15 + Math.sin(time * 1.2) * 0.03;
        this.head.rotation.y = Math.sin(time * 0.6) * 0.04;
      } 
      else if (this.state === 'sitting') {
        this.leftLegPivot.rotation.x = -Math.PI / 2;
        this.rightLegPivot.rotation.x = -Math.PI / 2;
        this.bodyGroup.position.y = -0.15 + breathe;
        
        // Cozy slouch sitting posture
        this.leftArmPivot.rotation.x = -Math.PI / 5 + Math.sin(time * 1.2) * 0.02;
        this.rightArmPivot.rotation.x = -Math.PI / 5 + Math.cos(time * 1.2) * 0.02;
        this.head.rotation.y = Math.sin(time * 0.5) * 0.06;
      }
      else if (this.state === 'waving') {
        // Wave hand back and forth rapidly
        this.rightArmPivot.rotation.z = Math.PI * 0.7 + Math.sin(time * 8) * 0.25;
        this.rightArmPivot.rotation.x = -Math.PI / 8;
        
        this.leftArmPivot.rotation.z = -0.05 + Math.sin(time * 1.5) * 0.02;
        this.head.rotation.y = Math.sin(time * 0.8) * 0.05;
      }
    }
  }
}
