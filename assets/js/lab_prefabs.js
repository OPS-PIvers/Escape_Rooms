/**
 * lab_prefabs.js
 * Procedural generation of Science Lab assets.
 */

import * as THREE from 'three';

// --- MATERIALS ---
const tableTopMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 }); // Black resin
const tableLegMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.8 }); // Steel
const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 0.9,
    transparent: true,
    thickness: 0.1
});
const liquidRedMat = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
const liquidBlueMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 });
const liquidGreenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.9 });
const burnerBaseMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

/**
 * Creates a standard lab workbench.
 * @param {number} width 
 * @param {number} depth 
 */
export function createLabTable(width = 2, depth = 0.8) {
    const group = new THREE.Group();

    // Top
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), tableTopMat);
    top.position.y = 0.9; // Standard counter height
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.05, 0.9, 0.05);
    const positions = [
        [-width / 2 + 0.1, 0.45, -depth / 2 + 0.1],
        [width / 2 - 0.1, 0.45, -depth / 2 + 0.1],
        [-width / 2 + 0.1, 0.45, depth / 2 - 0.1],
        [width / 2 - 0.1, 0.45, depth / 2 - 0.1]
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, tableLegMat);
        leg.position.set(...pos);
        leg.castShadow = true;
        leg.receiveShadow = true;
        group.add(leg);
    });

    return group;
}

/**
 * Creates a Fume Hood.
 */
export function createFumeHood() {
    const group = new THREE.Group();

    // Main Box
    const boxGeo = new THREE.BoxGeometry(1.5, 2.2, 0.8);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 1.1;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Interior (Hollowed out look - simplified with a black box inset)
    const interior = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    interior.position.set(0, 1.3, 0.11); // Slightly forward
    group.add(interior);

    // Glass Sash
    const sash = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 0.02), glassMat);
    sash.position.set(0, 1.3, 0.4);
    group.add(sash);

    return group;
}

/**
 * Creates a Beaker with liquid.
 * @param {string} color 'red', 'blue', 'green'
 */
export function createBeaker(color = 'red') {
    const group = new THREE.Group();

    // Glass container
    const glassGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16);
    // Open top? For simplicity just a cylinder
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0.1;
    group.add(glass);

    // Liquid
    let liqMat = liquidRedMat;
    if (color === 'blue') liqMat = liquidBlueMat;
    if (color === 'green') liqMat = liquidGreenMat;

    const liquidGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16);
    const liquid = new THREE.Mesh(liquidGeo, liqMat);
    liquid.position.y = 0.07;
    group.add(liquid);

    return group;
}

/**
 * Creates a Microscope.
 */
export function createMicroscope() {
    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    base.position.y = 0.025;
    group.add(base);

    // Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    arm.position.set(-0.05, 0.15, -0.05);
    arm.rotation.x = -0.2;
    group.add(arm);

    // Eyepiece Tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    tube.rotation.x = 1.0;
    tube.position.set(-0.05, 0.35, 0.05);
    group.add(tube);

    // Stage
    const stage = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.12), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    stage.position.set(0, 0.15, 0);
    group.add(stage);

    return group;
}

/**
 * Creates a Bunsen Burner.
 */
export function createBunsenBurner() {
    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.02, 16), burnerBaseMat);
    base.position.y = 0.01;
    group.add(base);

    // Tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 16), metalMat);
    tube.position.y = 0.08;
    group.add(tube);

    // Flame (Hidden by default)
    const flameGeo = new THREE.ConeGeometry(0.02, 0.08, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.19;
    flame.visible = false;
    flame.name = "flame";
    group.add(flame);

    return group;
}
