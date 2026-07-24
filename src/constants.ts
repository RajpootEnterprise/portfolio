import * as THREE from 'three';

export const HEIGHTS = {
  ground: 0.0,
  first: 3.2,
  second: 6.4
};

export const GLOBE = {
  radius: 35.0,
  center: new THREE.Vector3(0, -35.0 - 0.05, 0)
};

export const COLORS = {
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

export interface RoomPosition {
  stand: THREE.Vector3;
  action: THREE.Vector3;
  h: number;
  faceDirection: number;
  labelName: string;
}

export const roomPositions: Record<string, RoomPosition> = {
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

export interface CameraView {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const cameraViews: Record<string, CameraView> = {
  home: {
    position: new THREE.Vector3(-10, HEIGHTS.ground + 8, 12),
    target: new THREE.Vector3(-3.5, HEIGHTS.ground + 1.6, 1.2)
  },
  contact: {
    position: new THREE.Vector3(10, HEIGHTS.ground + 8, 12),
    target: new THREE.Vector3(3.5, HEIGHTS.ground + 1.6, 1.2)
  },
  about: {
    position: new THREE.Vector3(-10, HEIGHTS.first + 8, 8),
    target: new THREE.Vector3(-3.5, HEIGHTS.first + 1.6, -0.6)
  },
  timeline: {
    position: new THREE.Vector3(10, HEIGHTS.first + 8, 8),
    target: new THREE.Vector3(3.5, HEIGHTS.first + 1.6, -0.6)
  },
  projects: {
    position: new THREE.Vector3(-10, HEIGHTS.second + 8, 8),
    target: new THREE.Vector3(-3.5, HEIGHTS.second + 1.6, -0.6)
  },
  skills: {
    position: new THREE.Vector3(10, HEIGHTS.second + 8, 8),
    target: new THREE.Vector3(3.5, HEIGHTS.second + 1.6, -0.6)
  }
};

export interface ProjectDetail {
  meta: string;
  title: string;
  tags: string[];
  desc: string;
  features: string[];
  images: string[];
}

export const projectDetails: ProjectDetail[] = [
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
    ],
    images: [
      "/projects/billing_dashboard.png",
      "/projects/code_screenshot.png",
      "/favicon.svg"
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
    ],
    images: [
      "/projects/elearning_dashboard.png",
      "/projects/code_screenshot.png",
      "/favicon.svg"
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
    ],
    images: [
      "/projects/aws_5g_architecture.png",
      "/projects/code_screenshot.png",
      "/favicon.svg"
    ]
  },
  {
    meta: "04 / CREDENTIALS & ACHIEVEMENTS",
    title: "Credentials & Achievements",
    tags: ["AWS Cloud Quest", "B.Tech BGIEM", "5G Systems Network Design", "Smart India Hackathon"],
    desc: "A verified collection of professional qualifications, national hackathon participations, and academic excellence markers.",
    features: [
      "B.Tech Bachelor of Technology in Computer Science & Engineering with a cumulative CGPA of 8.5.",
      "AWS Certified Cloud Practitioner and participant in AWS Cloud Quest modeling serverless microservices.",
      "Completed 5G Competence Training by Telecom Sector Skill Council (TSSC) covering cellular signaling protocols.",
      "National Finalist at Smart India Hackathon (SIH), building smart governance solutions under pressure.",
      "Successfully solved real-world enterprise Resource Management flows at Odoo Hackathon."
    ],
    images: [
      "/projects/code_screenshot.png",
      "/favicon.svg"
    ]
  }
];

export const planetDestinations = [
  { center: new THREE.Vector3(-18, 15, -22), radius: 1.8 }, // Saturn
  { center: new THREE.Vector3(-6, 17, -26), radius: 1.5 },  // Mars
  { center: new THREE.Vector3(8, 16, -24), radius: 1.6 },   // Neptune
  { center: new THREE.Vector3(18, 14, -18), radius: 1.4 }   // Venus
];
