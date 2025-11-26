import * as THREE from 'three';
import { loadModel } from '../modelLoader.js';

export async function createDesk() {
    const group = new THREE.Group();

    // 1. The Desk
    const desk = await loadModel('assets/models/desk.glb');
    if (!desk) return null; // Failed to load essential part
    
    desk.position.set(0, 0, 0); // Grounded
    group.add(desk);

    // 2. The Chair
    const chair = await loadModel('assets/models/chair.glb');
    if (chair) {
        chair.position.set(0, 0, 0.6); // Pulled out slightly
        chair.rotation.y = Math.PI; // Facing desk
        group.add(chair);
    }

    // 3. Computer Setup
    const screen = await loadModel('assets/models/computerScreen.glb');
    if (screen) {
        screen.position.set(0, 0.75, -0.2); // On top of desk (approx height 0.75)
        group.add(screen);
    }

    const keyboard = await loadModel('assets/models/computerKeyboard.glb');
    if (keyboard) {
        keyboard.position.set(0, 0.75, 0.15);
        group.add(keyboard);
    }

    const mouse = await loadModel('assets/models/computerMouse.glb');
    if (mouse) {
        mouse.position.set(0.35, 0.75, 0.15); // To the right
        group.add(mouse);
    }

    return group;
}