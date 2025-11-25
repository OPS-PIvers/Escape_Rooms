console.log("main.js loaded");
import * as THREE from 'three';
import {
    loadModel
} from './modelLoader.js';
import {
    createClock
} from './prefabs/clock.js';
import {
    mat
} from './materials.js';
import {
    createBox,
    interactables
} from './utils.js';
import {
    initGame
} from './gameLogic.js';
import {
    showModal,
    closeModal,
    isInteracting,
    gameWon
} from './ui.js';
import {
    TouchControls
} from './touchControls.js';
import {
    createTouchInteractionHandler
} from './touchUtils.js';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xebe5ce);
scene.fog = new THREE.Fog(0xebe5ce, 5, 30);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3.5, 1.6, 3.5);
camera.lookAt(0, 1.4, 0);

// --- CUSTOM KEYBOARD CONTROLS ---
const controls = {
    isLocked: true
}; // Mock 'locked' state for compatibility
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;

// Movement & Look Helpers
const _vector = new THREE.Vector3();

function moveForward(distance) {
    _vector.setFromMatrixColumn(camera.matrix, 0);
    _vector.crossVectors(camera.up, _vector);
    camera.position.addScaledVector(_vector, distance);
}

function moveRight(distance) {
    _vector.setFromMatrixColumn(camera.matrix, 0);
    camera.position.addScaledVector(_vector, distance);
}


// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffdfba, 1.2);
dirLight.position.set(-10, 8, 2);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const lights = [{
    x: 2.8,
    y: 1.8,
    z: -3.2,
    col: 0xffaa00,
    int: 1.2
}, {
    x: -1,
    y: 2.0,
    z: 1.5,
    col: 0xffddaa,
    int: 0.8
}, {
    x: 3.5,
    y: 2.5,
    z: 3.5,
    col: 0xffeebb,
    int: 0.8
}];
lights.forEach(l => {
    const pl = new THREE.PointLight(l.col, l.int, 8);
    pl.position.set(l.x, l.y, l.z);
    pl.castShadow = true;
    scene.add(pl);
});

// --- ROOM ---
const roomGroup = new THREE.Group();
scene.add(roomGroup);

const tileScale = 2.5;
const roomSize = 4;
const start = -3.75;
const step = 2.5;

// Floor
for (let x = 0; x < roomSize; x++) {
    for (let z = 0; z < roomSize; z++) {
        const px = start + x * step;
        const pz = start + z * step;
        loadModel('assets/models/floorFull.glb', {
            pos: [px, 0, pz],
            scale: [tileScale, tileScale, tileScale],
            parent: roomGroup
        });
    }
}

// Walls
for (let i = 0; i < roomSize; i++) {
    const p = start + i * step;

    // Back Wall (Z=-5)
    loadModel('assets/models/wall.glb', {
        pos: [p, 0, -5],
        rot: [0, 0, 0],
        scale: [tileScale, tileScale, tileScale],
        parent: roomGroup
    });

    // Front Wall (Z=5)
    loadModel('assets/models/wall.glb', {
        pos: [p, 0, 5],
        rot: [0, Math.PI, 0],
        scale: [tileScale, tileScale, tileScale],
        parent: roomGroup
    });

    // Left Wall (X=-5) - Windows
    loadModel('assets/models/wallWindow.glb', {
        pos: [-5, 0, p],
        rot: [0, Math.PI / 2, 0],
        scale: [tileScale, tileScale, tileScale],
        parent: roomGroup
    });

    // Right Wall (X=5) - Door & Walls
    // We place the door at the second slot (index 1, Z = -1.25)
    if (i === 1) {
        loadModel('assets/models/doorway.glb', {
            pos: [5, 0, p],
            rot: [0, -Math.PI / 2, 0],
            scale: [tileScale, tileScale, tileScale],
            parent: roomGroup
        });
    } else {
        loadModel('assets/models/wall.glb', {
            pos: [5, 0, p],
            rot: [0, -Math.PI / 2, 0],
            scale: [tileScale, tileScale, tileScale],
            parent: roomGroup
        });
    }
}

// --- PROPS ---
// Physics constants for object placement
const TABLE_SURFACE_Y = 0.6;   // Adjusted: Table/desk surface height
const CABINET_TOP_Y = 0.8;     // Adjusted: Filing cabinet top height
const BOOKSHELF_HEIGHTS = [0.6, 1.2, 1.8]; // Adjusted: Bookcase shelf heights
const COFFEE_TABLE_Y = 0.35;   // Added: Coffee table surface height

// Desk
loadModel('assets/models/desk.glb', {
    pos: [0, 0, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
});
// Chair
loadModel('assets/models/chairDesk.glb', {
    pos: [0, 0, 1.5],
    rot: [0, Math.PI, 0], 
    scale: [2.5, 2.5, 2.5],
    parent: scene
});

// Shelves
loadModel('assets/models/bookcaseOpen.glb', {
    pos: [-4.5, 0, -1],
    rot: [0, Math.PI / 2, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
});
loadModel('assets/models/bookcaseClosed.glb', {
    pos: [-4.5, 0, 1],
    rot: [0, Math.PI / 2, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
});

// Computer (On Desk)
loadModel('assets/models/computerScreen.glb', {
    pos: [0, TABLE_SURFACE_Y, -0.3],
    rot: [0, Math.PI, 0],
    scale: [2.0, 2.0, 2.0],
    parent: scene
}).then(model => { model.name = "computer"; interactables.push(model); });

loadModel('assets/models/computerKeyboard.glb', {
    pos: [0, TABLE_SURFACE_Y, 0.2],
    rot: [0, Math.PI, 0],
    scale: [2.0, 2.0, 2.0],
    parent: scene
}).then(model => { model.name = "keyboard"; interactables.push(model); });

loadModel('assets/models/computerMouse.glb', {
    pos: [0.5, TABLE_SURFACE_Y, 0.2],
    rot: [0, Math.PI, 0],
    scale: [2.0, 2.0, 2.0],
    parent: scene
}).then(model => { model.name = "mouse"; interactables.push(model); });

createClock(scene);

// Books on Shelves (properly aligned to bookcase shelf heights)
// Place books on first bookcase (open)
const bookcase1Pos = [-4.5, 0, -1];
BOOKSHELF_HEIGHTS.forEach((h, index) => {
    loadModel('assets/models/books.glb', {
        pos: [bookcase1Pos[0], h, bookcase1Pos[2]],
        rot: [0, Math.PI / 2, 0],
        scale: [2.5, 2.5, 2.5],
        parent: scene
    }).then(model => {
         model.name = `book_cluster_${index + 1}`;  // 1-based naming to match gameLogic.js
         interactables.push(model);
    });
});

// Place 4th book cluster on second bookcase (closed)
const bookcase2Pos = [-4.5, 0, 1];
loadModel('assets/models/books.glb', {
    pos: [bookcase2Pos[0], BOOKSHELF_HEIGHTS[0], bookcase2Pos[2]],
    rot: [0, Math.PI / 2, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
}).then(model => {
    model.name = 'book_cluster_4';  // 4th book cluster for gameLogic.js
    interactables.push(model);
});
// Filing Cabinets (Back Wall)
const cabinetPos = [
    { x: -1.0, z: 4.6 },
    { x: 0.0, z: 4.6 },
    { x: 1.0, z: 4.6 }
];
cabinetPos.forEach((pos, i) => {
    loadModel('assets/models/kitchenCabinetDrawer.glb', {
        pos: [pos.x, 0, pos.z],
        rot: [0, Math.PI, 0],
        scale: [2.5, 2.5, 2.5],
        parent: scene
    }).then(model => {
         model.name = `filing_cabinet_${i+1}`;
         interactables.push(model);
    });
});

// Safe
const safeGroup = new THREE.Group();
safeGroup.position.set(4.0, 0, 4.2);
safeGroup.rotation.y = -Math.PI / 4;
const safeBox = createBox(0.8, 1.0, 0.8, mat.safe, 0, 0.5, 0, safeGroup, 0, 0, 0, "safe");
// Safe Details
const sDial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), new THREE.MeshStandardMaterial({
    color: 0xcccccc
}));
sDial.rotation.x = Math.PI / 2;
sDial.position.set(0, 0.2, 0.41);
safeBox.add(sDial);
createBox(0.05, 0.2, 0.05, 0xcccccc, 0.2, 0, 0.45, safeBox); // Handle
createBox(0.7, 0.9, 0.02, 0x222222, 0, 0, 0.405, safeBox); // Door seam
scene.add(safeGroup);

// Side Table
function createPaperStack(x, z, parent, stackOffset = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z); // Y is relative to parent
    // Create realistic paper stack with slight rotation variations
    for (let i = 0; i < 10; i++) {
        const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.35), mat.paper);
        paper.rotation.x = -Math.PI / 2;
        // Simple alternating rotation pattern with slight variation per stack
        const direction = (i % 2 === 0) ? 1 : -1;
        paper.rotation.z = direction * 0.05 * (i % 3) + stackOffset * 0.1;
        paper.position.y = i * 0.005;
        group.add(paper);
    }
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), new THREE.MeshBasicMaterial({
        visible: false
    }));
    hitBox.name = "papers";
    interactables.push(hitBox);
    group.add(hitBox);
    parent.add(group);
}

loadModel('assets/models/sideTable.glb', {
   pos: [-1, 0, 1.5],
   rot: [0, 0.2, 0],
   scale: [2.5, 2.5, 2.5],
   parent: scene
}).then(model => {
    createPaperStack(0, 0.65, model, 0);
    createPaperStack(-0.2, 0.7, model, 1);
});

// Lounge Area
const loungeGroup = new THREE.Group();
loungeGroup.position.set(2.5, 0, 2.5);
loungeGroup.rotation.y = -Math.PI / 4;
scene.add(loungeGroup);

loadModel('assets/models/rugRounded.glb', {
    pos: [0, 0.01, -0.5],
    scale: [3.5, 1.0, 3.5],
    parent: loungeGroup
});

// Sofa
loadModel('assets/models/loungeSofa.glb', {
    pos: [0, 0, 0],
    scale: [2.5, 2.5, 2.5],
    parent: loungeGroup
});

// Coffee Table
loadModel('assets/models/tableCoffee.glb', {
    pos: [0, 0, -1.2],
    scale: [2.5, 2.5, 2.5],
    parent: loungeGroup
}).then(model => {
    // Mug
    const mugGroup = new THREE.Group();
    mugGroup.position.set(0.2, COFFEE_TABLE_Y + 0.05, -0.1); // Use constant
    const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 16), new THREE.MeshLambertMaterial({
        color: 0xffffff
    }));
    mugBody.name = "mug";
    interactables.push(mugBody);
    mugGroup.add(mugBody);
    const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), new THREE.MeshLambertMaterial({
        color: 0xffffff
    }));
    mugHandle.position.set(0.05, 0, 0);
    mugGroup.add(mugHandle);
    model.add(mugGroup);

    // Magazines (stacked properly on table)
    const magazineGroup = new THREE.Group();
    magazineGroup.position.set(-0.2, COFFEE_TABLE_Y, 0.1); // Position stack on the table
    magazineGroup.rotation.y = -0.3;

    const magazineColors = [0xcc0000, 0x0066cc, 0xffcc00];
    const magazineOffsets = [
        { x: 0, z: 0, rot: 0 },
        { x: 0.01, z: 0.01, rot: 0.05 },
        { x: -0.01, z: 0.01, rot: -0.03 }
    ];
    const magHeight = 0.01;
    const numMagazines = 3;
    for (let i = 0; i < numMagazines; i++) {
        const offset = magazineOffsets[i];
        // Stack magazines directly on top of each other. Y is bottom of stack + half height.
        const magCenterY = (i * magHeight) + (magHeight / 2);
        const mag = createBox(0.2, magHeight, 0.28, magazineColors[i], offset.x, magCenterY, offset.z, magazineGroup);
        mag.rotation.y = offset.rot;
    }
    model.add(magazineGroup);

    // Lunchbox (on top of magazines)
    const lunchGroup = new THREE.Group();
    const lunchBoxHeight = 0.2;
    const magazineStackHeight = numMagazines * magHeight;
    // Y is magazine stack height + half lunchbox height (magazineGroup is already at table height)
    const lunchboxCenterY = magazineStackHeight + (lunchBoxHeight / 2);
    lunchGroup.position.set(magazineGroup.position.x, lunchboxCenterY, magazineGroup.position.z);
    model.add(lunchGroup);
    const lunchBody = createBox(0.3, lunchBoxHeight, 0.2, 0xff0000, 0, 0, 0, lunchGroup);
    lunchBody.name = "lunchbox";
    interactables.push(lunchBody);
    const lHandle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 4, 12), new THREE.MeshBasicMaterial({
        color: 0x333333
    }));
    lHandle.position.set(0, 0.2, 0); // Handle on top of lunchbox
    lHandle.rotation.x = Math.PI / 2;
    lunchGroup.add(lHandle);
});

// Floor Lamp
loadModel('assets/models/lampRoundFloor.glb', {
    pos: [1.0, 0, 0.5],
    scale: [2.5, 2.5, 2.5],
    parent: loungeGroup
}).then(model => {
    model.name = "lamp";
    interactables.push(model);
    // Add actual light
    const light = new THREE.PointLight(0xffeebb, 0.5, 5);
    light.position.set(0, 1.5, 0);
    model.add(light);
});

const bagGroup = new THREE.Group();
bagGroup.position.set(2.5, 0, 4.0);
bagGroup.rotation.y = 0.5;
const bagBody = createBox(0.6, 0.4, 0.15, mat.leather, 0, 0.2, 0, bagGroup);
bagBody.name = "briefcase";
interactables.push(bagBody);
createBox(0.02, 0.1, 0.1, mat.chrome, 0, 0.4, 0, bagGroup);
scene.add(bagGroup);

// Coat Rack
loadModel('assets/models/coatRackStanding.glb', {
    pos: [4.5, 0, -2.0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
}).then(model => {
    // Add Hat
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1), new THREE.MeshStandardMaterial({
        color: 0x333333
    }));
    hat.position.set(0.1, 1.7, 0);
    hat.rotation.z = 0.2;
    hat.name = "hat";
    interactables.push(hat);
    model.add(hat);
});

// --- NEW INTERACTIVE OBJECTS ---
// 1. Globe (On cabinet)
const globeGroup = new THREE.Group();
// Position at cabinet top + half of base height (0.05/2 = 0.025) so base sits on surface
globeGroup.position.set(0, CABINET_TOP_Y + 0.025, 4.6);
scene.add(globeGroup);
const gBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.05), mat.woodDark);
globeGroup.add(gBase);

// Generate Globe Texture
const globeCanvas = document.createElement('canvas');
globeCanvas.width = 512;
globeCanvas.height = 256;
const gCtx = globeCanvas.getContext('2d');
gCtx.fillStyle = '#1565c0';
gCtx.fillRect(0, 0, 512, 256); // Ocean
gCtx.fillStyle = '#43a047'; // Land
// Simplified continents approximation
// N. America
gCtx.beginPath();
gCtx.ellipse(100, 60, 40, 30, 0.5, 0, Math.PI * 2);
gCtx.fill();
// S. America
gCtx.beginPath();
gCtx.ellipse(140, 170, 30, 50, -0.2, 0, Math.PI * 2);
gCtx.fill();
// Europe/Africa
gCtx.beginPath();
gCtx.ellipse(260, 120, 50, 60, 0, 0, Math.PI * 2);
gCtx.fill();
// Asia
gCtx.beginPath();
gCtx.ellipse(360, 70, 60, 40, 0, 0, Math.PI * 2);
gCtx.fill();
// Australia
gCtx.beginPath();
gCtx.ellipse(430, 180, 25, 20, 0, 0, Math.PI * 2);
gCtx.fill();
// Antarctica
gCtx.fillStyle = '#eeeeee';
gCtx.fillRect(0, 230, 512, 26);

const globeTex = new THREE.CanvasTexture(globeCanvas);
const gSphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), new THREE.MeshPhongMaterial({
    map: globeTex
}));
gSphere.rotation.y = -1.5; // Adjust initial rotation
gSphere.position.y = 0.25;
gSphere.name = "globe";
interactables.push(gSphere);
globeGroup.add(gSphere);

// 2. Radio (Window Seat - on floor against wall)
loadModel('assets/models/radio.glb', {
    pos: [-4.2, 0, -4.2],
    rot: [0, 0.5, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
}).then(model => {
    model.name = "radio";
    interactables.push(model);
});

// 3. Laptop (On side table)
loadModel('assets/models/laptop.glb', {
    pos: [-1.2, TABLE_SURFACE_Y, 1.6],
    rot: [0, 0.5, 0],
    scale: [2.0, 2.0, 2.0],
    parent: scene
}).then(model => {
    model.name = "laptop";
    interactables.push(model);
});

// 4. Plant (Corner)
loadModel('assets/models/pottedPlant.glb', {
    pos: [-4.5, 0, -4.5],
    scale: [3.0, 3.0, 3.0],
    parent: scene
}).then(model => {
    model.name = "plant";
    interactables.push(model);
});

// 5. Trophy (On top bookcase shelf)
const trophy = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 0.3), mat.gold);
// Position at shelf height + half of trophy height (0.3/2 = 0.15) so base sits on shelf
trophy.position.set(-4.5, BOOKSHELF_HEIGHTS[2] + 0.15, 1.0);
trophy.name = "trophy";
interactables.push(trophy);
scene.add(trophy);

// 6. Trash Can (Under desk)
loadModel('assets/models/trashcan.glb', {
    pos: [2.5, 0, -2.0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
}).then(model => {
    model.name = "trash";
    interactables.push(model);

    // Crumpled Paper (positioned naturally in trash)
    const paperPositions = [
        { x: 0, y: 0.15, z: 0 },
        { x: 0.03, y: 0.22, z: 0.02 },
        { x: -0.02, y: 0.28, z: -0.03 }
    ];
    paperPositions.forEach(pos => {
        const paperBall = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat.paper);
        paperBall.position.set(pos.x, pos.y, pos.z);
        model.add(paperBall);
    });
});

// 7. Framed Picture (Right Wall)
const pictureGroup = new THREE.Group();
pictureGroup.position.set(4.9, 2.5, 2.5);
pictureGroup.rotation.y = -Math.PI / 2;
createBox(1.5, 1.0, 0.05, 0x333333, 0, 0, 0, pictureGroup); // Frame
const canvasPic = document.createElement('canvas');
canvasPic.width = 128;
canvasPic.height = 128;
const pCtx = canvasPic.getContext('2d');
pCtx.fillStyle = '#87CEEB';
pCtx.fillRect(0, 0, 128, 128);
pCtx.fillStyle = '#228B22';
pCtx.beginPath();
pCtx.moveTo(64, 20);
pCtx.lineTo(100, 100);
pCtx.lineTo(28, 100);
pCtx.fill();
const picTex = new THREE.CanvasTexture(canvasPic);
const picMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({
    map: picTex
}));
picMesh.position.z = 0.03;
picMesh.name = "picture";
interactables.push(picMesh);
pictureGroup.add(picMesh);
scene.add(pictureGroup);

// 8. Desk Lamp (On Desk)
loadModel('assets/models/lampRoundTable.glb', {
    pos: [0.8, TABLE_SURFACE_Y, -0.8],
    scale: [2.5, 2.5, 2.5],
    parent: scene
}).then(model => {
    model.name = "desk_lamp";
    interactables.push(model);
    const light = new THREE.PointLight(0xffeebb, 0.5, 3);
    light.position.set(0, 0.5, 0);
    model.add(light);
});

// 9. Cardboard Box (Corner)
loadModel('assets/models/cardboardBoxOpen.glb', {
    pos: [-4.2, 0, 4.2],
    rot: [0, 0.4, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
}).then(model => {
    model.name = "cardboard_box";
    interactables.push(model);
});

// 10. Fire Extinguisher (Near Door)
const feGroup = new THREE.Group();
feGroup.position.set(4.5, 0.0, -1.5); // On floor near wall
const feTank = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6), new THREE.MeshPhongMaterial({
    color: 0xcc0000
}));
feTank.position.y = 0.3;
feTank.name = "fire_extinguisher";
interactables.push(feTank);
feGroup.add(feTank);
createBox(0.05, 0.1, 0.05, 0x111111, 0, 0.65, 0, feGroup); // Nozzle top
scene.add(feGroup);

// --- DOOR & TIMER ---
const doorGroup = new THREE.Group();
doorGroup.position.set(5, 0, -1.25); // Aligned with doorway.glb
doorGroup.rotation.y = -Math.PI / 2;
scene.add(doorGroup);

// Door Pivot Group for hinging
const doorPivot = new THREE.Group();
doorPivot.position.set(-0.75, 1.1, 0.02); // Hinge location (left side of door)
doorGroup.add(doorPivot);

// Door Mesh (1.5 wide, centered at +0.75 relative to pivot)
createBox(1.5, 2.2, 0.05, mat.door, 0.75, 0, 0, doorPivot, 0, 0, 0, "door");

// Knob
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04), mat.chrome);
knob.position.set(1.35, 0, 0.06);
doorPivot.add(knob);

const timerGroup = new THREE.Group();
timerGroup.position.set(0, 2.6, 0.1);
doorGroup.add(timerGroup);
createBox(0.8, 0.3, 0.1, new THREE.MeshStandardMaterial({
    color: 0x111111
}), 0, 0, 0, timerGroup);
const timerCanvas = document.createElement('canvas');
timerCanvas.width = 512;
timerCanvas.height = 256;
const tCtx = timerCanvas.getContext('2d');
const timerTexture = new THREE.CanvasTexture(timerCanvas);
const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({
    map: timerTexture
}));
displayMesh.position.z = 0.06;
timerGroup.add(displayMesh);
let timeLeft = 600;
let finalTimeStr = "00:00";

function updateTimer(dt) {
    if (!gameWon) timeLeft = Math.max(0, timeLeft - dt);
    const m = Math.floor(timeLeft / 60);
    const s = Math.floor(timeLeft % 60);
    finalTimeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const timeStr = finalTimeStr;

    // Background
    tCtx.fillStyle = '#050505';
    tCtx.fillRect(0, 0, 512, 256);

    // Scanlines
    tCtx.fillStyle = 'rgba(0, 255, 0, 0.05)';
    for (let i = 0; i < 256; i += 4) tCtx.fillRect(0, i, 512, 1);

    // Glow & Text
    tCtx.shadowColor = "#ff0000";
    tCtx.shadowBlur = 30;
    tCtx.fillStyle = '#ff3333';
    tCtx.font = 'bold 140px "Share Tech Mono", monospace';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(timeStr, 256, 128);

    // Border
    tCtx.strokeStyle = "#550000";
    tCtx.lineWidth = 10;
    tCtx.strokeRect(5, 5, 502, 246);

    timerTexture.needsUpdate = true;
}

// --- LOGIC ---
const crosshair = document.getElementById('crosshair');
const raycaster = new THREE.Raycaster();

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- TOUCH CONTROLS (MOBILE) ---
let touchControls;
// Create touch interaction handler using shared utility
const handleTouchInteract = createTouchInteractionHandler({
    showModal,
    get isInteracting() { return isInteracting; },
    getContext: () => ({ doorPivot, finalTimeStr })
});
// Initialize after DOM is ready and we have doorPivot reference
// Will be initialized at the end of the script

// --- INPUT HANDLING ---
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    Space: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = true;
        keys[e.code] = true; // Handle both key and code for safety
    }
    // Space Interaction
    if ((e.code === 'Space' || e.key === ' ')) {
        if (isInteracting && modal.style.display === 'block') {
            closeModal();
        } else if (!isInteracting) {
            // Use existing mouse raycast logic
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);
            if (intersects.length > 0) {
                showModal(intersects[0].object.name);
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = false;
        keys[e.code] = false;
    }
});

// Instructions Handling
const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => {
    instructions.style.display = 'none';
    isInteracting = false;
});

// --- MOUSE INTERACTION ---
const mouse = new THREE.Vector2();

document.addEventListener('mousemove', (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Move Custom Cursor (Crosshair)
    if (!isInteracting) {
        crosshair.style.left = event.clientX + 'px';
        crosshair.style.top = event.clientY + 'px';
    }
});

document.addEventListener('click', (event) => {
    if (isInteracting) return;

    // Raycast from mouse position
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
        showModal(intersects[0].object.name, {
            doorPivot: doorPivot,
            finalTimeStr: finalTimeStr
        });
    }
});

function setGameCursor(active) {
    if (active) {
        document.body.classList.add('game-active');
        // Ensure crosshair tracks mouse immediately if possible, or stays at last known pos
    } else {
        document.body.classList.remove('game-active');
    }
}

// --- ANIMATION LOOP ---
let prevTime = performance.now();

// Rotation Parameters
let lookSpeed = 1.5;
let moveSpeed = 3.0;
let minPolarAngle = 0.5; // ~30 deg
let maxPolarAngle = 2.5; // ~150 deg

function animate() {
    try {
        requestAnimationFrame(animate);
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        prevTime = time;

        if (gameWon) {
            const startRot = doorPivot.rotation.y;
            const targetRot = -Math.PI / 2;
            const duration = 2000;
            const t = Math.min(delta / (duration / 1000), 1);
            const ease = 1 - Math.pow(1 - t, 3);
            doorPivot.rotation.y = startRot + (targetRot - startRot) * ease;
        }
        updateTimer(delta);

        // Cursor State Management
        if (!isInteracting && instructions.style.display === 'none') {
            setGameCursor(true);
        } else {
            setGameCursor(false);
        }

        if (!isInteracting) {
            // Crosshair / Logic Update
            // Use MOUSE position for raycasting now, as the crosshair follows the mouse
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);

            if (intersects.length > 0) {
                crosshair.classList.add('active');
                // document.body.style.cursor = 'pointer'; // Handled by custom cursor style
            } else {
                crosshair.classList.remove('active');
                // document.body.style.cursor = 'none';
            }

            // --- LOOK (ARROWS + TOUCH DRAG) ---
            _euler.setFromQuaternion(camera.quaternion);

            // Keyboard: Yaw (Left/Right Arrows)
            if (keys.ArrowLeft) _euler.y += lookSpeed * delta;
            if (keys.ArrowRight) _euler.y -= lookSpeed * delta;

            // Keyboard: Pitch (Up/Down Arrows)
            if (keys.ArrowUp) _euler.x += lookSpeed * delta;
            if (keys.ArrowDown) _euler.x -= lookSpeed * delta;

            // Touch: Camera look delta
            if (touchControls) {
                const lookDelta = touchControls.getLookDelta();
                _euler.y -= lookDelta.x * 2; // Horizontal look
                _euler.x -= lookDelta.y * 2; // Vertical look
            }

            // Clamp Pitch
            _euler.x = Math.max(_PI_2 - maxPolarAngle, Math.min(_PI_2 - minPolarAngle, _euler.x));
            camera.quaternion.setFromEuler(_euler);

            // --- MOVE (WASD + TOUCH JOYSTICK) ---
            const actualSpeed = moveSpeed * delta;

            // Keyboard movement
            if (keys.w || keys.KeyW) moveForward(actualSpeed);
            if (keys.s || keys.KeyS) moveForward(-actualSpeed);
            if (keys.a || keys.KeyA) moveRight(-actualSpeed);
            if (keys.d || keys.KeyD) moveRight(actualSpeed);

            // Touch joystick movement
            if (touchControls) {
                const moveState = touchControls.getMovement();
                if (moveState.forward) moveForward(actualSpeed);
                if (moveState.backward) moveForward(-actualSpeed);
                if (moveState.left) moveRight(-actualSpeed);
                if (moveState.right) moveRight(actualSpeed);
            }

            // Bounds
            const pos = camera.position;
            if (pos.x < -4.5) pos.x = -4.5;
            if (pos.x > 4.5) pos.x = 4.5;
            if (pos.z < -4.5) pos.z = -4.5;
            if (pos.z > 4.5) pos.z = 4.5;
        }

        renderer.render(scene, camera);
    } catch (error) {
        console.error("Animation loop error:", error);
    }
}
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose for verification
window.camera = camera;
window.scene = scene;
window.renderer = renderer;

// Initialize touch controls after all scene objects are ready
touchControls = new TouchControls(camera, raycaster, interactables, handleTouchInteract);

initGame();
animate();