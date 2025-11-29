import * as THREE from 'three';
import { createObject } from '../objectCreator.js';

export async function createDesk() {
    const group = new THREE.Group();

    // 1. The Desk
    const desk = await createObject('desk');
    if (!desk) return null;
    
    desk.position.set(0, 0, 0);
    group.add(desk);

    // 2. The Chair
    const chair = await createObject('chair');
    if (chair) {
        chair.position.set(0, 0, 0.6);
        chair.rotation.y = Math.PI;
        group.add(chair);
    }

    // 3. Computer Setup
    const screen = await createObject('computerScreen');
    if (screen) {
        screen.position.set(0, 0.75, -0.2);
        group.add(screen);
    }

    const keyboard = await createObject('computerKeyboard');
    if (keyboard) {
        keyboard.position.set(0, 0.75, 0.15);
        group.add(keyboard);
    }

    const mouse = await createObject('computerMouse');
    if (mouse) {
        mouse.position.set(0.35, 0.75, 0.15);
        group.add(mouse);
    }

    return group;
}