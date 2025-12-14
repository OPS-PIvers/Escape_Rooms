/**
 * science_lab.js
 * Main entry point for the Science Lab Escape Room.
 * Production-quality implementation using RoomEngine architecture.
 */

console.log("science_lab.js loaded");

import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import { showModal, closeModal, initInventoryUI, isInteracting } from './ui.js';
import { WALL_HEIGHT, CAMERA_HEIGHT } from './constants.js';
import * as LabPrefabs from './lab_prefabs.js';
import * as Prefabs from './prefabs.js';
import { addItem, removeItem, getSelectedItem, hasItem, selectSlot, inventory } from './inventory.js';

// Room Configuration
const LAB_WIDTH = 12;
const LAB_DEPTH = 12;
const WALL_THICKNESS = 0.5;

// Lab-specific constants
const LAB_TABLE_HEIGHT = 0.9;
const FUME_HOOD_HEIGHT = 2.2;

// Lab State
const labState = {
    // Chemicals collected
    hasRedChemical: false,
    hasBlueChemical: false,
    hasGreenChemical: false,
    hasYellowChemical: false,

    // Mixing progress
    mixedChemicals: [],
    correctFormula: ['red', 'blue', 'green'], // The correct order

    // Puzzle progression
    bunsenBurnerOn: false,
    reactionComplete: false,
    safeUnlocked: false,
    hasKeycard: false,

    // Discovered clues
    foundFormulaHint: false,
    foundSafeCode: false,
    safeCode: '2731',

    // Equipment states
    microscopeViewed: false,
    centrifugeRunning: false,
    fridgeOpened: false,

    // Attempts tracking
    mixingAttempts: 3,
    safeAttempts: 3
};

// Materials for the lab
const materials = {
    wall: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }), // Clean white
    floor: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.1 }), // Lab tile
    ceiling: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
    labTable: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.1 }), // Black resin
    metal: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.9 }),
    cabinetWhite: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 })
};

// Build the science lab scene
async function buildLabScene(engine) {
    const scene = engine.scene;
    const halfWidth = LAB_WIDTH / 2;
    const halfDepth = LAB_DEPTH / 2;

    // Custom darker background for lab atmosphere
    scene.background = new THREE.Color(0x1a2030);
    scene.fog = new THREE.Fog(0x1a2030, 3, 18);

    // ===== ROOM STRUCTURE =====

    // Floor (tiled look)
    const floorGeometry = new THREE.PlaneGeometry(LAB_WIDTH, LAB_DEPTH, 12, 12);
    const floor = new THREE.Mesh(floorGeometry, materials.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add floor grid lines for tile effect
    const gridHelper = new THREE.GridHelper(LAB_WIDTH, 12, 0x666666, 0x444444);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(LAB_WIDTH, LAB_DEPTH),
        materials.ceiling
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    scene.add(ceiling);

    // Ceiling lights (fluorescent panels)
    createCeilingLights(scene, LAB_WIDTH, LAB_DEPTH);

    // Walls
    // North wall (Z = -halfDepth) - With door opening
    const doorW = 1.2;
    const doorH = 2.2;
    const sideWidth = (LAB_WIDTH - doorW) / 2;
    const lintelHeight = WALL_HEIGHT - doorH;

    const wallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(sideWidth, WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    wallLeft.position.set(-(doorW/2 + sideWidth/2), WALL_HEIGHT/2, -halfDepth);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    const wallRight = new THREE.Mesh(
        new THREE.BoxGeometry(sideWidth, WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    wallRight.position.set((doorW/2 + sideWidth/2), WALL_HEIGHT/2, -halfDepth);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, lintelHeight, WALL_THICKNESS),
        materials.wall
    );
    lintel.position.set(0, doorH + lintelHeight/2, -halfDepth);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    scene.add(lintel);

    // South Wall
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(LAB_WIDTH, WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    southWall.position.set(0, WALL_HEIGHT/2, halfDepth);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);

    // East Wall
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, LAB_DEPTH),
        materials.wall
    );
    eastWall.position.set(halfWidth, WALL_HEIGHT/2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // West Wall
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, LAB_DEPTH),
        materials.wall
    );
    westWall.position.set(-halfWidth, WALL_HEIGHT/2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);

    // ===== LAB EQUIPMENT & FURNITURE =====

    // --- CENTRAL WORKBENCH (Island) ---
    const centerTable = LabPrefabs.createLabTable(3.0, 1.5);
    centerTable.position.set(0, 0, 0);
    centerTable.name = "center_workbench";
    scene.add(centerTable);

    // Bunsen Burner on center table
    const bunsenBurner = LabPrefabs.createBunsenBurner();
    bunsenBurner.position.set(-0.5, LAB_TABLE_HEIGHT, 0);
    bunsenBurner.name = "bunsen_burner";
    engine.interactables.push(bunsenBurner);
    scene.add(bunsenBurner);

    // Mixing Beaker (empty) on center table
    const mixingBeaker = LabPrefabs.createMixingBeaker();
    mixingBeaker.position.set(0.3, LAB_TABLE_HEIGHT, 0);
    mixingBeaker.name = "mixing_beaker";
    engine.interactables.push(mixingBeaker);
    scene.add(mixingBeaker);

    // Test tube rack on center table
    const testTubeRack = LabPrefabs.createTestTubeRack();
    testTubeRack.position.set(0.8, LAB_TABLE_HEIGHT, -0.3);
    testTubeRack.name = "test_tube_rack";
    engine.interactables.push(testTubeRack);
    scene.add(testTubeRack);

    // Lab notebook on center table
    const labNotebook = LabPrefabs.createLabNotebook();
    labNotebook.position.set(-0.8, LAB_TABLE_HEIGHT, 0.4);
    labNotebook.name = "lab_notebook";
    engine.interactables.push(labNotebook);
    scene.add(labNotebook);

    // --- FUME HOOD (North wall, left of door) ---
    const fumeHood = LabPrefabs.createFumeHood();
    fumeHood.position.set(-halfWidth + 2, 0, -halfDepth + 0.8);
    fumeHood.name = "fume_hood";
    engine.interactables.push(fumeHood);
    scene.add(fumeHood);

    // Green chemical inside fume hood
    const greenChemical = LabPrefabs.createChemicalFlask('green');
    greenChemical.position.set(-halfWidth + 2, 1.1, -halfDepth + 0.9);
    greenChemical.name = "chemical_green";
    engine.interactables.push(greenChemical);
    scene.add(greenChemical);

    // --- MICROSCOPE STATION (East wall) ---
    const microscopeTable = LabPrefabs.createLabTable(1.5, 0.8);
    microscopeTable.position.set(halfWidth - 0.6, 0, -2);
    microscopeTable.rotation.y = -Math.PI / 2;
    scene.add(microscopeTable);

    const microscope = LabPrefabs.createMicroscope();
    microscope.position.set(halfWidth - 0.6, LAB_TABLE_HEIGHT, -2);
    microscope.rotation.y = -Math.PI / 2;
    microscope.name = "microscope";
    engine.interactables.push(microscope);
    scene.add(microscope);

    // Petri dishes near microscope
    const petriDish1 = LabPrefabs.createPetriDish();
    petriDish1.position.set(halfWidth - 0.6, LAB_TABLE_HEIGHT, -1.5);
    petriDish1.name = "petri_dish";
    engine.interactables.push(petriDish1);
    scene.add(petriDish1);

    // --- CHEMICAL STORAGE (West wall) ---
    const chemicalCabinet = LabPrefabs.createChemicalCabinet();
    chemicalCabinet.position.set(-halfWidth + 0.4, 0, 0);
    chemicalCabinet.rotation.y = Math.PI / 2;
    chemicalCabinet.name = "chemical_cabinet";
    engine.interactables.push(chemicalCabinet);
    scene.add(chemicalCabinet);

    // Red chemical on storage shelf
    const redChemical = LabPrefabs.createChemicalFlask('red');
    redChemical.position.set(-halfWidth + 0.5, 1.2, -0.3);
    redChemical.name = "chemical_red";
    engine.interactables.push(redChemical);
    scene.add(redChemical);

    // Blue chemical on storage shelf
    const blueChemical = LabPrefabs.createChemicalFlask('blue');
    blueChemical.position.set(-halfWidth + 0.5, 1.2, 0.3);
    blueChemical.name = "chemical_blue";
    engine.interactables.push(blueChemical);
    scene.add(blueChemical);

    // --- REFRIGERATOR (West wall, south) ---
    const labFridge = LabPrefabs.createLabFridge();
    labFridge.position.set(-halfWidth + 0.5, 0, 3);
    labFridge.rotation.y = Math.PI / 2;
    labFridge.name = "lab_fridge";
    engine.interactables.push(labFridge);
    scene.add(labFridge);

    // Yellow chemical inside fridge (hidden puzzle)
    const yellowChemical = LabPrefabs.createChemicalFlask('yellow');
    yellowChemical.position.set(-halfWidth + 0.6, 0.8, 3);
    yellowChemical.name = "chemical_yellow";
    yellowChemical.visible = false; // Hidden until fridge is opened
    engine.interactables.push(yellowChemical);
    scene.add(yellowChemical);

    // --- COMPUTER WORKSTATION (East wall, south) ---
    const computerDesk = LabPrefabs.createLabTable(1.5, 0.8);
    computerDesk.position.set(halfWidth - 0.6, 0, 2);
    computerDesk.rotation.y = -Math.PI / 2;
    scene.add(computerDesk);

    const labComputer = LabPrefabs.createLabComputer();
    labComputer.position.set(halfWidth - 0.6, LAB_TABLE_HEIGHT, 2);
    labComputer.rotation.y = -Math.PI / 2;
    labComputer.name = "lab_computer";
    engine.interactables.push(labComputer);
    scene.add(labComputer);

    // --- CENTRIFUGE (South wall) ---
    const centrifuge = LabPrefabs.createCentrifuge();
    centrifuge.position.set(2, LAB_TABLE_HEIGHT - 0.2, halfDepth - 1);
    centrifuge.rotation.y = Math.PI;
    centrifuge.name = "centrifuge";
    engine.interactables.push(centrifuge);
    scene.add(centrifuge);

    // Lab counter along south wall
    const southCounter = LabPrefabs.createLabCounter(4, 0.6);
    southCounter.position.set(0, 0, halfDepth - 0.5);
    southCounter.rotation.y = Math.PI;
    scene.add(southCounter);

    // --- SAFE (hidden behind equipment panel) ---
    const safe = LabPrefabs.createLabSafe();
    safe.position.set(halfWidth - 0.5, 0, -4);
    safe.rotation.y = -Math.PI / 2;
    safe.name = "lab_safe";
    engine.interactables.push(safe);
    scene.add(safe);

    // --- BIOHAZARD CONTAINER ---
    const biohazardBin = LabPrefabs.createBiohazardContainer();
    biohazardBin.position.set(-2, 0, halfDepth - 1);
    biohazardBin.name = "biohazard_bin";
    engine.interactables.push(biohazardBin);
    scene.add(biohazardBin);

    // --- WHITEBOARD (East wall) ---
    const whiteboard = LabPrefabs.createLabWhiteboard(2.5, 1.5);
    whiteboard.position.set(halfWidth - 0.1, 1.8, 0);
    whiteboard.rotation.y = -Math.PI / 2;
    whiteboard.name = "whiteboard";
    engine.interactables.push(whiteboard);
    scene.add(whiteboard);

    // --- EMERGENCY SHOWER (Northwest corner) ---
    const emergencyShower = LabPrefabs.createEmergencyShower();
    emergencyShower.position.set(-halfWidth + 0.5, 0, -halfDepth + 0.5);
    emergencyShower.name = "emergency_shower";
    engine.interactables.push(emergencyShower);
    scene.add(emergencyShower);

    // --- EYE WASH STATION ---
    const eyeWash = LabPrefabs.createEyeWashStation();
    eyeWash.position.set(halfWidth - 0.5, 1.0, -halfDepth + 0.5);
    eyeWash.rotation.y = Math.PI;
    eyeWash.name = "eyewash_station";
    engine.interactables.push(eyeWash);
    scene.add(eyeWash);

    // --- FIRE EXTINGUISHER ---
    const fireExtinguisher = Prefabs.createFireExtinguisher();
    fireExtinguisher.position.set(halfWidth - 0.2, 1.2, halfDepth - 2);
    fireExtinguisher.name = "fire_extinguisher";
    engine.interactables.push(fireExtinguisher);
    scene.add(fireExtinguisher);

    // --- FIRST AID KIT ---
    const firstAidKit = LabPrefabs.createFirstAidKit();
    firstAidKit.position.set(-halfWidth + 0.15, 1.5, -2);
    firstAidKit.rotation.y = Math.PI / 2;
    firstAidKit.name = "first_aid_kit";
    engine.interactables.push(firstAidKit);
    scene.add(firstAidKit);

    // --- LAB STOOL ---
    const labStool1 = LabPrefabs.createLabStool();
    labStool1.position.set(-1, 0, 1);
    scene.add(labStool1);

    const labStool2 = LabPrefabs.createLabStool();
    labStool2.position.set(1, 0, 1);
    scene.add(labStool2);

    // --- PERIODIC TABLE POSTER ---
    const periodicTable = LabPrefabs.createPeriodicTablePoster();
    periodicTable.position.set(2, 1.8, halfDepth - 0.1);
    periodicTable.rotation.y = Math.PI;
    periodicTable.name = "periodic_table";
    engine.interactables.push(periodicTable);
    scene.add(periodicTable);

    // --- SINK ---
    const sink = LabPrefabs.createLabSink();
    sink.position.set(-3, 0, halfDepth - 0.5);
    sink.rotation.y = Math.PI;
    sink.name = "lab_sink";
    engine.interactables.push(sink);
    scene.add(sink);

    // --- HAZMAT SUIT (hint/decoration) ---
    const hazmatSuit = LabPrefabs.createHazmatSuit();
    hazmatSuit.position.set(-halfWidth + 0.3, 1.5, 5);
    hazmatSuit.rotation.y = Math.PI / 2;
    hazmatSuit.name = "hazmat_suit";
    engine.interactables.push(hazmatSuit);
    scene.add(hazmatSuit);

    console.log(`Lab scene loaded: ${engine.interactables.length} interactable objects`);

    return {
        engine,
        bunsenBurner,
        mixingBeaker,
        greenChemical,
        redChemical,
        blueChemical,
        yellowChemical,
        labFridge
    };
}

// Create fluorescent ceiling lights
function createCeilingLights(scene, width, depth) {
    const lightGeometry = new THREE.BoxGeometry(0.3, 0.05, 1.5);
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const positions = [
        [-2, 2.95, -3],
        [2, 2.95, -3],
        [-2, 2.95, 0],
        [2, 2.95, 0],
        [-2, 2.95, 3],
        [2, 2.95, 3]
    ];

    positions.forEach(pos => {
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(...pos);
        scene.add(light);

        // Add actual point light
        const pointLight = new THREE.PointLight(0xccddff, 0.4, 8);
        pointLight.position.set(pos[0], pos[1] - 0.1, pos[2]);
        scene.add(pointLight);
    });
}

// Lab-specific interaction handler
function handleLabInteraction(name, obj, labData) {
    const modal = document.getElementById('clueModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');
    const modalFeedback = document.getElementById('modalFeedback');

    // Clear previous content
    optionsContainer.innerHTML = '';
    modalFeedback.textContent = '';
    modalFeedback.style.color = '';

    // === DOOR ===
    if (name === 'door') {
        if (labState.hasKeycard) {
            // Victory!
            triggerVictory();
        } else {
            modalTitle.textContent = 'SECURITY DOOR';
            modalContent.innerHTML = `
                <p>The door is sealed with an electronic lock.</p>
                <p style="color: #e57373;">KEYCARD REQUIRED</p>
                <p style="font-size: 0.9em; color: #888;">Complete the experiment to unlock the safe.</p>
            `;
            showModalElement();
        }
        return;
    }

    // === CHEMICAL PICKUPS ===
    if (name.startsWith('chemical_')) {
        const color = name.split('_')[1];
        handleChemicalPickup(color, obj, labData);
        return;
    }

    // === BUNSEN BURNER ===
    if (name === 'bunsen_burner') {
        handleBunsenBurner(obj);
        return;
    }

    // === MIXING BEAKER ===
    if (name === 'mixing_beaker') {
        handleMixingBeaker(labData);
        return;
    }

    // === LAB NOTEBOOK ===
    if (name === 'lab_notebook') {
        handleLabNotebook();
        return;
    }

    // === MICROSCOPE ===
    if (name === 'microscope') {
        handleMicroscope();
        return;
    }

    // === LAB COMPUTER ===
    if (name === 'lab_computer') {
        handleLabComputer();
        return;
    }

    // === LAB FRIDGE ===
    if (name === 'lab_fridge') {
        handleLabFridge(labData);
        return;
    }

    // === LAB SAFE ===
    if (name === 'lab_safe') {
        handleLabSafe();
        return;
    }

    // === WHITEBOARD ===
    if (name === 'whiteboard') {
        handleWhiteboard();
        return;
    }

    // === PERIODIC TABLE ===
    if (name === 'periodic_table') {
        handlePeriodicTable();
        return;
    }

    // === CENTRIFUGE ===
    if (name === 'centrifuge') {
        handleCentrifuge();
        return;
    }

    // === CHEMICAL CABINET ===
    if (name === 'chemical_cabinet') {
        handleChemicalCabinet();
        return;
    }

    // === DEFAULT FLAVOR TEXT ===
    showFlavorText(name);
}

// Chemical pickup handler
function handleChemicalPickup(color, obj, labData) {
    const modal = document.getElementById('clueModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');
    const modalFeedback = document.getElementById('modalFeedback');

    const colorNames = {
        red: 'Red',
        blue: 'Blue',
        green: 'Green',
        yellow: 'Yellow'
    };

    const stateKey = `has${colorNames[color]}Chemical`;

    if (labState[stateKey]) {
        modalTitle.textContent = 'EMPTY FLASK';
        modalContent.innerHTML = '<p>You already collected this chemical.</p>';
        showModalElement();
        return;
    }

    // Add to inventory
    const success = addItem({
        id: `chemical_${color}`,
        name: `${colorNames[color]} Chemical`,
        icon: getChemicalIcon(color),
        description: `A flask containing ${color} liquid.`
    });

    if (success) {
        labState[stateKey] = true;
        obj.visible = false;

        modalTitle.textContent = 'CHEMICAL COLLECTED';
        modalContent.innerHTML = `
            <div style="text-align: center; font-size: 48px; margin: 20px 0;">${getChemicalIcon(color)}</div>
            <p>You collected the <strong style="color: ${getChemicalDisplayColor(color)};">${colorNames[color]} Chemical</strong>.</p>
            <p style="font-size: 0.9em; color: #888;">Added to inventory.</p>
        `;
        showModalElement();
    } else {
        modalTitle.textContent = 'INVENTORY FULL';
        modalContent.innerHTML = '<p>Your inventory is full. Use or drop an item first.</p>';
        showModalElement();
    }
}

function getChemicalIcon(color) {
    const icons = {
        red: '🧪',
        blue: '🧪',
        green: '🧪',
        yellow: '🧪'
    };
    return icons[color] || '🧪';
}

function getChemicalDisplayColor(color) {
    const colors = {
        red: '#ff4444',
        blue: '#4444ff',
        green: '#44ff44',
        yellow: '#ffff44'
    };
    return colors[color] || '#ffffff';
}

// Bunsen Burner handler
function handleBunsenBurner(obj) {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');

    modalTitle.textContent = 'BUNSEN BURNER';

    if (labState.bunsenBurnerOn) {
        modalContent.innerHTML = `
            <p>The flame is burning steadily.</p>
            <p style="color: #ffaa44;">Status: ON</p>
        `;
        const turnOffBtn = createButton('TURN OFF', () => {
            labState.bunsenBurnerOn = false;
            const flame = obj.getObjectByName('flame');
            if (flame) flame.visible = false;
            closeModal();
        });
        optionsContainer.appendChild(turnOffBtn);
    } else {
        modalContent.innerHTML = `
            <p>A standard laboratory Bunsen burner.</p>
            <p style="color: #888;">Status: OFF</p>
        `;
        const turnOnBtn = createButton('TURN ON', () => {
            labState.bunsenBurnerOn = true;
            const flame = obj.getObjectByName('flame');
            if (flame) flame.visible = true;
            closeModal();
        });
        optionsContainer.appendChild(turnOnBtn);
    }
    showModalElement();
}

// Mixing Beaker handler
function handleMixingBeaker(labData) {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');
    const modalFeedback = document.getElementById('modalFeedback');

    modalTitle.textContent = 'MIXING BEAKER';

    if (labState.reactionComplete) {
        modalContent.innerHTML = `
            <p style="color: #4caf50;">The reaction was successful!</p>
            <p>A crystallized compound has formed.</p>
            <p style="font-size: 0.9em;">The safe code was revealed: <strong>2731</strong></p>
        `;
        labState.foundSafeCode = true;
        showModalElement();
        return;
    }

    const selectedItem = getSelectedItem();

    // Show current state
    let stateHtml = '<p>An empty beaker ready for mixing chemicals.</p>';
    if (labState.mixedChemicals.length > 0) {
        stateHtml = `<p>Current mixture: <strong>${labState.mixedChemicals.join(' + ')}</strong></p>`;
    }
    stateHtml += `<p style="font-size: 0.9em; color: #888;">Attempts remaining: ${labState.mixingAttempts}</p>`;

    modalContent.innerHTML = stateHtml;

    // Add pour button if chemical is selected
    if (selectedItem && selectedItem.id.startsWith('chemical_')) {
        const color = selectedItem.id.split('_')[1];
        const pourBtn = createButton(`POUR ${color.toUpperCase()} CHEMICAL`, () => {
            pourChemical(color, selectedItem.index, labData);
        });
        optionsContainer.appendChild(pourBtn);
    }

    // Add heat button if chemicals are mixed and burner is on
    if (labState.mixedChemicals.length >= 3 && labState.bunsenBurnerOn) {
        const heatBtn = createButton('HEAT MIXTURE', () => {
            attemptReaction(labData);
        });
        heatBtn.style.backgroundColor = '#ff6600';
        optionsContainer.appendChild(heatBtn);
    } else if (labState.mixedChemicals.length >= 3 && !labState.bunsenBurnerOn) {
        modalFeedback.style.color = '#ffaa44';
        modalFeedback.textContent = 'Turn on the Bunsen burner to heat the mixture.';
    }

    // Reset button
    if (labState.mixedChemicals.length > 0) {
        const resetBtn = createButton('EMPTY BEAKER', () => {
            labState.mixedChemicals = [];
            handleMixingBeaker(labData);
        });
        resetBtn.style.backgroundColor = '#666';
        optionsContainer.appendChild(resetBtn);
    }

    showModalElement();
}

function pourChemical(color, inventoryIndex, labData) {
    const modalFeedback = document.getElementById('modalFeedback');

    if (labState.mixedChemicals.includes(color)) {
        modalFeedback.style.color = '#e57373';
        modalFeedback.textContent = 'This chemical is already in the mixture!';
        return;
    }

    labState.mixedChemicals.push(color);
    removeItem(inventoryIndex);
    selectSlot(-1);

    modalFeedback.style.color = '#4caf50';
    modalFeedback.textContent = `Added ${color} chemical to the mixture.`;

    // Refresh the modal
    setTimeout(() => handleMixingBeaker(labData), 500);
}

function attemptReaction(labData) {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');
    const modalFeedback = document.getElementById('modalFeedback');

    // Check if formula is correct (order matters!)
    const isCorrect = labState.mixedChemicals.length === 3 &&
        labState.mixedChemicals[0] === 'red' &&
        labState.mixedChemicals[1] === 'blue' &&
        labState.mixedChemicals[2] === 'green';

    if (isCorrect) {
        labState.reactionComplete = true;
        labState.foundSafeCode = true;

        modalTitle.textContent = 'REACTION COMPLETE!';
        modalContent.innerHTML = `
            <div style="text-align: center; color: #4caf50;">
                <h2>SUCCESS!</h2>
                <p>The chemicals react and form a crystalline structure.</p>
                <p>Numbers appear in the residue:</p>
                <h1 style="font-size: 48px; color: #fff; text-shadow: 0 0 10px #4caf50;">2731</h1>
                <p style="font-size: 0.9em; color: #888;">This must be the safe code!</p>
            </div>
        `;
        optionsContainer.innerHTML = '';
    } else {
        labState.mixingAttempts--;

        if (labState.mixingAttempts <= 0) {
            // Reset puzzle
            labState.mixingAttempts = 3;
            labState.mixedChemicals = [];
            labState.hasRedChemical = false;
            labState.hasBlueChemical = false;
            labState.hasGreenChemical = false;

            // Reset chemical visibility
            if (labData.redChemical) labData.redChemical.visible = true;
            if (labData.blueChemical) labData.blueChemical.visible = true;
            if (labData.greenChemical) labData.greenChemical.visible = true;

            modalTitle.textContent = 'HAZARDOUS REACTION!';
            modalContent.innerHTML = `
                <div style="text-align: center; color: #e57373;">
                    <h2>FAILED!</h2>
                    <p>The mixture bubbles violently and evaporates!</p>
                    <p>The chemicals have reset to their original positions.</p>
                    <p style="color: #888;">Check the lab notebook for the correct formula.</p>
                </div>
            `;
            optionsContainer.innerHTML = '';
        } else {
            labState.mixedChemicals = [];

            modalTitle.textContent = 'REACTION FAILED';
            modalContent.innerHTML = `
                <div style="text-align: center; color: #ffaa44;">
                    <p>The mixture fizzles and produces smoke...</p>
                    <p>Nothing happens. The chemicals were wasted.</p>
                    <p style="color: #888;">Attempts remaining: ${labState.mixingAttempts}</p>
                    <p style="font-size: 0.9em;">Hint: Check the lab notebook for the correct formula.</p>
                </div>
            `;
            optionsContainer.innerHTML = '';
        }
    }
    showModalElement();
}

// Lab Notebook handler
function handleLabNotebook() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    labState.foundFormulaHint = true;

    modalTitle.textContent = 'LAB NOTEBOOK';
    modalContent.innerHTML = `
        <div style="background: #f5f5dc; color: #1a1a1a; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace;">
            <p style="text-decoration: underline; font-weight: bold;">Experiment Log - Day 47</p>
            <p>The synthesis requires precise order:</p>
            <ol style="margin: 10px 0; padding-left: 20px;">
                <li style="color: #cc0000;">Primary base (scarlet)</li>
                <li style="color: #0000cc;">Secondary catalyst (azure)</li>
                <li style="color: #00cc00;">Final reagent (emerald)</li>
            </ol>
            <p style="font-style: italic; margin-top: 15px; font-size: 0.9em;">
                "Red, Blue, Green - in that order, then apply heat."
            </p>
            <hr style="border-color: #ccc; margin: 15px 0;">
            <p style="font-size: 0.8em; color: #666;">
                Note: Yellow reagent is stored in cold storage for stability.
            </p>
        </div>
    `;
    showModalElement();
}

// Microscope handler
function handleMicroscope() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    labState.microscopeViewed = true;

    modalTitle.textContent = 'MICROSCOPE';
    modalContent.innerHTML = `
        <div style="text-align: center;">
            <div style="background: #111; border-radius: 50%; width: 200px; height: 200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; border: 3px solid #444;">
                <div style="background: radial-gradient(circle, #1a3a1a 0%, #0a1a0a 100%); width: 180px; height: 180px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 12px; color: #4caf50; font-family: monospace;">
                        CELL STRUCTURE<br>
                        MAGNIFICATION: 400x
                    </span>
                </div>
            </div>
            <p style="margin-top: 15px;">A prepared slide shows cellular structures.</p>
            <p style="font-size: 0.9em; color: #888;">The sample appears to be from the experiment.</p>
        </div>
    `;
    showModalElement();
}

// Lab Computer handler
function handleLabComputer() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');

    modalTitle.textContent = 'LAB COMPUTER';

    if (labState.reactionComplete) {
        modalContent.innerHTML = `
            <div style="background: #0a0a0a; padding: 15px; border: 2px solid #4caf50; font-family: monospace;">
                <p style="color: #4caf50;">> EXPERIMENT STATUS: COMPLETE</p>
                <p style="color: #4caf50;">> SAFE CODE GENERATED: 2731</p>
                <p style="color: #4caf50;">> KEYCARD LOCATION: SAFE</p>
                <p style="color: #888; margin-top: 10px;">Use the safe code to retrieve the exit keycard.</p>
            </div>
        `;
    } else {
        modalContent.innerHTML = `
            <div style="background: #0a0a0a; padding: 15px; border: 2px solid #333; font-family: monospace;">
                <p style="color: #00ff00;">> WELCOME TO LABSYS v2.4</p>
                <p style="color: #ffaa00;">> WARNING: EXPERIMENT INCOMPLETE</p>
                <p style="color: #888; margin-top: 10px;">> Complete the chemical synthesis to unlock safe code.</p>
                <p style="color: #888;">> Refer to lab notebook for procedure.</p>
            </div>
        `;
    }
    showModalElement();
}

// Lab Fridge handler
function handleLabFridge(labData) {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');

    modalTitle.textContent = 'LABORATORY REFRIGERATOR';

    if (!labState.fridgeOpened) {
        modalContent.innerHTML = `
            <p>A laboratory refrigerator for storing temperature-sensitive chemicals.</p>
            <p style="color: #4ca6ff;">Temperature: 4°C</p>
        `;
        const openBtn = createButton('OPEN FRIDGE', () => {
            labState.fridgeOpened = true;
            if (labData.yellowChemical) {
                labData.yellowChemical.visible = true;
            }
            handleLabFridge(labData);
        });
        optionsContainer.appendChild(openBtn);
    } else {
        if (labState.hasYellowChemical) {
            modalContent.innerHTML = `
                <p>The refrigerator is open. It's mostly empty now.</p>
                <p style="font-size: 0.9em; color: #888;">You already took the yellow chemical.</p>
            `;
        } else {
            modalContent.innerHTML = `
                <p>The refrigerator is open.</p>
                <p>Inside you see a flask with <strong style="color: #ffff44;">yellow liquid</strong>.</p>
            `;
        }
    }
    showModalElement();
}

// Lab Safe handler
function handleLabSafe() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');
    const modalFeedback = document.getElementById('modalFeedback');

    modalTitle.textContent = 'LABORATORY SAFE';

    if (labState.safeUnlocked) {
        if (labState.hasKeycard) {
            modalContent.innerHTML = `
                <p>The safe is open and empty.</p>
                <p style="color: #888;">You already took the keycard.</p>
            `;
        } else {
            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <p style="color: #4caf50;">The safe is open!</p>
                    <p>Inside you find an <strong>EXIT KEYCARD</strong>.</p>
                    <div style="font-size: 48px; margin: 20px 0;">🔑</div>
                </div>
            `;
            const takeBtn = createButton('TAKE KEYCARD', () => {
                labState.hasKeycard = true;
                closeModal();
                setTimeout(() => {
                    showMessage('KEYCARD ACQUIRED', 'Use it on the door to escape!');
                }, 300);
            });
            takeBtn.style.backgroundColor = '#4caf50';
            optionsContainer.appendChild(takeBtn);
        }
        showModalElement();
        return;
    }

    if (!labState.foundSafeCode) {
        modalContent.innerHTML = `
            <p>A heavy-duty laboratory safe.</p>
            <p style="color: #e57373;">LOCKED - 4-digit code required</p>
            <p style="font-size: 0.9em; color: #888;">Complete the experiment to discover the code.</p>
        `;
        showModalElement();
        return;
    }

    // Show keypad
    modalContent.innerHTML = `
        <p>Enter the 4-digit code:</p>
        <div id="safeCodeDisplay" style="font-size: 32px; font-family: monospace; letter-spacing: 10px; margin: 15px 0; color: #4caf50;">____</div>
        <p style="font-size: 0.9em; color: #888;">Attempts remaining: ${labState.safeAttempts}</p>
    `;

    // Create keypad
    const keypad = document.createElement('div');
    keypad.id = 'safeKeypad';
    keypad.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; max-width: 200px; margin: 0 auto;';

    let currentInput = '';

    for (let i = 1; i <= 9; i++) {
        const btn = createKeypadButton(i.toString(), () => {
            if (currentInput.length < 4) {
                currentInput += i;
                updateSafeDisplay(currentInput);
            }
        });
        keypad.appendChild(btn);
    }

    // Clear button
    const clearBtn = createKeypadButton('C', () => {
        currentInput = '';
        updateSafeDisplay(currentInput);
    });
    clearBtn.style.backgroundColor = '#aa4444';
    keypad.appendChild(clearBtn);

    // Zero button
    const zeroBtn = createKeypadButton('0', () => {
        if (currentInput.length < 4) {
            currentInput += '0';
            updateSafeDisplay(currentInput);
        }
    });
    keypad.appendChild(zeroBtn);

    // Enter button
    const enterBtn = createKeypadButton('E', () => {
        if (currentInput === labState.safeCode) {
            labState.safeUnlocked = true;
            modalFeedback.style.color = '#4caf50';
            modalFeedback.textContent = 'ACCESS GRANTED';
            setTimeout(() => handleLabSafe(), 500);
        } else {
            labState.safeAttempts--;
            currentInput = '';
            updateSafeDisplay(currentInput);
            modalFeedback.style.color = '#e57373';

            if (labState.safeAttempts <= 0) {
                modalFeedback.textContent = 'LOCKOUT - Try again later';
                labState.safeAttempts = 3;
            } else {
                modalFeedback.textContent = `INVALID CODE - ${labState.safeAttempts} attempts left`;
            }
        }
    });
    enterBtn.style.backgroundColor = '#44aa44';
    keypad.appendChild(enterBtn);

    modalContent.appendChild(keypad);
    showModalElement();
}

function updateSafeDisplay(code) {
    const display = document.getElementById('safeCodeDisplay');
    if (display) {
        display.textContent = code.padEnd(4, '_');
    }
}

// Whiteboard handler
function handleWhiteboard() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = 'WHITEBOARD';
    modalContent.innerHTML = `
        <div style="background: #fff; color: #333; padding: 20px; border-radius: 4px;">
            <p style="font-weight: bold; color: #cc0000;">SAFETY REMINDER:</p>
            <ul style="text-align: left; margin: 10px 0;">
                <li>Always wear protective equipment</li>
                <li>Check chemical compatibility before mixing</li>
                <li>Heat reactions under fume hood</li>
            </ul>
            <hr style="margin: 15px 0;">
            <p style="font-style: italic; color: #666;">
                "The order of addition matters! R-B-G protocol."
            </p>
        </div>
    `;
    showModalElement();
}

// Periodic Table handler
function handlePeriodicTable() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = 'PERIODIC TABLE';
    modalContent.innerHTML = `
        <p>A standard periodic table of elements.</p>
        <p style="font-size: 0.9em; color: #888;">Nothing unusual here, just good science!</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 15px; font-family: monospace; font-size: 12px;">
            <div style="background: #ff6666; padding: 5px; text-align: center;">H<br>1</div>
            <div style="background: #66ff66; padding: 5px; text-align: center;">He<br>2</div>
            <div style="background: #6666ff; padding: 5px; text-align: center;">Li<br>3</div>
            <div style="background: #ffff66; padding: 5px; text-align: center;">Be<br>4</div>
        </div>
    `;
    showModalElement();
}

// Centrifuge handler
function handleCentrifuge() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');

    modalTitle.textContent = 'CENTRIFUGE';

    if (labState.centrifugeRunning) {
        modalContent.innerHTML = `
            <p>The centrifuge is spinning rapidly.</p>
            <p style="color: #ffaa44;">Status: RUNNING (5000 RPM)</p>
            <p style="font-size: 0.9em; color: #888;">Do not open while in operation.</p>
        `;
        const stopBtn = createButton('STOP', () => {
            labState.centrifugeRunning = false;
            handleCentrifuge();
        });
        optionsContainer.appendChild(stopBtn);
    } else {
        modalContent.innerHTML = `
            <p>A laboratory centrifuge for separating samples.</p>
            <p style="color: #888;">Status: IDLE</p>
        `;
        const startBtn = createButton('START', () => {
            labState.centrifugeRunning = true;
            handleCentrifuge();
        });
        optionsContainer.appendChild(startBtn);
    }
    showModalElement();
}

// Chemical Cabinet handler
function handleChemicalCabinet() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = 'CHEMICAL STORAGE';
    modalContent.innerHTML = `
        <p>A cabinet for storing laboratory chemicals.</p>
        <div style="margin-top: 15px;">
            <p><strong>Contents:</strong></p>
            <ul style="text-align: left;">
                <li style="color: ${labState.hasRedChemical ? '#888' : '#ff4444'};">
                    Red Chemical ${labState.hasRedChemical ? '(collected)' : ''}
                </li>
                <li style="color: ${labState.hasBlueChemical ? '#888' : '#4444ff'};">
                    Blue Chemical ${labState.hasBlueChemical ? '(collected)' : ''}
                </li>
            </ul>
        </div>
        <p style="font-size: 0.9em; color: #888; margin-top: 10px;">
            Additional chemicals may be stored elsewhere.
        </p>
    `;
    showModalElement();
}

// Flavor text for misc objects
function showFlavorText(name) {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    const flavorTexts = {
        'fume_hood': ['A standard laboratory fume hood.', 'Good for handling volatile chemicals.'],
        'test_tube_rack': ['A rack holding several empty test tubes.', 'Ready for experiments.'],
        'petri_dish': ['A petri dish with some growth medium.', 'Nothing interesting growing yet.'],
        'biohazard_bin': ['A biohazard waste container.', 'Dispose of contaminated materials here.'],
        'emergency_shower': ['Emergency shower station.', 'Pull the handle in case of chemical exposure.'],
        'eyewash_station': ['Emergency eye wash station.', 'For flushing eyes after chemical contact.'],
        'fire_extinguisher': ['A CO2 fire extinguisher.', 'For Class B and C fires.'],
        'first_aid_kit': ['A standard first aid kit.', 'Contains bandages, antiseptic, and basic supplies.'],
        'lab_sink': ['A stainless steel laboratory sink.', 'Water temperature is regulated.'],
        'hazmat_suit': ['A hazmat suit hanging on the wall.', 'For handling dangerous materials.']
    };

    const texts = flavorTexts[name] || ['An object in the laboratory.', 'Nothing special about it.'];
    const text = texts[Math.floor(Math.random() * texts.length)];

    const displayName = name.replace(/_/g, ' ').toUpperCase();
    modalTitle.textContent = displayName;
    modalContent.innerHTML = `<p>${text}</p>`;
    showModalElement();
}

// Helper functions
function createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = text;
    btn.onclick = onClick;
    return btn;
}

function createKeypadButton(text, onClick) {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding: 15px; font-size: 18px; background: #333; color: #fff; border: 1px solid #555; cursor: pointer;';
    btn.textContent = text;
    btn.onclick = onClick;
    return btn;
}

function showModalElement() {
    const modal = document.getElementById('clueModal');
    modal.style.display = 'block';
    // Set isInteracting flag (imported from ui.js, but we need to manage it locally too)
}

function showMessage(title, content) {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');

    modalTitle.textContent = title;
    modalContent.innerHTML = `<p style="text-align: center;">${content}</p>`;
    optionsContainer.innerHTML = '';
    showModalElement();
}

function triggerVictory() {
    const victoryModal = document.getElementById('victoryModal');
    const victoryTime = document.getElementById('victoryTime');

    // Calculate time from engine timer
    if (victoryTime && window.engine) {
        const timeLeft = window.engine.timeLeft || 0;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = Math.floor(timeLeft % 60);
        victoryTime.textContent = `Time Remaining: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    if (victoryModal) {
        victoryModal.style.display = 'flex';
    }
}

// Initialize the science lab
async function initScienceLab() {
    let labData = null;

    const engine = new RoomEngine({
        roomWidth: LAB_WIDTH,
        roomDepth: LAB_DEPTH,
        wallThickness: WALL_THICKNESS,
        enableProceduralRoom: false, // We build our own room
        enableDoor: true,
        enableTimer: true,
        cameraX: 0,
        cameraZ: 4,
        onInteract: (name, obj) => {
            handleLabInteraction(name, obj, labData);
        }
    });

    // Build the lab scene
    labData = await buildLabScene(engine);

    // Create door and timer
    engine.createDoor();
    engine.createTimer();

    // Initialize inventory UI
    if (typeof initInventoryUI === 'function') {
        initInventoryUI();
    }

    // Adjust room bounds for larger lab
    engine.roomBounds = {
        minX: -LAB_WIDTH/2 + 0.8,
        maxX: LAB_WIDTH/2 - 0.8,
        minZ: -LAB_DEPTH/2 + 0.8,
        maxZ: LAB_DEPTH/2 - 0.8
    };

    // Add custom lab lighting
    const labLight1 = new THREE.PointLight(0x00ffff, 0.3, 15);
    labLight1.position.set(-3, 2.5, -3);
    engine.scene.add(labLight1);

    const labLight2 = new THREE.PointLight(0x00ffff, 0.3, 15);
    labLight2.position.set(3, 2.5, 3);
    engine.scene.add(labLight2);

    // Start the engine
    engine.start();

    // Expose for debugging
    window.engine = engine;
    window.labState = labState;
    window.labData = labData;
}

// Start
initScienceLab();
