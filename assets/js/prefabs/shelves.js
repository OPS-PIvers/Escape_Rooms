import * as THREE from 'three';
import { loadModel } from '../modelLoader.js';
import { BOOKSHELF_SHELF_HEIGHTS, FLOOR_HEIGHT } from '../heightConstants.js';

export async function createShelves() {
    const group = new THREE.Group();

    // 1. The Bookcase
    const bookcase = await loadModel('assets/models/bookcaseOpen.glb');
    if (!bookcase) return null;

    bookcase.position.set(0, FLOOR_HEIGHT, 0);
    group.add(bookcase);

    // 2. Props on Shelves - using standardized shelf heights

    // Bottom Shelf: Books
    const books1 = await loadModel('assets/models/books.glb');
    if (books1) {
        books1.position.set(-0.2, BOOKSHELF_SHELF_HEIGHTS[0], 0);
        group.add(books1);
    }

    // Middle Shelf: Plant
    const plant = await loadModel('assets/models/plantSmall1.glb');
    if (plant) {
        plant.position.set(0.2, BOOKSHELF_SHELF_HEIGHTS[1], 0);
        group.add(plant);
    }

    // Top Shelf: Radio
    const radio = await loadModel('assets/models/radio.glb');
    if (radio) {
        radio.position.set(0, BOOKSHELF_SHELF_HEIGHTS[2], 0);
        radio.rotation.y = -Math.PI / 6; // Angled
        group.add(radio);
    }

    return group;
}