import * as THREE from 'three';

/**
 * Comprehensive procedural object generators for escape rooms.
 * All objects are created with THREE.js primitives - no external models needed.
 */

// ===== FURNITURE =====

export function createDesk(width = 1.5, height = 0.75, depth = 0.8) {
    const group = new THREE.Group();
    const woodColor = 0x654321;
    const woodMaterial = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.7 });

    // Desktop
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.05, depth),
        woodMaterial
    );
    top.position.y = height;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Legs (4 corners)
    const legRadius = 0.04;
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, height);
    const positions = [
        [width/2 - 0.1, height/2, depth/2 - 0.1],
        [width/2 - 0.1, height/2, -depth/2 + 0.1],
        [-width/2 + 0.1, height/2, depth/2 - 0.1],
        [-width/2 + 0.1, height/2, -depth/2 + 0.1]
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, woodMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        group.add(leg);
    });

    // Drawers (3-drawer stack on right side)
    const drawerWidth = width * 0.4;
    const drawerDepth = depth - 0.1;
    const drawerHeight = height * 0.25;
    const drawerSpacing = height * 0.05;
    const drawerMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.6 });
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });

    // Array to store drawer references for animation
    group.userData.drawers = [];

    for (let i = 0; i < 3; i++) {
        // Create drawer group to move drawer + handle together
        const drawerGroup = new THREE.Group();
        drawerGroup.position.set(
            width * 0.25,
            drawerSpacing + (i * (drawerHeight + drawerSpacing)) + drawerHeight / 2,
            0
        );

        // Drawer as an open box (front, bottom, left, right, back - no top)
        const drawerThickness = 0.02;

        // Front face
        const drawerFront = new THREE.Mesh(
            new THREE.BoxGeometry(drawerWidth, drawerHeight, drawerThickness),
            drawerMaterial
        );
        drawerFront.position.z = drawerDepth/2 - drawerThickness/2;
        drawerFront.castShadow = true;
        drawerFront.name = `drawer_${i}_front`; // Name for interaction
        drawerGroup.add(drawerFront);

        // Bottom
        const drawerBottom = new THREE.Mesh(
            new THREE.BoxGeometry(drawerWidth, drawerThickness, drawerDepth - drawerThickness),
            drawerMaterial
        );
        drawerBottom.position.y = -drawerHeight/2 + drawerThickness/2;
        drawerBottom.castShadow = true;
        drawerBottom.name = `drawer_${i}_bottom`;
        drawerGroup.add(drawerBottom);

        // Left side
        const drawerLeft = new THREE.Mesh(
            new THREE.BoxGeometry(drawerThickness, drawerHeight, drawerDepth - drawerThickness),
            drawerMaterial
        );
        drawerLeft.position.x = -drawerWidth/2 + drawerThickness/2;
        drawerLeft.castShadow = true;
        drawerLeft.name = `drawer_${i}_left`;
        drawerGroup.add(drawerLeft);

        // Right side
        const drawerRight = new THREE.Mesh(
            new THREE.BoxGeometry(drawerThickness, drawerHeight, drawerDepth - drawerThickness),
            drawerMaterial
        );
        drawerRight.position.x = drawerWidth/2 - drawerThickness/2;
        drawerRight.castShadow = true;
        drawerRight.name = `drawer_${i}_right`;
        drawerGroup.add(drawerRight);

        // Back
        const drawerBack = new THREE.Mesh(
            new THREE.BoxGeometry(drawerWidth, drawerHeight, drawerThickness),
            drawerMaterial
        );
        drawerBack.position.z = -drawerDepth/2 + drawerThickness/2;
        drawerBack.castShadow = true;
        drawerBack.name = `drawer_${i}_back`;
        drawerGroup.add(drawerBack);

        // Drawer handle (positioned on the front face)
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.1),
            handleMaterial
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 0, drawerDepth/2 + 0.01); // Just in front of drawer front
        handle.name = `drawer_${i}_handle`; // Also make handle clickable
        drawerGroup.add(handle);

        // Store metadata on the group for animation
        drawerGroup.userData.isOpen = false;
        drawerGroup.userData.drawerIndex = i;
        drawerGroup.userData.targetZ = 0; // For animation
        drawerGroup.userData.openDistance = 0.3; // How far drawer slides out

        // Store reference to drawerGroup on ALL drawer parts for easy clicking
        drawerFront.userData.drawerGroup = drawerGroup;
        drawerBottom.userData.drawerGroup = drawerGroup;
        drawerLeft.userData.drawerGroup = drawerGroup;
        drawerRight.userData.drawerGroup = drawerGroup;
        drawerBack.userData.drawerGroup = drawerGroup;
        handle.userData.drawerGroup = drawerGroup;

        group.add(drawerGroup);
        group.userData.drawers.push(drawerGroup);
    }

    return group;
}

export function createChair(seatHeight = 0.5, backHeight = 0.9) {
    const group = new THREE.Group();
    const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });

    // Seat
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.05, 0.45),
        chairMaterial
    );
    seat.position.y = seatHeight;
    seat.castShadow = true;
    group.add(seat);

    // Backrest
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, backHeight - seatHeight, 0.05),
        chairMaterial
    );
    back.position.set(0, seatHeight + (backHeight - seatHeight)/2, -0.2);
    back.castShadow = true;
    group.add(back);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.025, 0.025, seatHeight);
    const legPositions = [
        [0.2, seatHeight/2, 0.2],
        [0.2, seatHeight/2, -0.2],
        [-0.2, seatHeight/2, 0.2],
        [-0.2, seatHeight/2, -0.2]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, chairMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        group.add(leg);
    });

    return group;
}

export function createBookshelf(width = 1.0, height = 2.0, depth = 0.4, shelves = 4) {
    const group = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

    // Back panel
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.02),
        woodMaterial
    );
    back.position.set(0, height/2, -depth/2);
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    // Sides
    [width/2, -width/2].forEach(x => {
        const side = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, height, depth),
            woodMaterial
        );
        side.position.set(x - (x > 0 ? 0.025 : -0.025), height/2, 0);
        side.castShadow = true;
        group.add(side);
    });

    // Shelves (including top and bottom)
    for (let i = 0; i <= shelves; i++) {
        const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(width - 0.1, 0.03, depth),
            woodMaterial
        );
        shelf.position.set(0, (height / shelves) * i, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        group.add(shelf);
    }

    return group;
}

export function createFilingCabinet(width = 0.5, height = 1.0, depth = 0.6, drawers = 3) {
    const group = new THREE.Group();
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x505050,
        metalness: 0.6,
        roughness: 0.4
    });

    // Cabinet body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        metalMaterial
    );
    body.position.y = height/2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Drawers
    const drawerHeight = height / drawers;
    for (let i = 0; i < drawers; i++) {
        const drawer = new THREE.Mesh(
            new THREE.BoxGeometry(width - 0.05, drawerHeight - 0.05, depth - 0.02),
            new THREE.MeshStandardMaterial({ color: 0x606060, metalness: 0.5, roughness: 0.5 })
        );
        drawer.position.set(0, drawerHeight * i + drawerHeight/2, depth/2 - 0.005);
        group.add(drawer);

        // Handle
        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.03, 0.03),
            new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
        );
        handle.position.set(0, drawerHeight * i + drawerHeight/2, depth/2 + 0.02);
        group.add(handle);
    }

    return group;
}

export function createSofa(width = 2.0, depth = 0.9, seatHeight = 0.45) {
    const group = new THREE.Group();
    const fabricMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });

    // Seat
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.2, depth),
        fabricMaterial
    );
    seat.position.y = seatHeight;
    seat.castShadow = true;
    group.add(seat);

    // Backrest
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.6, 0.2),
        fabricMaterial
    );
    back.position.set(0, seatHeight + 0.4, -depth/2 + 0.1);
    back.castShadow = true;
    group.add(back);

    // Armrests
    [-width/2 + 0.1, width/2 - 0.1].forEach(x => {
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.4, depth),
            fabricMaterial
        );
        arm.position.set(x, seatHeight + 0.2, 0);
        arm.castShadow = true;
        group.add(arm);
    });

    // Legs (simple)
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, seatHeight - 0.1);
    const legPositions = [
        [width/2 - 0.2, seatHeight/2 - 0.05, depth/2 - 0.2],
        [width/2 - 0.2, seatHeight/2 - 0.05, -depth/2 + 0.2],
        [-width/2 + 0.2, seatHeight/2 - 0.05, depth/2 - 0.2],
        [-width/2 + 0.2, seatHeight/2 - 0.05, -depth/2 + 0.2]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
        leg.position.set(...pos);
        group.add(leg);
    });

    return group;
}

export function createCoffeeTable(width = 1.0, height = 0.35, depth = 0.6) {
    const group = new THREE.Group();
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.9
    });

    // Glass top
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.03, depth),
        glassMaterial
    );
    top.position.y = height;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Metal legs
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, height - 0.05);
    const legPositions = [
        [width/2 - 0.1, height/2, depth/2 - 0.1],
        [width/2 - 0.1, height/2, -depth/2 + 0.1],
        [-width/2 + 0.1, height/2, depth/2 - 0.1],
        [-width/2 + 0.1, height/2, -depth/2 + 0.1]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        group.add(leg);
    });

    return group;
}

// ===== OFFICE EQUIPMENT =====

export function createComputer(screenWidth = 0.4, screenHeight = 0.3) {
    const group = new THREE.Group();

    // Monitor screen (black rectangle)
    const screen = new THREE.Mesh(
        new THREE.BoxGeometry(screenWidth, screenHeight, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 })
    );
    screen.position.set(0, 0.05 + screenHeight/2, 0);
    screen.castShadow = true;
    group.add(screen);

    // Base/stand
    const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    );
    stand.position.y = 0.025;
    group.add(stand);

    return group;
}

export function createKeyboard(width = 0.4, depth = 0.15) {
    const group = new THREE.Group();

    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.02, depth),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })
    );
    body.position.y = 0.01;
    group.add(body);

    // Keys (simple grid)
    const keyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 10; col++) {
            const key = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.01, 0.03),
                keyMaterial
            );
            key.position.set(
                -width/2 + 0.05 + col * 0.035,
                0.025,
                -depth/2 + 0.03 + row * 0.035
            );
            group.add(key);
        }
    }

    return group;
}

export function createMouse() {
    const group = new THREE.Group();

    const mouse = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.02, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })
    );
    mouse.position.y = 0.01;

    // Rounded top
    mouse.geometry.scale(1, 1.2, 1);
    group.add(mouse);

    return group;
}

export function createSafe(width = 0.8, height = 1.0, depth = 0.8) {
    const group = new THREE.Group();
    const safeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.8,
        roughness: 0.3
    });

    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        safeMaterial
    );
    body.position.y = height/2;
    body.castShadow = true;
    body.name = "safe";
    group.add(body);

    // Door (front face)
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.9, height * 0.9, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    door.position.set(0, height/2, depth/2 + 0.01);
    group.add(door);

    // Combination dial
    const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
    );
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, height/2 + 0.2, depth/2 + 0.03);
    group.add(dial);

    // Handle
    const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.2, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
    );
    handle.position.set(0.2, height/2, depth/2 + 0.03);
    group.add(handle);

    return group;
}

// ===== DECORATIONS & PROPS =====

export function createGlobe(radius = 0.2) {
    const group = new THREE.Group();

    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    group.add(base);

    // Globe sphere
    const globe = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x4682B4, roughness: 0.6 })
    );
    globe.position.y = 0.025 + radius;
    globe.name = "globe";
    globe.castShadow = true;
    group.add(globe);

    // Add larger invisible hitbox for easier interaction
    const hitbox = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 2, 16, 16),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 0.025 + radius;
    group.add(hitbox);

    return group;
}

export function createClock(radius = 0.3) {
    const group = new THREE.Group();

    // Frame
    const frame = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    frame.rotation.x = Math.PI / 2;
    frame.castShadow = true;
    group.add(frame);

    // Face
    const face = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 0.93, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    face.position.z = 0.051;
    face.name = "clock";
    group.add(face);

    // Hour markers (simple)
    const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const marker = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, i % 3 === 0 ? 0.05 : 0.03, 0.01),
            markerMaterial
        );
        marker.position.set(
            Math.sin(angle) * radius * 0.8,
            -Math.cos(angle) * radius * 0.8,
            0.06
        );
        marker.rotation.z = angle;
        group.add(marker);
    }

    // Hour hand
    const hourHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, radius * 0.5, 0.01),
        markerMaterial
    );
    hourHand.position.set(0, radius * 0.25, 0.065);
    hourHand.rotation.z = Math.PI / 6; // 2 o'clock
    group.add(hourHand);

    // Minute hand
    const minuteHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, radius * 0.7, 0.01),
        markerMaterial
    );
    minuteHand.position.set(0, radius * 0.35, 0.07);
    minuteHand.rotation.z = -Math.PI / 4; // 15 minutes
    group.add(minuteHand);

    return group;
}

export function createBooks(count = 5) {
    const group = new THREE.Group();
    const colors = [0x8B0000, 0x00008B, 0x006400, 0x8B4513, 0x4B0082, 0x800080, 0x2F4F4F, 0x8B4500];

    // Books now stand VERTICALLY (spine out) like in a real library
    const bookHeight = 0.25; // Height of book (vertical dimension)
    const bookDepth = 0.18;  // Depth of book (front to back)
    let xOffset = 0;

    for (let i = 0; i < count; i++) {
        // Varying spine widths for realism
        const spineWidth = 0.025 + Math.random() * 0.035; // Random width 0.025-0.06

        const book = new THREE.Mesh(
            new THREE.BoxGeometry(spineWidth, bookHeight, bookDepth),
            new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.8 })
        );

        // Position books side by side along X axis
        book.position.set(
            xOffset,
            bookHeight / 2, // Center at half height so base is at y=0
            (Math.random() - 0.5) * 0.02 // Slight random depth variation
        );

        // Slight random tilt for realism
        book.rotation.z = (Math.random() - 0.5) * 0.15;
        book.rotation.y = (Math.random() - 0.5) * 0.1;

        book.castShadow = true;
        group.add(book);

        xOffset += spineWidth; // Move to next book position
    }

    // Add a larger invisible hitbox for easier interaction
    const totalWidth = xOffset;
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(totalWidth * 1.5, bookHeight * 1.5, bookDepth * 1.5),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(totalWidth / 2 - xOffset / 2, bookHeight / 2, 0);
    group.add(hitbox);

    // Center the group
    group.position.x = -totalWidth / 2;

    return group;
}

export function createPlant(potRadius = 0.1, plantHeight = 0.4) {
    const group = new THREE.Group();

    // Pot
    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(potRadius, potRadius * 0.8, potRadius * 1.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 })
    );
    pot.position.y = potRadius * 0.75;
    pot.castShadow = true;
    group.add(pot);

    // Soil
    const soil = new THREE.Mesh(
        new THREE.CircleGeometry(potRadius, 16),
        new THREE.MeshStandardMaterial({ color: 0x3d2817 })
    );
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = potRadius * 1.5;
    group.add(soil);

    // Simple leaves (green spheres)
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(potRadius * 0.8, 8, 8),
            leafMaterial
        );
        const angle = (i / 5) * Math.PI * 2;
        leaf.position.set(
            Math.cos(angle) * potRadius * 0.6,
            potRadius * 1.5 + plantHeight * 0.7 + Math.random() * plantHeight * 0.3,
            Math.sin(angle) * potRadius * 0.6
        );
        leaf.castShadow = true;
        group.add(leaf);
    }

    // Add larger invisible hitbox for easier interaction
    const hitbox = new THREE.Mesh(
        new THREE.CylinderGeometry(potRadius * 3, potRadius * 2.5, potRadius * 1.5 + plantHeight, 8),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = (potRadius * 1.5 + plantHeight) / 2;
    group.add(hitbox);

    return group;
}

export function createLamp(type = 'desk') {
    const group = new THREE.Group();

    if (type === 'desk') {
        // Base
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
        );
        base.position.y = 0.01;
        group.add(base);

        // Stem
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
        );
        stem.position.y = 0.2;
        group.add(stem);

        // Shade
        const shade = new THREE.Mesh(
            new THREE.ConeGeometry(0.12, 0.15, 16),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
        );
        shade.position.y = 0.475;
        shade.rotation.x = Math.PI;
        group.add(shade);

        // Add larger invisible hitbox for desk lamp
        const hitbox = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.55, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.275;
        group.add(hitbox);
    } else {
        // Floor lamp
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
        );
        pole.position.y = 0.8;
        group.add(pole);

        // Base
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.2, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
        );
        base.position.y = 0.025;
        group.add(base);

        // Shade
        const shade = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.25, 16),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
        );
        shade.position.y = 1.725;
        shade.rotation.x = Math.PI;
        group.add(shade);

        // Add larger invisible hitbox for floor lamp
        const hitbox = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 1.85, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.925;
        group.add(hitbox);
    }

    return group;
}

export function createBriefcase(width = 0.6, height = 0.15, depth = 0.4) {
    const group = new THREE.Group();
    const leatherMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        roughness: 0.5
    });

    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        leatherMaterial
    );
    body.castShadow = true;
    group.add(body);

    // Handle
    const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.015, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.y = height/2 + 0.05;
    group.add(handle);

    // Latches
    [-width/4, width/4].forEach(x => {
        const latch = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.02, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
        );
        latch.position.set(x, 0, depth/2 + 0.01);
        group.add(latch);
    });

    // Add larger invisible hitbox for easier interaction
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.5, height * 3, depth * 1.5),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = height / 2;
    group.add(hitbox);

    return group;
}

export function createTrashCan(radius = 0.15, height = 0.4) {
    const group = new THREE.Group();

    const can = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.9, height, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })
    );
    can.position.y = height/2;
    can.castShadow = true;
    group.add(can);

    return group;
}

export function createCoatRack(height = 1.8) {
    const group = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    // Central pole
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.06, height, 8),
        woodMaterial
    );
    pole.position.y = height/2;
    pole.castShadow = true;
    group.add(pole);

    // Base (tripod)
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.05, 0.05),
            woodMaterial
        );
        leg.position.set(
            Math.cos(angle) * 0.15,
            0.025,
            Math.sin(angle) * 0.15
        );
        leg.rotation.y = angle;
        leg.castShadow = true;
        group.add(leg);
    }

    // Hooks
    const hookMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const hook = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.03, 0.03),
            hookMaterial
        );
        hook.position.set(
            Math.cos(angle) * 0.05,
            height - 0.3,
            Math.sin(angle) * 0.05
        );
        hook.rotation.y = angle;
        group.add(hook);
    }

    return group;
}

export function createChalkboard(width = 4.0, height = 2.0) {
    const group = new THREE.Group();

    // Board
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })
    );
    board.castShadow = true;
    board.name = "chalkboard";
    group.add(board);

    // Frame
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const frameThickness = 0.08;

    // Top/Bottom
    [height/2, -height/2].forEach(y => {
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, 0.12),
            frameMaterial
        );
        frame.position.y = y;
        group.add(frame);
    });

    // Left/Right
    [-width/2, width/2].forEach(x => {
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, height, 0.12),
            frameMaterial
        );
        frame.position.x = x;
        group.add(frame);
    });

    // Chalk tray
    const tray = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.05, 0.15),
        frameMaterial
    );
    tray.position.set(0, -height/2 - 0.05, 0.05);
    group.add(tray);

    return group;
}

export function createNotepad(width = 0.15, height = 0.005, depth = 0.2) {
    const group = new THREE.Group();

    // Notepad cover/backing (slightly bigger)
    const cover = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.005, height, depth + 0.005),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 })
    );
    cover.castShadow = true;
    group.add(cover);

    // Paper pages (stack of thin white sheets)
    const paper = new THREE.Mesh(
        new THREE.BoxGeometry(width, height * 0.8, depth - 0.01),
        new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.8 })
    );
    paper.position.y = height * 0.4;
    paper.name = "notepad";
    paper.castShadow = true;
    group.add(paper);

    // Spiral binding (left edge)
    const bindingMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
    for (let i = 0; i < 8; i++) {
        const coil = new THREE.Mesh(
            new THREE.TorusGeometry(0.005, 0.002, 8, 8),
            bindingMaterial
        );
        coil.rotation.y = Math.PI / 2;
        coil.position.set(
            -width/2,
            height * 0.4,
            -depth/2 + 0.02 + (i * (depth - 0.04) / 7)
        );
        group.add(coil);
    }

    return group;
}

export function createPen(length = 0.12, radius = 0.003) {
    const group = new THREE.Group();

    // Pen body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, length, 8),
        new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.4 })
    );
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    group.add(body);

    // Pen tip (darker)
    const tip = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.5, radius * 0.3, length * 0.1, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 })
    );
    tip.rotation.z = Math.PI / 2;
    tip.position.x = length / 2 + (length * 0.05);
    group.add(tip);

    // Pen clip
    const clip = new THREE.Mesh(
        new THREE.BoxGeometry(length * 0.15, radius * 4, radius * 0.5),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
    );
    clip.position.set(-length * 0.35, radius * 2, 0);
    group.add(clip);

    return group;
}
