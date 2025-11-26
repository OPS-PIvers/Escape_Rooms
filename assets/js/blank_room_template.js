console.log("blank_room_template.js loaded");
import * as THREE from 'three';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Light blue background
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(-10, 10, -10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// --- ROOM ---
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Floor
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
roomGroup.add(floor);

// Walls
const wallGeometry = new THREE.BoxGeometry(10, 3, 0.2);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

const wall1 = new THREE.Mesh(wallGeometry, wallMaterial.clone());
wall1.position.set(0, 1.5, -5);
wall1.castShadow = true;
roomGroup.add(wall1);

const wall2 = new THREE.Mesh(wallGeometry, wallMaterial.clone());
wall2.position.set(0, 1.5, 5);
wall2.castShadow = true;
roomGroup.add(wall2);

const wall3 = new THREE.Mesh(wallGeometry, wallMaterial.clone());
wall3.position.set(-5, 1.5, 0);
wall3.rotation.y = Math.PI / 2;
wall3.castShadow = true;
roomGroup.add(wall3);

const wall4 = new THREE.Mesh(wallGeometry, wallMaterial.clone());
wall4.position.set(5, 1.5, 0);
wall4.rotation.y = Math.PI / 2;
wall4.castShadow = true;
roomGroup.add(wall4);


// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose for verification
window.camera = camera;
window.scene = scene;
window.renderer = renderer;

animate();
