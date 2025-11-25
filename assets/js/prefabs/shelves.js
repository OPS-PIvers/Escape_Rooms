import * as THREE from 'three';
import {
    createBox,
    interactables
} from '../utils.js';
import {
    mat
} from '../materials.js';


function createShelves(scene) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, 0, -4.8);
    scene.add(shelfGroup);
    const shelfHeight = 3.5;
    const shelfDepth = 0.4;
    const shelfLevels = [0.2, 1.0, 1.8, 2.6, 3.4];
    [-4.5, -2.5, -0.5, 1.5, 3.5].forEach(x => createBox(0.1, shelfHeight, shelfDepth, mat.shelf, x, shelfHeight / 2, 0, shelfGroup));
    shelfLevels.forEach(y => createBox(8.2, 0.05, shelfDepth, mat.shelf, -0.5, y, 0, shelfGroup));

    function createBook(x, y, z, parent) {
        const h = 0.2 + Math.random() * 0.15;
        const t = 0.04 + Math.random() * 0.04;
        const d = 0.22 + Math.random() * 0.05;
        const col = mat.bookColors[Math.floor(Math.random() * mat.bookColors.length)];
        const book = createBox(t, h, d, col, 0, 0, 0, parent);
        book.position.set(x, y + h / 2, z);
        if (Math.random() > 0.8) book.rotation.z = (Math.random() - 0.5) * 0.2;
        return t;
    }
    const shelfZones = [{
        minX: -4.4,
        maxX: -2.6
    }, {
        minX: -2.4,
        maxX: -0.6
    }, {
        minX: -0.4,
        maxX: 1.4
    }, {
        minX: 1.6,
        maxX: 3.4
    }];
    let bClusterIdx = 0;
    shelfLevels.forEach((level, lvlIndex) => {
        if (lvlIndex === 0) return;
        shelfZones.forEach((zone) => {
            let cx = zone.minX + 0.1;

            // Always attempt to create a cluster if we haven't made 4 yet
            if (bClusterIdx < 4) {
                bClusterIdx++;
                const bw = (zone.maxX - zone.minX) * 0.9;
                // Create invisible interaction box
                const bhit = createBox(bw, 0.4, 0.3, new THREE.MeshBasicMaterial({
                    visible: false
                }), (zone.minX + zone.maxX) / 2, level + 0.2, 0, shelfGroup, 0, 0, 0, `book_cluster_${bClusterIdx}`);
                interactables.push(bhit); // Ensure it's added to interactables manually if createBox didn't (createBox does if name provided)

                // Fill with books
                while (cx < zone.maxX - 0.15) {
                    cx += createBook(cx, level, 0, shelfGroup) + 0.002;
                }
            } else {
                // Random filler for remaining shelves
                if (Math.random() > 0.3) {
                    while (cx < zone.maxX - 0.15) {
                        cx += createBook(cx, level, 0, shelfGroup) + 0.002;
                    }
                } else {
                    createBox(0.4, 0.25, 0.3, 0x8d6e63, cx + 0.25, level + 0.125, 0, shelfGroup);
                    cx += 0.6;
                    while (cx < zone.maxX - 0.1) cx += createBook(cx, level, 0, shelfGroup) + 0.002;
                }
            }
        });
    });

    // Shelf Decor
    // Framed Photo on shelf
    const photoFrame = new THREE.Group();
    photoFrame.position.set(-3.5, 1.0, 0); // On a lower shelf
    shelfGroup.add(photoFrame);
    createBox(0.02, 0.25, 0.2, mat.woodDark, 0, 0.125, 0, photoFrame);
    // Create a dedicated canvas for the photo frame
    const photoCanvasElem = document.createElement('canvas');
    photoCanvasElem.width = 180;
    photoCanvasElem.height = 230;
    const photoCtx = photoCanvasElem.getContext('2d');
    // Draw a simple placeholder photo (replace with actual image if desired)
    photoCtx.fillStyle = '#fff';
    photoCtx.fillRect(0, 0, 180, 230);
    photoCtx.fillStyle = '#222';
    photoCtx.font = 'bold 32px Share Tech Mono, monospace';
    photoCtx.textAlign = 'center';
    photoCtx.textBaseline = 'middle';
    photoCtx.fillText('Photo', 90, 115);
    const photoCanvas = new THREE.CanvasTexture(photoCanvasElem);
    const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.23), new THREE.MeshBasicMaterial({
        map: photoCanvas
    }));
    photoMesh.position.x = 0.015;
    photoMesh.rotation.y = Math.PI / 2;
    photoFrame.add(photoMesh);

    // Decorative Box
    createBox(0.2, 0.15, 0.2, 0x880e4f, 2.5, 1.075, 0, shelfGroup);

    return shelfGroup;
}

export {
    createShelves
};