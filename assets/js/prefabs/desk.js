import * as THREE from 'three';
import {
    createBox,
    interactables
} from '../utils.js';
import {
    mat
} from '../materials.js';

function createDesk(scene) {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(2.5, 0, -3.0);
    scene.add(deskGroup);
    createBox(1.8, 0.05, 3.5, mat.woodDark, 0, 0.75, 0, deskGroup);
    createBox(1.6, 0.75, 0.2, mat.shelf, 0, 0.375, 1.55, deskGroup);
    createBox(1.6, 0.75, 0.2, mat.shelf, 0, 0.375, -1.55, deskGroup);

    // Computer Monitor (Rotated 90 deg)
    const pcGroup = new THREE.Group();
    pcGroup.position.set(0, 0.8, 0);
    // ROTATED 90 DEG CLOCKWISE from Math.PI/2 -> 0
    pcGroup.rotation.y = 0;
    deskGroup.add(pcGroup);
    createBox(0.1, 0.3, 0.1, 0x222222, 0, 0.15, 0, pcGroup);
    createBox(0.05, 0.6, 1.0, 0x222222, 0, 0.5, 0, pcGroup);
    createBox(0.01, 0.55, 0.95, mat.screenOn, -0.03, 0.5, 0, pcGroup, 0, 0, 0, "computer");

    // Keyboard
    const kbGroup = new THREE.Group();
    kbGroup.position.set(-0.4, 0.76, 0);
    deskGroup.add(kbGroup);
    createBox(0.3, 0.02, 0.8, 0x222222, 0, 0, 0, kbGroup, 0, 0, 0, "keyboard");
    // Keys hint
    for (let kx = 0; kx < 3; kx++) {
        for (let kz = 0; kz < 8; kz++) {
            createBox(0.04, 0.01, 0.04, 0x444444, -0.08 + kx * 0.08, 0.015, -0.3 + kz * 0.08, kbGroup);
        }
    }

    // Mouse
    createBox(0.12, 0.04, 0.08, 0x333333, -0.4, 0.76, 0.6, deskGroup, 0, 0, 0, "mouse");

    // Open Book
    const openBook = new THREE.Group();
    openBook.position.set(0.4, 0.76, 0.6);
    openBook.rotation.y = 0.2;
    deskGroup.add(openBook);
    const lPage = createBox(0.25, 0.02, 0.18, 0xeeeeee, 0, 0.01, -0.09, openBook);
    lPage.rotation.x = 0.1;
    const rPage = createBox(0.25, 0.02, 0.18, 0xeeeeee, 0, 0.01, 0.09, openBook);
    rPage.rotation.x = -0.1;
    const hitBook = createBox(0.3, 0.1, 0.4, new THREE.MeshBasicMaterial({
        visible: false
    }), 0, 0, 0, openBook, 0, 0, 0, "open_book");
    interactables.push(hitBook);

    // Desk Organizer
    const organizer = new THREE.Group();
    organizer.position.set(0.6, 0.76, -0.8);
    deskGroup.add(organizer);
    createBox(0.2, 0.1, 0.15, mat.shelf, 0, 0.05, 0, organizer);
    // Pens
    for (let i = 0; i < 3; i++) {
        const penColor = i === 0 ? 0xcc0000 : (i === 1 ? 0x0000cc : 0x000000);
        createBox(0.015, 0.12, 0.015, penColor, -0.05 + i * 0.05, 0.06, 0, organizer, 0, 0, 0.2);
    }

    // Notepad
    const notepad = new THREE.Group();
    notepad.position.set(0, 0.76, -1.2);
    notepad.rotation.y = 0.1;
    deskGroup.add(notepad);
    createBox(0.25, 0.02, 0.35, 0xffffff, 0, 0.01, 0, notepad);
    createBox(0.25, 0.02, 0.35, 0x444444, 0, -0.01, 0, notepad);

    // Scattered Papers
    const paper1 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), mat.paper);
    paper1.rotation.x = -Math.PI / 2;
    paper1.rotation.z = -0.5;
    paper1.position.set(0.5, 0.76, 0);
    deskGroup.add(paper1);


    const deskChair = new THREE.Group();
    deskChair.position.set(1.2, 0, -3.0);
    deskChair.rotation.y = -Math.PI / 2;
    scene.add(deskChair);
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 8), mat.chrome);
    cBase.position.y = 0.1;
    deskChair.add(cBase);
    createBox(0.05, 0.4, 0.05, mat.chrome, 0, 0.3, 0, deskChair);
    createBox(0.65, 0.1, 0.65, mat.leather, 0, 0.55, 0, deskChair);
    const cBack = createBox(0.6, 0.9, 0.1, mat.leather, 0, 1.0, 0.25, deskChair);
    cBack.rotation.x = -0.15;

    return deskGroup;
}

export {
    createDesk
};