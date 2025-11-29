import * as THREE from 'three';

// Materials
const mats = {
    woodDark: new THREE.MeshStandardMaterial({ color: 0x3d2f1f, roughness: 0.8 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0x8f6a4e, roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.4 }),
    blackPlastic: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }),
    greyPlastic: new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.5 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 }),
    screenGlow: new THREE.MeshBasicMaterial({ color: 0x223344 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9 }),
    bookRed: new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.8 }),
    bookBlue: new THREE.MeshStandardMaterial({ color: 0x2222aa, roughness: 0.8 }),
    bookGreen: new THREE.MeshStandardMaterial({ color: 0x22aa22, roughness: 0.8 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.8 }),
    pot: new THREE.MeshStandardMaterial({ color: 0xaa6633, roughness: 0.9 }),
    white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3, metalness: 0.9, roughness: 0.1 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0x4444cc, roughness: 1.0 }),
    cushion: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1.0 })
};

/**
 * Helper to create a simple mesh
 */
function mesh(geo, mat, x=0, y=0, z=0, rx=0, ry=0, rz=0, sx=1, sy=1, sz=1) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
const sphGeo = new THREE.SphereGeometry(1, 16, 16);

// --- Object Generators ---

function genDesk() {
    const group = new THREE.Group();
    // Top
    group.add(mesh(boxGeo, mats.woodDark, 0, 0.73, 0, 0, 0, 0, 1.6, 0.05, 0.8));
    // Legs
    const legW = 0.05;
    const legH = 0.7;
    const legX = 1.6/2 - 0.1;
    const legZ = 0.8/2 - 0.1;
    group.add(mesh(boxGeo, mats.metal, -legX, legH/2, -legZ, 0,0,0, legW, legH, legW));
    group.add(mesh(boxGeo, mats.metal, legX, legH/2, -legZ, 0,0,0, legW, legH, legW));
    group.add(mesh(boxGeo, mats.metal, -legX, legH/2, legZ, 0,0,0, legW, legH, legW));
    group.add(mesh(boxGeo, mats.metal, legX, legH/2, legZ, 0,0,0, legW, legH, legW));
    return group;
}

function genChair() {
    const group = new THREE.Group();
    // Seat
    group.add(mesh(boxGeo, mats.cushion, 0, 0.45, 0, 0,0,0, 0.45, 0.05, 0.45));
    // Back
    group.add(mesh(boxGeo, mats.cushion, 0, 0.75, -0.2, 0,0,0, 0.4, 0.4, 0.05));
    // Legs
    const legH = 0.42;
    const legW = 0.04;
    const d = 0.18;
    group.add(mesh(boxGeo, mats.metal, -d, legH/2, -d, 0,0,0, legW, legH, legW));
    group.add(mesh(boxGeo, mats.metal, d, legH/2, -d, 0,0,0, legW, legH, legW));
    group.add(mesh(boxGeo, mats.metal, -d, legH/2, d, 0,0,0, legW, legH, legW));
    group.add(mesh(boxGeo, mats.metal, d, legH/2, d, 0,0,0, legW, legH, legW));
    return group;
}

function genComputerScreen() {
    const group = new THREE.Group();
    // Base
    group.add(mesh(boxGeo, mats.blackPlastic, 0, 0.01, 0, 0,0,0, 0.2, 0.02, 0.15));
    // Stand
    group.add(mesh(boxGeo, mats.blackPlastic, 0, 0.15, -0.05, -0.2,0,0, 0.05, 0.3, 0.02));
    // Screen Frame
    group.add(mesh(boxGeo, mats.blackPlastic, 0, 0.35, 0, 0,0,0, 0.6, 0.35, 0.03));
    // Screen
    group.add(mesh(boxGeo, mats.screenGlow, 0, 0.35, 0.016, 0,0,0, 0.55, 0.3, 0.01));
    return group;
}

function genKeyboard() {
    return mesh(boxGeo, mats.blackPlastic, 0, 0.01, 0, 0.1,0,0, 0.45, 0.02, 0.15);
}

function genMouse() {
    return mesh(boxGeo, mats.blackPlastic, 0, 0.015, 0, 0,0,0, 0.06, 0.03, 0.1);
}

function genBookcaseOpen() {
    const group = new THREE.Group();
    const w = 0.8, h = 1.8, d = 0.3;
    const thick = 0.02;
    // Sides
    group.add(mesh(boxGeo, mats.woodLight, -w/2+thick/2, h/2, 0, 0,0,0, thick, h, d));
    group.add(mesh(boxGeo, mats.woodLight, w/2-thick/2, h/2, 0, 0,0,0, thick, h, d));
    // Back
    group.add(mesh(boxGeo, mats.woodLight, 0, h/2, -d/2+thick/2, 0,0,0, w, h, thick));
    // Shelves (Bottom, 4 Middle, Top)
    const shelves = [0.05, 0.4, 0.8, 1.2, 1.6, 1.8-thick/2];
    shelves.forEach(y => {
        group.add(mesh(boxGeo, mats.woodLight, 0, y, 0, 0,0,0, w, thick, d));
    });
    return group;
}

function genBooks() {
    const group = new THREE.Group();
    const colors = [mats.bookRed, mats.bookBlue, mats.bookGreen];
    // Use a fixed seed-like behavior by using index
    for(let i=0; i<5; i++) {
        // Pseudorandom based on i
        const r1 = (Math.sin(i * 12.34) + 1) / 2;
        const r2 = (Math.cos(i * 56.78) + 1) / 2;

        const h = 0.2 + r1 * 0.05;
        const thick = 0.03 + r2 * 0.02;
        const color = colors[i % colors.length];
        group.add(mesh(boxGeo, color, i * 0.06 - 0.12, h/2, 0, 0,0,0, thick, h, 0.18));
    }
    return group;
}

function genPlantSmall() {
    const group = new THREE.Group();
    // Pot
    group.add(mesh(cylGeo, mats.pot, 0, 0.1, 0, 0,0,0, 0.1, 0.2, 0.08));
    // Leaves (Cluster of spheres/cubes)
    group.add(mesh(sphGeo, mats.leaf, 0, 0.25, 0, 0,0,0, 0.15, 0.15, 0.15));
    return group;
}

function genRadio() {
    const group = new THREE.Group();
    // Body
    group.add(mesh(boxGeo, mats.woodDark, 0, 0.1, 0, 0,0,0, 0.3, 0.2, 0.1));
    // Speaker grill
    group.add(mesh(boxGeo, mats.metal, -0.08, 0.1, 0.051, 0,0,0, 0.1, 0.15, 0.01));
    // Knobs
    group.add(mesh(cylGeo, mats.blackPlastic, 0.08, 0.15, 0.05, Math.PI/2,0,0, 0.02, 0.02, 0.02));
    group.add(mesh(cylGeo, mats.blackPlastic, 0.08, 0.08, 0.05, Math.PI/2,0,0, 0.02, 0.02, 0.02));
    // Antenna
    group.add(mesh(cylGeo, mats.metal, 0.12, 0.3, -0.04, 0,0,0.2, 0.005, 0.4, 0.005));
    return group;
}

function genDoorway() {
    // Simple frame
    const group = new THREE.Group();
    const w = 1.2, h = 2.2, d = 0.15;
    const thick = 0.1;
    // Top
    group.add(mesh(boxGeo, mats.white, 0, h - thick/2, 0, 0,0,0, w, thick, d));
    // Sides
    group.add(mesh(boxGeo, mats.white, -w/2 + thick/2, h/2, 0, 0,0,0, thick, h, d));
    group.add(mesh(boxGeo, mats.white, w/2 - thick/2, h/2, 0, 0,0,0, thick, h, d));
    return group;
}

function genFloor(type) {
    // Return standard floor for all types currently to ensure coverage
    return mesh(boxGeo, mats.woodDark, 0, 0, 0, 0,0,0, 1, 0.1, 1);
}

/**
 * Generates a wall segment.
 * @param {string} type - The type of wall to generate (e.g., 'wallWindow', 'wallDoorway', 'wallCorner').
 */
function genWall(type) {
    const group = new THREE.Group();
    const wallWidth = 1, wallHeight = 3, wallDepth = 0.1;

    if (type && type.includes('Window')) {
       // Wall with a window (simple rectangular hole simulated by frame)
       // For simplicity, add a window mesh in the wall
       group.add(mesh(boxGeo, mats.white, 0, 1.5, 0, 0,0,0, wallWidth, wallHeight, wallDepth));
       const windowWidth = 0.6, windowHeight = 1.2;
       group.add(mesh(boxGeo, mats.greyPlastic, 0, 1.5, wallDepth/2 + 0.01, 0,0,0, windowWidth, windowHeight, 0.02));
    } else if (type && type.includes('Doorway')) {
       // Wall with a doorway (simple rectangular hole at bottom)
       // Left part
       group.add(mesh(boxGeo, mats.white, -0.35, 1.5, 0, 0,0,0, 0.3, wallHeight, wallDepth));
       // Right part
       group.add(mesh(boxGeo, mats.white, 0.35, 1.5, 0, 0,0,0, 0.3, wallHeight, wallDepth));
       // Top part
       group.add(mesh(boxGeo, mats.white, 0, 2.6, 0, 0,0,0, 0.4, 0.8, wallDepth));
    } else if (type && type.includes('Corner')) {
       // L-shaped corner wall
       group.add(mesh(boxGeo, mats.white, -0.45, 1.5, 0, 0,0,0, 0.1, wallHeight, wallDepth));
       group.add(mesh(boxGeo, mats.white, 0, 1.5, -0.45, 0,0,0, wallWidth, wallHeight, 0.1));
    } else {
       // Plain wall
       group.add(mesh(boxGeo, mats.white, 0, 1.5, 0, 0,0,0, wallWidth, wallHeight, wallDepth));
    }
    return group;
}

function genLamp(type) {
    const group = new THREE.Group();

    if (type && type.includes('SquareTable')) {
        // Square table lamp: box base, short stem, square shade
        group.add(mesh(boxGeo, mats.metal, 0, 0.03, 0, 0,0,0, 0.12, 0.06, 0.12)); // base
        group.add(mesh(cylGeo, mats.metal, 0, 0.15, 0, 0,0,0, 0.02, 0.18, 0.02)); // stem
        group.add(mesh(boxGeo, mats.paper, 0, 0.28, 0, 0,0,0, 0.16, 0.12, 0.16)); // shade
    } else if (type && type.includes('RoundFloor')) {
        // Tall floor lamp: round base, tall stem, round shade
        group.add(mesh(cylGeo, mats.metal, 0, 0.02, 0, 0,0,0, 0.14, 0.04, 0.14)); // base
        group.add(mesh(cylGeo, mats.metal, 0, 0.55, 0, 0,0,0, 0.03, 1.0, 0.03)); // stem
        group.add(mesh(cylGeo, mats.paper, 0, 1.1, 0, 0,0,0, 0.22, 0.18, 0.22)); // shade
    } else if (type && type.includes('Wall')) {
        // Wall lamp: short arm, wall mount, small shade
        group.add(mesh(boxGeo, mats.metal, 0, 0.15, -0.08, 0,0,0, 0.06, 0.3, 0.06)); // wall mount
        group.add(mesh(cylGeo, mats.metal, 0, 0.3, -0.08, Math.PI/2,0,0, 0.015, 0.12, 0.015)); // arm
        group.add(mesh(cylGeo, mats.paper, 0, 0.3, 0.02, 0,0,0, 0.07, 0.09, 0.07)); // shade
    } else {
        // Default lamp: original design
        group.add(mesh(cylGeo, mats.metal, 0, 0.02, 0, 0,0,0, 0.1, 0.04, 0.1)); // base
        group.add(mesh(cylGeo, mats.metal, 0, 0.25, 0, 0,0,0, 0.02, 0.5, 0.02)); // stem
        group.add(mesh(cylGeo, mats.paper, 0, 0.5, 0, 0,0,0, 0.15, 0.2, 0.15)); // shade
    }

    return group;
}

function genCouch() {
     const group = new THREE.Group();
     // Base
     group.add(mesh(boxGeo, mats.cushion, 0, 0.2, 0, 0,0,0, 1.8, 0.2, 0.8));
     // Back
     group.add(mesh(boxGeo, mats.cushion, 0, 0.5, -0.3, 0,0,0, 1.8, 0.5, 0.2));
     // Arms
     group.add(mesh(boxGeo, mats.cushion, -0.8, 0.35, 0, 0,0,0, 0.2, 0.4, 0.8));
     group.add(mesh(boxGeo, mats.cushion, 0.8, 0.35, 0, 0,0,0, 0.2, 0.4, 0.8));
     return group;
}

// Fallback for unknown items
function genFallback(name) {
    const group = new THREE.Group();
    // Debug mesh: Wireframe to indicate missing/fallback object
    const m = mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }), 0, 0.5, 0);
    group.add(m);
    return group;
}

// Main Registry
const generators = {
    'desk': genDesk,
    'chair': genChair,
    'computerscreen': genComputerScreen,
    'computerkeyboard': genKeyboard,
    'computermouse': genMouse,
    'bookcaseopen': genBookcaseOpen,
    'books': genBooks,
    'plantsmall1': genPlantSmall,
    'plantsmall2': genPlantSmall,
    'plantsmall3': genPlantSmall,
    'radio': genRadio,
    'doorway': genDoorway,
    'lamgroundtable': genLamp,
    'loungesofa': genCouch,
    'floor': genFloor,
    'wall': genWall
};

/**
 * Main function to generate a procedural object by name/type.
 * Matches broadly against the type string.
 */
export function generateProceduralObject(type) {
    // Normalization should typically be done by caller, but we handle basic cleanup here
    const key = type.toLowerCase().replace('.glb', '').replace(/_/g, '');

    // Pass original type string to generators if they need specific details (like 'wallWindow')
    if (key.includes('wall')) return genWall(type);
    if (key.includes('lamp')) return genLamp(type);
    if (key.includes('floor')) return genFloor(type);

    // Exact match or prefix match
    if (generators[key]) return generators[key]();

    // Fuzzy matching
    if (key.includes('chair')) return genChair();
    if (key.includes('desk')) return genDesk();
    if (key.includes('bookcase')) return genBookcaseOpen();
    if (key.includes('plant')) return genPlantSmall();
    if (key.includes('sofa') || key.includes('couch')) return genCouch();
    if (key.includes('door')) return genDoorway();
    if (key.includes('screen') || key.includes('monitor')) return genComputerScreen();
    if (key.includes('keyboard')) return genKeyboard();
    if (key.includes('mouse')) return genMouse();
    if (key.includes('radio')) return genRadio();
    if (key.includes('book')) return genBooks();

    console.warn(`No procedural generator for: ${type}, using fallback.`);
    return genFallback(type);
}
