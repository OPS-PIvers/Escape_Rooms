/**
 * lab_prefabs.js
 * Procedural generation of Science Lab assets.
 * Production-quality prefabs for the Science Lab escape room.
 */

import * as THREE from 'three';

// --- SHARED MATERIALS ---
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
const metalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.9 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
const plasticBlackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
const plasticWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });

// Chemical liquid materials
const liquidRedMat = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
const liquidBlueMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 });
const liquidGreenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
const liquidYellowMat = new THREE.MeshStandardMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });

/**
 * Creates a standard lab workbench.
 * @param {number} width
 * @param {number} depth
 */
export function createLabTable(width = 2, depth = 0.8) {
    const group = new THREE.Group();
    const height = 0.9;

    // Top
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), tableTopMat);
    top.position.y = height;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.05, height, 0.05);
    const positions = [
        [-width / 2 + 0.1, height / 2, -depth / 2 + 0.1],
        [width / 2 - 0.1, height / 2, -depth / 2 + 0.1],
        [-width / 2 + 0.1, height / 2, depth / 2 - 0.1],
        [width / 2 - 0.1, height / 2, depth / 2 - 0.1]
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, tableLegMat);
        leg.position.set(...pos);
        leg.castShadow = true;
        leg.receiveShadow = true;
        group.add(leg);
    });

    // Cross bars for stability
    const crossBar = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.2, 0.03, 0.03),
        tableLegMat
    );
    crossBar.position.set(0, 0.1, 0);
    group.add(crossBar);

    return group;
}

/**
 * Creates a lab counter/cabinet.
 * @param {number} width
 * @param {number} depth
 */
export function createLabCounter(width = 3, depth = 0.6) {
    const group = new THREE.Group();
    const height = 0.9;

    // Cabinet body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        whiteMat
    );
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Counter top (black resin)
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.02, 0.05, depth + 0.02),
        tableTopMat
    );
    top.position.y = height + 0.025;
    top.castShadow = true;
    group.add(top);

    // Cabinet doors - calculate positions to distribute evenly across width
    const doorCount = 3;
    const doorGap = 0.02;
    const totalGaps = (doorCount - 1) * doorGap;
    const doorWidth = (width - totalGaps) / doorCount;
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });

    for (let i = 0; i < doorCount; i++) {
        // Calculate door center position: start from left edge + half door width + door index * (door width + gap)
        const doorX = -width / 2 + doorWidth / 2 + i * (doorWidth + doorGap);

        const door = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, height - 0.1, 0.02),
            doorMat
        );
        door.position.set(doorX, height / 2, depth / 2 + 0.01);
        group.add(door);

        // Door handle
        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.02, 0.02),
            metalMat
        );
        handle.position.set(doorX, height / 2 + 0.15, depth / 2 + 0.03);
        group.add(handle);
    }

    return group;
}

/**
 * Creates a Fume Hood.
 */
export function createFumeHood() {
    const group = new THREE.Group();

    // Main cabinet structure
    const boxGeo = new THREE.BoxGeometry(1.5, 2.2, 0.8);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 1.1;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Interior (Hollowed out look)
    const interior = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.2, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    interior.position.set(0, 1.3, 0.11);
    group.add(interior);

    // Glass Sash
    const sash = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.2, 0.02),
        glassMat
    );
    sash.position.set(0, 1.3, 0.4);
    group.add(sash);

    // Exhaust hood on top
    const exhaust = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    exhaust.position.set(0, 2.35, 0);
    group.add(exhaust);

    // Exhaust pipe
    const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16),
        metalMat
    );
    pipe.position.set(0, 2.75, 0);
    group.add(pipe);

    return group;
}

/**
 * Creates a Beaker with liquid (simple version for decoration).
 * @param {string} color 'red', 'blue', 'green', 'yellow', 'clear'
 */
export function createBeaker(color = 'red') {
    const group = new THREE.Group();

    // Glass container
    const glassGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0.1;
    group.add(glass);

    // Liquid - use map lookup for cleaner code
    const liquidMaterialMap = {
        red: liquidRedMat,
        blue: liquidBlueMat,
        green: liquidGreenMat,
        yellow: liquidYellowMat,
        clear: glassMat
    };
    const liqMat = liquidMaterialMap[color] || liquidRedMat;

    if (color !== 'clear') {
        const liquidGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 16);
        const liquid = new THREE.Mesh(liquidGeo, liqMat);
        liquid.position.y = 0.07;
        group.add(liquid);
    }

    return group;
}

/**
 * Creates a Chemical Flask (Erlenmeyer style).
 * @param {string} color 'red', 'blue', 'green', 'yellow'
 */
export function createChemicalFlask(color = 'red') {
    const group = new THREE.Group();

    // Flask body (wider bottom, narrow neck)
    const bodyGeo = new THREE.CylinderGeometry(0.03, 0.1, 0.15, 16);
    const body = new THREE.Mesh(bodyGeo, glassMat);
    body.position.y = 0.075;
    group.add(body);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.08, 16);
    const neck = new THREE.Mesh(neckGeo, glassMat);
    neck.position.y = 0.19;
    group.add(neck);

    // Liquid inside - use map lookup for cleaner code
    const liquidMaterialMap = {
        red: liquidRedMat,
        blue: liquidBlueMat,
        green: liquidGreenMat,
        yellow: liquidYellowMat
    };
    const liqMat = liquidMaterialMap[color] || liquidRedMat;

    const liquidGeo = new THREE.CylinderGeometry(0.025, 0.085, 0.1, 16);
    const liquid = new THREE.Mesh(liquidGeo, liqMat);
    liquid.position.y = 0.05;
    group.add(liquid);

    return group;
}

/**
 * Creates a Mixing Beaker (larger, for the experiment).
 */
export function createMixingBeaker() {
    const group = new THREE.Group();

    // Large beaker
    const glassGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.25, 16, 1, true);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0.125;
    group.add(glass);

    // Bottom
    const bottomGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16);
    const bottom = new THREE.Mesh(bottomGeo, glassMat);
    bottom.position.y = 0.01;
    group.add(bottom);

    // Graduation marks (simple lines)
    const markMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
    for (let i = 1; i <= 3; i++) {
        const mark = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.002, 0.01),
            markMat
        );
        mark.position.set(0.11, i * 0.06, 0);
        group.add(mark);
    }

    return group;
}

/**
 * Creates a Microscope.
 */
export function createMicroscope() {
    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 0.25),
        plasticBlackMat
    );
    base.position.y = 0.025;
    group.add(base);

    // Arm (curved support)
    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.35, 0.05),
        plasticBlackMat
    );
    arm.position.set(-0.05, 0.2, -0.08);
    arm.rotation.x = -0.15;
    group.add(arm);

    // Eyepiece tube
    const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.15, 16),
        plasticBlackMat
    );
    tube.rotation.x = 1.2;
    tube.position.set(-0.05, 0.4, 0.05);
    group.add(tube);

    // Objective lens turret
    const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16),
        metalMat
    );
    turret.position.set(0, 0.2, 0);
    group.add(turret);

    // Objective lenses (3 of them)
    for (let i = 0; i < 3; i++) {
        const lens = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.015, 0.04, 8),
            metalMat
        );
        lens.position.set(
            Math.sin(i * Math.PI * 2 / 3) * 0.03,
            0.18,
            Math.cos(i * Math.PI * 2 / 3) * 0.03
        );
        group.add(lens);
    }

    // Stage
    const stage = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.01, 0.15),
        plasticBlackMat
    );
    stage.position.set(0, 0.15, 0);
    group.add(stage);

    // Focus knob
    const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16),
        metalMat
    );
    knob.rotation.z = Math.PI / 2;
    knob.position.set(0.1, 0.25, -0.08);
    group.add(knob);

    return group;
}

/**
 * Creates a Bunsen Burner.
 */
export function createBunsenBurner() {
    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 0.02, 16),
        darkMat
    );
    base.position.y = 0.01;
    group.add(base);

    // Main tube
    const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.18, 16),
        metalMat
    );
    tube.position.y = 0.1;
    group.add(tube);

    // Air intake collar
    const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16),
        metalMat
    );
    collar.position.y = 0.05;
    group.add(collar);

    // Gas connection
    const gasConn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8),
        metalMat
    );
    gasConn.rotation.z = Math.PI / 2;
    gasConn.position.set(0.04, 0.03, 0);
    group.add(gasConn);

    // Flame (hidden by default)
    const flameGeo = new THREE.ConeGeometry(0.025, 0.1, 8);
    const flameMat = new THREE.MeshBasicMaterial({
        color: 0x4444ff,
        transparent: true,
        opacity: 0.9
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.24;
    flame.visible = false;
    flame.name = "flame";
    group.add(flame);

    // Inner flame (hotter)
    const innerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.012, 0.06, 8),
        new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.95 })
    );
    innerFlame.position.y = 0.22;
    innerFlame.visible = false;
    innerFlame.name = "innerFlame";
    flame.add(innerFlame);

    return group;
}

/**
 * Creates a Test Tube Rack with tubes.
 */
export function createTestTubeRack() {
    const group = new THREE.Group();

    // Rack frame
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

    // Base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.02, 0.08),
        rackMat
    );
    base.position.y = 0.01;
    group.add(base);

    // Top bar with holes
    const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.015, 0.06),
        rackMat
    );
    topBar.position.y = 0.15;
    group.add(topBar);

    // Support posts
    const postGeo = new THREE.BoxGeometry(0.015, 0.15, 0.015);
    const postPositions = [
        [-0.11, 0.08, 0.02],
        [0.11, 0.08, 0.02],
        [-0.11, 0.08, -0.02],
        [0.11, 0.08, -0.02]
    ];
    postPositions.forEach(pos => {
        const post = new THREE.Mesh(postGeo, rackMat);
        post.position.set(...pos);
        group.add(post);
    });

    // Test tubes
    const tubeColors = [0xff6666, 0x6666ff, 0x66ff66, 0xffff66, 0xff66ff];
    for (let i = 0; i < 5; i++) {
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8),
            glassMat
        );
        tube.position.set(-0.08 + i * 0.04, 0.08, 0);
        group.add(tube);

        // Liquid in tube
        const liquid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8),
            new THREE.MeshStandardMaterial({
                color: tubeColors[i],
                transparent: true,
                opacity: 0.7
            })
        );
        liquid.position.set(-0.08 + i * 0.04, 0.05, 0);
        group.add(liquid);
    }

    return group;
}

/**
 * Creates a Lab Notebook.
 */
export function createLabNotebook() {
    const group = new THREE.Group();

    // Cover
    const cover = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.02, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x1a1a5a, roughness: 0.8 })
    );
    cover.position.y = 0.01;
    group.add(cover);

    // Pages
    const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.015, 0.23),
        new THREE.MeshStandardMaterial({ color: 0xf5f5dc })
    );
    pages.position.y = 0.025;
    group.add(pages);

    // Binding
    const binding = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.025, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x111133 })
    );
    binding.position.set(-0.09, 0.0125, 0);
    group.add(binding);

    return group;
}

/**
 * Creates a Petri Dish.
 */
export function createPetriDish() {
    const group = new THREE.Group();

    // Dish bottom
    const bottom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.015, 24),
        glassMat
    );
    bottom.position.y = 0.0075;
    group.add(bottom);

    // Dish lid
    const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.008, 24),
        glassMat
    );
    lid.position.y = 0.02;
    group.add(lid);

    // Growth medium (agar)
    const agar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.008, 24),
        new THREE.MeshStandardMaterial({
            color: 0xffccaa,
            transparent: true,
            opacity: 0.8
        })
    );
    agar.position.y = 0.008;
    group.add(agar);

    return group;
}

/**
 * Creates a Chemical Storage Cabinet.
 */
export function createChemicalCabinet() {
    const group = new THREE.Group();
    const width = 0.8;
    const height = 1.8;
    const depth = 0.5;

    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        whiteMat
    );
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Glass doors
    const doorGlass = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.08, height - 0.2, 0.02),
        glassMat
    );
    doorGlass.position.set(0, height / 2, depth / 2 + 0.01);
    group.add(doorGlass);

    // Shelves
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    for (let i = 1; i <= 3; i++) {
        const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(width - 0.1, 0.02, depth - 0.1),
            shelfMat
        );
        shelf.position.y = i * height / 4;
        group.add(shelf);
    }

    // Warning label
    const labelGeo = new THREE.PlaneGeometry(0.15, 0.1);
    const labelMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0, height - 0.2, depth / 2 + 0.02);
    group.add(label);

    return group;
}

/**
 * Creates a Laboratory Refrigerator.
 */
export function createLabFridge() {
    const group = new THREE.Group();
    const width = 0.7;
    const height = 1.6;
    const depth = 0.6;

    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        whiteMat
    );
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Door
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.02, height - 0.04, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    door.position.set(0, height / 2, depth / 2 + 0.02);
    group.add(door);

    // Handle
    const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.3, 0.03),
        metalMat
    );
    handle.position.set(width / 2 - 0.08, height / 2, depth / 2 + 0.05);
    group.add(handle);

    // Temperature display
    const display = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x00aaff })
    );
    display.position.set(0, height - 0.2, depth / 2 + 0.05);
    group.add(display);

    return group;
}

/**
 * Creates a Lab Computer.
 */
export function createLabComputer() {
    const group = new THREE.Group();

    // Monitor
    const monitorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.35, 0.03),
        plasticBlackMat
    );
    monitorFrame.position.y = 0.25;
    group.add(monitorFrame);

    // Screen
    const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.29, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x001100 })
    );
    screen.position.set(0, 0.25, 0.02);
    screen.name = "screen";
    group.add(screen);

    // Stand
    const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.12, 0.08),
        plasticBlackMat
    );
    stand.position.y = 0.06;
    group.add(stand);

    // Base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.02, 0.15),
        plasticBlackMat
    );
    group.add(base);

    // Keyboard
    const keyboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.02, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    keyboard.position.set(0, 0.01, 0.2);
    group.add(keyboard);

    return group;
}

/**
 * Creates a Centrifuge.
 */
export function createCentrifuge() {
    const group = new THREE.Group();

    // Main body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, 0.25, 24),
        plasticWhiteMat
    );
    body.position.y = 0.125;
    body.castShadow = true;
    group.add(body);

    // Lid
    const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.2, 0.03, 24),
        plasticWhiteMat
    );
    lid.position.y = 0.265;
    group.add(lid);

    // Control panel
    const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.06, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    panel.position.set(0, 0.12, 0.21);
    group.add(panel);

    // Display
    const display = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.03, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    display.position.set(0, 0.14, 0.22);
    group.add(display);

    // Buttons
    for (let i = 0; i < 3; i++) {
        const btn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8),
            new THREE.MeshStandardMaterial({ color: i === 1 ? 0x00ff00 : 0xff0000 })
        );
        btn.rotation.x = Math.PI / 2;
        btn.position.set(-0.03 + i * 0.03, 0.1, 0.22);
        group.add(btn);
    }

    return group;
}

/**
 * Creates a Lab Safe.
 */
export function createLabSafe() {
    const group = new THREE.Group();
    const width = 0.5;
    const height = 0.6;
    const depth = 0.4;

    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 })
    );
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Door frame
    const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.04, height - 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 })
    );
    doorFrame.position.set(0, height / 2, depth / 2 + 0.01);
    group.add(doorFrame);

    // Keypad
    const keypad = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.15, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    keypad.position.set(0, height / 2 + 0.1, depth / 2 + 0.03);
    group.add(keypad);

    // Keypad display
    const keypadDisplay = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.03, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x003300 })
    );
    keypadDisplay.position.set(0, height / 2 + 0.15, depth / 2 + 0.04);
    group.add(keypadDisplay);

    // Handle
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16),
        metalMat
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(width / 2 - 0.08, height / 2 - 0.1, depth / 2 + 0.04);
    group.add(handle);

    return group;
}

/**
 * Creates a Biohazard Container.
 */
export function createBiohazardContainer() {
    const group = new THREE.Group();

    // Main bin
    const bin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.18, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.6 })
    );
    bin.position.y = 0.25;
    bin.castShadow = true;
    group.add(bin);

    // Lid
    const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21, 0.21, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 })
    );
    lid.position.y = 0.525;
    group.add(lid);

    // Biohazard symbol (simplified as yellow circle)
    const symbol = new THREE.Mesh(
        new THREE.CircleGeometry(0.08, 16),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    symbol.position.set(0, 0.25, 0.19);
    group.add(symbol);

    return group;
}

/**
 * Creates a Lab Whiteboard.
 * @param {number} width
 * @param {number} height
 */
export function createLabWhiteboard(width = 2, height = 1.2) {
    const group = new THREE.Group();

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });

    // Board
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    group.add(board);

    // Frame pieces
    const frameThickness = 0.04;
    // Top
    const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.08, frameThickness, 0.05),
        frameMat
    );
    topFrame.position.y = height / 2 + frameThickness / 2;
    group.add(topFrame);

    // Bottom
    const bottomFrame = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.08, frameThickness, 0.05),
        frameMat
    );
    bottomFrame.position.y = -height / 2 - frameThickness / 2;
    group.add(bottomFrame);

    // Tray
    const tray = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.8, 0.02, 0.08),
        frameMat
    );
    tray.position.set(0, -height / 2 - 0.05, 0.05);
    group.add(tray);

    return group;
}

/**
 * Creates an Emergency Shower.
 */
export function createEmergencyShower() {
    const group = new THREE.Group();

    // Pole
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8),
        metalMat
    );
    pole.position.y = 1.25;
    group.add(pole);

    // Shower head
    const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.12, 0.08, 16),
        metalMat
    );
    head.position.y = 2.5;
    group.add(head);

    // Pull handle
    const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    handle.position.set(0, 1.5, 0.1);
    group.add(handle);

    // Chain
    const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.3, 4),
        metalMat
    );
    chain.position.set(0.12, 1.65, 0.1);
    group.add(chain);

    // Warning sign
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.15, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    sign.position.set(0.2, 1.8, 0);
    group.add(sign);

    return group;
}

/**
 * Creates an Eye Wash Station.
 */
export function createEyeWashStation() {
    const group = new THREE.Group();

    // Base unit
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.2),
        metalMat
    );
    base.position.y = 0.075;
    group.add(base);

    // Eye wash bowls
    for (let i = -1; i <= 1; i += 2) {
        const bowl = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            metalMat
        );
        bowl.position.set(i * 0.08, 0.15, 0);
        bowl.rotation.x = Math.PI;
        group.add(bowl);
    }

    // Activation paddle
    const paddle = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.02, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    paddle.position.set(0, 0.18, 0.08);
    group.add(paddle);

    return group;
}

/**
 * Creates a First Aid Kit.
 */
export function createFirstAidKit() {
    const group = new THREE.Group();

    // Box
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.25, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    group.add(box);

    // Red cross
    const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 0.01),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    crossH.position.z = 0.051;
    group.add(crossH);

    const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.12, 0.01),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    crossV.position.z = 0.051;
    group.add(crossV);

    return group;
}

/**
 * Creates a Lab Stool.
 */
export function createLabStool() {
    const group = new THREE.Group();

    // Seat
    const seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 })
    );
    seat.position.y = 0.65;
    seat.castShadow = true;
    group.add(seat);

    // Central pole
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, 0.4, 12),
        metalMat
    );
    pole.position.y = 0.42;
    group.add(pole);

    // Base ring
    const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.015, 8, 24),
        metalMat
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.1;
    group.add(baseRing);

    // Base legs (5)
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.02, 0.25),
            metalMat
        );
        leg.position.set(
            Math.sin(angle) * 0.15,
            0.1,
            Math.cos(angle) * 0.15
        );
        leg.rotation.y = angle;
        group.add(leg);

        // Wheel
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8),
            darkMat
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(
            Math.sin(angle) * 0.27,
            0.02,
            Math.cos(angle) * 0.27
        );
        group.add(wheel);
    }

    return group;
}

/**
 * Creates a Periodic Table Poster.
 */
export function createPeriodicTablePoster() {
    const group = new THREE.Group();

    // Poster background
    const poster = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.8, 0.01),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    group.add(poster);

    // Colored element blocks (simplified representation)
    const colors = [0xff6666, 0x66ff66, 0x6666ff, 0xffff66, 0xff66ff, 0x66ffff];
    const blockSize = 0.05;

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 18; col++) {
            const block = new THREE.Mesh(
                new THREE.BoxGeometry(blockSize, blockSize, 0.005),
                new THREE.MeshBasicMaterial({
                    color: colors[(row + col) % colors.length]
                })
            );
            block.position.set(
                -0.5 + col * (blockSize + 0.01),
                0.25 - row * (blockSize + 0.01),
                0.006
            );
            group.add(block);
        }
    }

    return group;
}

/**
 * Creates a Lab Sink.
 */
export function createLabSink() {
    const group = new THREE.Group();

    // Counter
    const counter = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.9, 0.5),
        whiteMat
    );
    counter.position.y = 0.45;
    group.add(counter);

    // Sink basin
    const basin = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.2, 0.35),
        metalMat
    );
    basin.position.set(0, 0.8, 0);
    group.add(basin);

    // Basin interior
    const basinInner = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.15, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 })
    );
    basinInner.position.set(0, 0.82, 0);
    group.add(basinInner);

    // Faucet
    const faucet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8),
        metalMat
    );
    faucet.position.set(0, 1.0, -0.15);
    group.add(faucet);

    // Faucet spout
    const spout = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8),
        metalMat
    );
    spout.rotation.x = Math.PI / 2;
    spout.position.set(0, 1.05, -0.05);
    group.add(spout);

    // Handles
    for (let i = -1; i <= 1; i += 2) {
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8),
            metalMat
        );
        handle.position.set(i * 0.12, 1.0, -0.15);
        group.add(handle);
    }

    return group;
}

/**
 * Creates a Hazmat Suit (hanging on wall).
 */
export function createHazmatSuit() {
    const group = new THREE.Group();

    // Suit body (simplified as box)
    const suitMat = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.15),
        suitMat
    );
    torso.position.y = 0;
    group.add(torso);

    // Hood
    const hood = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        suitMat
    );
    hood.position.y = 0.35;
    group.add(hood);

    // Face shield
    const shield = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.1, 0.02),
        glassMat
    );
    shield.position.set(0, 0.35, 0.1);
    group.add(shield);

    // Arms
    for (let i = -1; i <= 1; i += 2) {
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.4, 0.1),
            suitMat
        );
        arm.position.set(i * 0.25, -0.05, 0);
        group.add(arm);
    }

    // Hanger hook
    const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.03, 0.005, 8, 16, Math.PI),
        metalMat
    );
    hook.position.y = 0.55;
    group.add(hook);

    return group;
}
