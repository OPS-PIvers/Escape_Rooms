import * as THREE from 'three';
import { initClassroom } from './classroom.js';
import { initOffice } from './office.js';

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc); // Light grey background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 8); // High angle view
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls (Simple orbit-like or custom)
// Assuming touchControls.js handles interaction, we just need loop

// Initialize based on page
const path = window.location.pathname;

if (path.includes('classroom.html')) {
    initClassroom(scene).catch(err => console.error("Classroom init error:", err));
} else if (path.includes('office.html')) {
    initOffice(scene).catch(err => console.error("Office init error:", err));
} else {
    // Default or index
    console.log("Loading default scene (Classroom)");
    initClassroom(scene).catch(err => console.error("Classroom init error:", err));
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});