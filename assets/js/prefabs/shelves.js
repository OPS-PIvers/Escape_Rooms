import * as THREE from 'three';
import { createObject } from '../objectCreator.js';

export async function createShelves() {
    const group = new THREE.Group();

    // 1. The Bookcase
    const bookcase = await createObject('bookcaseOpen');
    if (!bookcase) return null;

    bookcase.position.set(0, 0, 0);
    group.add(bookcase);

    // 2. Props on Shelves
    
    // Bottom Shelf: Books
    const books1 = await createObject('books');
    if (books1) {
        books1.position.set(-0.2, 0.05, 0);
        group.add(books1);
    }

    // Middle Shelf: Plant
    const plant = await createObject('plantSmall1');
    if (plant) {
        plant.position.set(0.2, 0.82, 0);
        group.add(plant);
    }

    // Top Shelf: Radio
    const radio = await createObject('radio');
    if (radio) {
        radio.position.set(0, 1.25, 0);
        radio.rotation.y = -Math.PI / 6;
        group.add(radio);
    }

    return group;
}