import * as THREE from 'three';
import { loadModel } from '../modelLoader.js';

export async function createShelves() {
    const group = new THREE.Group();

    // 1. The Bookcase
    const bookcase = await loadModel('assets/models/bookcaseOpen.glb');
    if (!bookcase) return null;

    bookcase.position.set(0, 0, 0);
    group.add(bookcase);

    // 2. Props on Shelves
    // Shelf heights are typically around 0.4, 0.8, 1.2, 1.6 meters relative to bottom
    
    // Bottom Shelf: Books
    const books1 = await loadModel('assets/models/books.glb');
    if (books1) {
        books1.position.set(-0.2, 0.05, 0); // Just above base
        group.add(books1);
    }

    // Middle Shelf: Plant
    const plant = await loadModel('assets/models/plantSmall1.glb');
    if (plant) {
        plant.position.set(0.2, 0.82, 0); // On middle shelf
        group.add(plant);
    }

    // Top Shelf: Radio
    const radio = await loadModel('assets/models/radio.glb');
    if (radio) {
        radio.position.set(0, 1.25, 0); // Upper shelf
        radio.rotation.y = -Math.PI / 6; // Angled
        group.add(radio);
    }

    return group;
}