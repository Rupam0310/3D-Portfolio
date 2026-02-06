import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Configuration
let config = null;

// Scene setup
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Fog
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);

// Background gradient
scene.background = new THREE.Color(0x0f0c29);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2,  // strength
    0.5,  // radius
    0.2   // threshold
);
composer.addPass(bloomPass);

// Helper functions
function createAnimeMaterial(color) {
    return new THREE.MeshToonMaterial({
        color: color,
        gradientMap: createGradientMap()
    });
}

function createGradientMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 3;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#808080';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 0, 1, 1);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

function addOutline(mesh, thickness) {
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.BackSide
    });
    const outlineMesh = new THREE.Mesh(mesh.geometry.clone(), outlineMaterial);
    outlineMesh.scale.multiplyScalar(1 + thickness);
    mesh.add(outlineMesh);
}

function getPathX(z) {
    return Math.sin(z * 0.05) * 12 + Math.sin(z * 0.02) * 5;
}

// Character creation
function createCharacter() {
    const character = new THREE.Group();
    
    // Body (coral suit)
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const bodyMaterial = createAnimeMaterial(0xff7675);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    addOutline(body, 0.02);
    character.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = createAnimeMaterial(0xffdcb6);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1;
    head.castShadow = true;
    addOutline(head, 0.02);
    character.add(head);
    
    // Backpack (yellow)
    const backpackGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const backpackMaterial = createAnimeMaterial(0xfdcb6e);
    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 0.2, -0.5);
    backpack.castShadow = true;
    addOutline(backpack, 0.02);
    character.add(backpack);
    
    // Legs (dark pants)
    const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const legMaterial = createAnimeMaterial(0x2d3436);
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, -1, 0);
    leftLeg.castShadow = true;
    addOutline(leftLeg, 0.02);
    character.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, -1, 0);
    rightLeg.castShadow = true;
    addOutline(rightLeg, 0.02);
    character.add(rightLeg);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const armMaterial = createAnimeMaterial(0xff7675);
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.55, 0.2, 0);
    leftArm.castShadow = true;
    addOutline(leftArm, 0.02);
    character.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.55, 0.2, 0);
    rightArm.castShadow = true;
    addOutline(rightArm, 0.02);
    character.add(rightArm);
    
    character.scale.set(1.5, 1.5, 1.5);
    character.userData.leftLeg = leftLeg;
    character.userData.rightLeg = rightLeg;
    character.userData.leftArm = leftArm;
    character.userData.rightArm = rightArm;
    
    return character;
}

// Ground creation
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(50, 300, 100, 300);
    const groundMaterial = createAnimeMaterial(0x2d3436);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // Deform to follow path
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getY(i);
        const pathX = getPathX(-z);
        positions.setX(i, x + pathX);
    }
    positions.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    addOutline(ground, 0.01);
    return ground;
}

// Zone creations
function createIntroZone() {
    const group = new THREE.Group();
    
    // Platform
    const platformGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 32);
    const platformMaterial = createAnimeMaterial(0x6c5ce7);
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.25;
    platform.castShadow = true;
    addOutline(platform, 0.03);
    group.add(platform);
    
    // Cyan ring
    const ringGeometry = new THREE.TorusGeometry(3, 0.3, 16, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = 5;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    group.userData.ring = ring;
    
    return group;
}

function createAboutZone() {
    const group = new THREE.Group();
    
    // Trees
    for (let i = 0; i < 12; i++) {
        const tree = new THREE.Group();
        
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMaterial = createAnimeMaterial(0x8b4513);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        addOutline(trunk, 0.03);
        tree.add(trunk);
        
        const foliageGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const foliageMaterial = createAnimeMaterial(0x27ae60);
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 3;
        foliage.castShadow = true;
        addOutline(foliage, 0.03);
        tree.add(foliage);
        
        const angle = (i / 12) * Math.PI * 2;
        const radius = 8 + Math.random() * 4;
        tree.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);
        group.add(tree);
    }
    
    // Green orbs
    for (let i = 0; i < 25; i++) {
        const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const orbMaterial = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(
            (Math.random() - 0.5) * 20,
            2 + Math.random() * 3,
            (Math.random() - 0.5) * 20
        );
        group.add(orb);
    }
    
    return group;
}

function createExperienceZone() {
    const group = new THREE.Group();
    
    // Buildings
    for (let i = 0; i < 20; i++) {
        const height = 3 + Math.random() * 8;
        const buildingGeometry = new THREE.BoxGeometry(2, height, 2);
        const buildingMaterial = createAnimeMaterial(0x7f8c8d);
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.castShadow = true;
        building.receiveShadow = true;
        addOutline(building, 0.03);
        
        const side = Math.random() > 0.5 ? 1 : -1;
        const distance = 8 + Math.random() * 7;
        building.position.set(
            side * distance,
            height / 2,
            (Math.random() - 0.5) * 40
        );
        building.scale.set(1.5, 1.5, 1.5);
        group.add(building);
    }
    
    return group;
}

function createProjectsZone() {
    const group = new THREE.Group();
    
    // Holographic floor
    const floorGeometry = new THREE.PlaneGeometry(30, 40);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.1;
    group.add(floor);
    
    // Tech pillars
    for (let i = 0; i < 6; i++) {
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
        const pillarMaterial = createAnimeMaterial(0x4facfe);
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.castShadow = true;
        addOutline(pillar, 0.03);
        
        const angle = (i / 6) * Math.PI * 2;
        pillar.position.set(Math.cos(angle) * 10, 3, Math.sin(angle) * 10);
        group.add(pillar);
        
        // Glow on top
        const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x667eea });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(pillar.position.x, 6.5, pillar.position.z);
        group.add(glow);
    }
    
    return group;
}

function createSkillsZone() {
    const group = new THREE.Group();
    
    // Wireframe core
    const coreGeometry = new THREE.IcosahedronGeometry(3, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xff006e,
        wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 5;
    group.add(core);
    group.userData.core = core;
    
    // Orbiting orbs
    for (let i = 0; i < 10; i++) {
        const orbGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const orbMaterial = new THREE.MeshBasicMaterial({ color: 0x764ba2 });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        group.add(orb);
        group.userData[`orb${i}`] = {
            mesh: orb,
            angle: (i / 10) * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5,
            radius: 5 + Math.random() * 2
        };
    }
    
    return group;
}

function createEducationZone() {
    const group = new THREE.Group();
    
    // Monument
    const monumentGeometry = new THREE.CylinderGeometry(0.5, 2, 8, 8);
    const monumentMaterial = createAnimeMaterial(0xffd700);
    const monument = new THREE.Mesh(monumentGeometry, monumentMaterial);
    monument.position.y = 4;
    monument.castShadow = true;
    addOutline(monument, 0.03);
    group.add(monument);
    
    // Columns
    for (let i = 0; i < 4; i++) {
        const columnGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
        const columnMaterial = createAnimeMaterial(0xe0c068);
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.castShadow = true;
        addOutline(column, 0.03);
        
        const angle = (i / 4) * Math.PI * 2;
        column.position.set(Math.cos(angle) * 5, 2.5, Math.sin(angle) * 5);
        group.add(column);
    }
    
    // Top sphere
    const topGeometry = new THREE.SphereGeometry(1, 16, 16);
    const topMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 8.5;
    group.add(top);
    
    return group;
}

function createContactZone() {
    const group = new THREE.Group();
    
    // Portal
    const portalGeometry = new THREE.TorusGeometry(4, 0.5, 16, 32);
    const portalMaterial = new THREE.MeshBasicMaterial({ color: 0x4facfe });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.y = 5;
    group.add(portal);
    group.userData.portal = portal;
    
    // Portal particles
    for (let i = 0; i < 100; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(
            (Math.random() - 0.5) * 8,
            Math.random() * 10,
            (Math.random() - 0.5) * 8
        );
        group.add(particle);
        group.userData[`particle${i}`] = particle;
    }
    
    return group;
}

// Particles
function createParticles() {
    const group = new THREE.Group();
    
    // Dust particles
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = [];
    for (let i = 0; i < 1000; i++) {
        dustPositions.push(
            (Math.random() - 0.5) * 100,
            Math.random() * 50,
            (Math.random() - 0.5) * 300
        );
    }
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    group.add(dust);
    
    // Cyan streamers
    for (let i = 0; i < 600; i++) {
        const streamerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const streamerMaterial = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
        const streamer = new THREE.Mesh(streamerGeometry, streamerMaterial);
        streamer.position.set(
            (Math.random() - 0.5) * 80,
            20 + Math.random() * 30,
            (Math.random() - 0.5) * 300
        );
        group.add(streamer);
        group.userData[`streamer${i}`] = streamer;
    }
    
    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsPositions = [];
    for (let i = 0; i < 2000; i++) {
        starsPositions.push(
            (Math.random() - 0.5) * 200,
            20 + Math.random() * 80,
            (Math.random() - 0.5) * 400
        );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    group.add(stars);
    
    return group;
}

// World setup
const character = createCharacter();
character.position.set(0, 50, 0);
scene.add(character);

const ground = createGround();
scene.add(ground);

const particles = createParticles();
scene.add(particles);

// Zone definitions
const zones = [
    { start: 0, end: -25, name: 'Intro', description: 'Welcome to my journey', object: createIntroZone() },
    { start: -25, end: -65, name: 'About', description: 'Who I am', object: createAboutZone() },
    { start: -65, end: -115, name: 'Experience', description: 'My professional journey', object: createExperienceZone() },
    { start: -115, end: -175, name: 'Projects', description: 'What I\'ve built', object: createProjectsZone() },
    { start: -175, end: -225, name: 'Skills', description: 'My expertise', object: createSkillsZone() },
    { start: -225, end: -265, name: 'Education', description: 'My academic background', object: createEducationZone() },
    { start: -265, end: -300, name: 'Contact', description: 'Get in touch', object: createContactZone() }
];

zones.forEach((zone, index) => {
    const zoneZ = (zone.start + zone.end) / 2;
    zone.object.position.set(getPathX(zoneZ), 0, zoneZ);
    scene.add(zone.object);
});

// Camera setup
camera.position.set(0, 56, 15);
camera.lookAt(0, 50, 0);

// Animation state
let scrollPosition = 0;
let targetScrollPosition = 0;
let currentZone = 0;
let walkCycle = 0;
let isDescending = true;
let mouseX = 0;
let mouseY = 0;
let cameraAngle = 0;
let targetCameraAngle = 0;

// Load config
async function loadConfig() {
    const response = await fetch('config.json');
    config = await response.json();
    console.log('Config loaded:', config);
}

// Panel content generation
function showPanel(zoneIndex) {
    const panel = document.getElementById('content-panel');
    const content = document.getElementById('panel-content');
    
    let html = '';
    
    switch(zoneIndex) {
        case 0: // Intro
            html = `
                <div class="panel-section">
                    <h2>${config.personal.name}</h2>
                    <h3>${config.personal.title}</h3>
                    ${config.personal.bio.map(p => `<p>${p}</p>`).join('')}
                    <div class="stat-grid">
                        ${config.personal.stats.map(stat => `
                            <div class="stat-card">
                                <div class="stat-value">${stat.value}</div>
                                <div class="stat-label">${stat.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            break;
            
        case 1: // About
            html = `
                <div class="panel-section">
                    <h2>About Me</h2>
                    ${config.personal.bio.map(p => `<p>${p}</p>`).join('')}
                </div>
                <div class="panel-section">
                    <h2>Certifications</h2>
                    <div class="certification-list">
                        ${config.certifications.map(cert => `
                            <div class="certification-item">${cert}</div>
                        `).join('')}
                    </div>
                </div>
            `;
            break;
            
        case 2: // Experience
            html = `
                <div class="panel-section">
                    <h2>Professional Experience</h2>
                    ${config.experience.map(exp => `
                        <div class="experience-item">
                            <div class="item-header">
                                <div class="item-title">${exp.title}</div>
                                <div class="item-period">${exp.period}</div>
                            </div>
                            <div class="item-company">${exp.company}</div>
                            <div class="item-description">${exp.description}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
            
        case 3: // Projects
            html = `
                <div class="panel-section">
                    <h2>Featured Projects</h2>
                    ${config.projects.map(project => `
                        <div class="project-item" style="border-left-color: ${project.gradient}">
                            <div class="project-emoji">${project.emoji}</div>
                            <div class="item-title">${project.name}</div>
                            <div class="item-description">${project.description}</div>
                            <div class="project-tags">
                                ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
            
        case 4: // Skills
            html = `
                <div class="panel-section">
                    <h2>Technical Skills</h2>
                    ${config.skills.map(category => `
                        <div class="skill-category">
                            <h3>${category.category}</h3>
                            ${category.items.map(skill => `
                                <div class="skill-item">
                                    <div class="skill-header">
                                        <span class="skill-name">${skill.name}</span>
                                        <span class="skill-level">${skill.level}%</span>
                                    </div>
                                    <div class="skill-bar">
                                        <div class="skill-fill" style="width: ${skill.level}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
            break;
            
        case 5: // Education
            html = `
                <div class="panel-section">
                    <h2>Education</h2>
                    ${config.education.map(edu => `
                        <div class="education-item">
                            <div class="project-emoji">${edu.icon}</div>
                            <div class="item-header">
                                <div class="item-title">${edu.degree}</div>
                                <div class="item-period">${edu.period}</div>
                            </div>
                            <div class="item-institution">${edu.institution}</div>
                            <div class="item-description">${edu.description}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
            
        case 6: // Contact
            html = `
                <div class="panel-section">
                    <h2>${config.contact.greeting}</h2>
                    <p>${config.contact.message}</p>
                    <div class="contact-links">
                        ${config.contact.links.map(link => `
                            <a href="${link.url}" class="contact-link" target="_blank">
                                <span class="contact-icon">${link.icon}</span>
                                <span class="contact-text">${link.text}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
            break;
    }
    
    content.innerHTML = html;
    panel.classList.add('active');
}

// Event listeners
window.addEventListener('wheel', (e) => {
    if (isDescending) return;
    targetScrollPosition -= e.deltaY * 0.05;
    targetScrollPosition = Math.max(-300, Math.min(0, targetScrollPosition));
});

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    targetCameraAngle = mouseX * 0.5;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('intro-overlay').classList.add('hidden');
    document.getElementById('scroll-hint').classList.remove('hidden');
    document.getElementById('zone-indicator').classList.remove('hidden');
    document.getElementById('progress-container').classList.remove('hidden');
    // Show intro panel immediately
    setTimeout(() => showPanel(0), 500);
});

document.getElementById('close-panel').addEventListener('click', () => {
    document.getElementById('content-panel').classList.remove('active');
});

document.getElementById('toggle-panel').addEventListener('click', () => {
    const panel = document.getElementById('content-panel');
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
    } else {
        showPanel(currentZone);
    }
});

// Zone dot clicks
document.querySelectorAll('.dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
        const zone = zones[index];
        targetScrollPosition = (zone.start + zone.end) / 2;
        showPanel(index);
    });
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Descent animation
    if (isDescending) {
        character.position.y -= 0.5;
        character.rotation.y += 0.1;
        if (character.position.y <= 2) {
            character.position.y = 2;
            isDescending = false;
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('intro-overlay').classList.remove('hidden');
            }, 500);
        }
        camera.position.y = character.position.y + 6;
        camera.position.z = character.position.z + 15;
        camera.lookAt(character.position);
        composer.render();
        return;
    }
    
    // Smooth scroll
    scrollPosition += (targetScrollPosition - scrollPosition) * 0.05;
    
    // Character position
    const pathX = getPathX(scrollPosition);
    character.position.x = pathX;
    character.position.z = scrollPosition;
    
    // Character rotation
    const lookAhead = 5;
    const nextX = getPathX(scrollPosition - lookAhead);
    const angle = Math.PI + Math.atan2(nextX - pathX, -lookAhead);
    character.rotation.y = angle;
    
    // Walking animation
    if (Math.abs(targetScrollPosition - scrollPosition) > 0.1) {
        walkCycle += 0.15;
        character.userData.leftLeg.rotation.x = Math.sin(walkCycle) * 0.5;
        character.userData.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
        character.userData.leftArm.rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
        character.userData.rightArm.rotation.x = Math.sin(walkCycle) * 0.3;
    }
    
    // Camera follow
    cameraAngle += (targetCameraAngle - cameraAngle) * 0.05;
    const cameraDistance = 15;
    const cameraHeight = 6;
    const cameraX = pathX + Math.sin(angle + cameraAngle) * cameraDistance;
    const cameraZ = scrollPosition + Math.cos(angle + cameraAngle) * cameraDistance;
    
    camera.position.x += (cameraX - camera.position.x) * 0.05;
    camera.position.y += (character.position.y + cameraHeight - camera.position.y) * 0.05;
    camera.position.z += (cameraZ - camera.position.z) * 0.05;
    camera.lookAt(character.position.x, character.position.y + 1, character.position.z);
    
    // Zone updates
    const newZone = zones.findIndex(z => scrollPosition >= z.end && scrollPosition <= z.start);
    if (newZone !== -1 && newZone !== currentZone) {
        currentZone = newZone;
        document.getElementById('zone-name').textContent = zones[newZone].name;
        document.getElementById('zone-description').textContent = zones[newZone].description;
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === newZone);
        });
        // Automatically show panel for new zone
        showPanel(newZone);
    }
    
    // Progress bar
    const progress = Math.abs(scrollPosition) / 300;
    document.getElementById('progress-fill').style.width = `${progress * 100}%`;
    
    // Animations
    const time = Date.now() * 0.001;
    
    // Intro zone ring
    if (zones[0].object.userData.ring) {
        zones[0].object.userData.ring.rotation.z = time;
        zones[0].object.userData.ring.position.y = 5 + Math.sin(time * 2) * 0.5;
    }
    
    // Skills zone
    if (zones[4].object.userData.core) {
        zones[4].object.userData.core.rotation.x = time * 0.5;
        zones[4].object.userData.core.rotation.y = time * 0.3;
    }
    for (let i = 0; i < 10; i++) {
        const orbData = zones[4].object.userData[`orb${i}`];
        if (orbData) {
            const angle = orbData.angle + time * orbData.speed;
            orbData.mesh.position.set(
                Math.cos(angle) * orbData.radius,
                5 + Math.sin(angle * 2) * 2,
                Math.sin(angle) * orbData.radius
            );
        }
    }
    
    // Contact zone portal
    if (zones[6].object.userData.portal) {
        zones[6].object.userData.portal.rotation.y = time;
    }
    for (let i = 0; i < 100; i++) {
        const particle = zones[6].object.userData[`particle${i}`];
        if (particle) {
            particle.position.y += Math.sin(time + i) * 0.02;
            particle.rotation.y = time + i;
        }
    }
    
    // Falling streamers
    for (let i = 0; i < 600; i++) {
        const streamer = particles.userData[`streamer${i}`];
        if (streamer) {
            streamer.position.y -= 0.05;
            if (streamer.position.y < 0) {
                streamer.position.y = 50;
            }
        }
    }
    
    composer.render();
}

// Initialize
async function init() {
    await loadConfig();
    
    // Simulate loading
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 2;
        document.getElementById('loading-progress').style.width = `${progress}%`;
        document.getElementById('loading-percentage').textContent = `${progress}%`;
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                animate();
            }, 500);
        }
    }, 30);
}

init();