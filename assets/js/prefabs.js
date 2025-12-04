import * as THREE from 'three';

/**
 * Comprehensive procedural object generators for escape rooms.
 * All objects are created with THREE.js primitives - no external models needed.
 * Updated for Office Scene (Filing Cabinet, Coat Rack, Shredder, etc.)
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
        [width / 2 - 0.1, height / 2, depth / 2 - 0.1],
        [width / 2 - 0.1, height / 2, -depth / 2 + 0.1],
        [-width / 2 + 0.1, height / 2, depth / 2 - 0.1],
        [-width / 2 + 0.1, height / 2, -depth / 2 + 0.1]
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
        drawerFront.position.z = drawerDepth / 2 - drawerThickness / 2;
        drawerFront.castShadow = true;
        drawerFront.name = `drawer_${i}_front`; // Name for interaction
        drawerGroup.add(drawerFront);

        // Bottom
        const drawerBottom = new THREE.Mesh(
            new THREE.BoxGeometry(drawerWidth, drawerThickness, drawerDepth - drawerThickness),
            drawerMaterial
        );
        drawerBottom.position.y = -drawerHeight / 2 + drawerThickness / 2;
        drawerBottom.castShadow = true;
        drawerBottom.name = `drawer_${i}_bottom`;
        drawerGroup.add(drawerBottom);

        // Left side
        const drawerLeft = new THREE.Mesh(
            new THREE.BoxGeometry(drawerThickness, drawerHeight, drawerDepth - drawerThickness),
            drawerMaterial
        );
        drawerLeft.position.x = -drawerWidth / 2 + drawerThickness / 2;
        drawerLeft.castShadow = true;
        drawerLeft.name = `drawer_${i}_left`;
        drawerGroup.add(drawerLeft);

        // Right side
        const drawerRight = new THREE.Mesh(
            new THREE.BoxGeometry(drawerThickness, drawerHeight, drawerDepth - drawerThickness),
            drawerMaterial
        );
        drawerRight.position.x = drawerWidth / 2 - drawerThickness / 2;
        drawerRight.castShadow = true;
        drawerRight.name = `drawer_${i}_right`;
        drawerGroup.add(drawerRight);

        // Back
        const drawerBack = new THREE.Mesh(
            new THREE.BoxGeometry(drawerWidth, drawerHeight, drawerThickness),
            drawerMaterial
        );
        drawerBack.position.z = -drawerDepth / 2 + drawerThickness / 2;
        drawerBack.castShadow = true;
        drawerBack.name = `drawer_${i}_back`;
        drawerGroup.add(drawerBack);

        // Drawer handle (positioned on the front face)
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.1),
            handleMaterial
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 0, drawerDepth / 2 + 0.01); // Just in front of drawer front
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
    back.position.set(0, seatHeight + (backHeight - seatHeight) / 2, -0.2);
    back.castShadow = true;
    group.add(back);

    // Legs (4)
    const legGeometry = new THREE.CylinderGeometry(0.025, 0.025, seatHeight);
    const legPositions = [
        [0.2, seatHeight / 2, 0.2],
        [0.2, seatHeight / 2, -0.2],
        [-0.2, seatHeight / 2, 0.2],
        [-0.2, seatHeight / 2, -0.2]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, chairMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        group.add(leg);
    });

    return group;
}

export function createBookshelf(width = 3.0, height = 2.0, depth = 0.4, shelves = 4) {
    const group = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

    // Precise dimensions for perfect fit
    const sideThickness = 0.05;
    const backThickness = 0.02;
    const shelfThickness = 0.03;

    // Calculate exact interior dimensions for book placement
    const interiorWidth = width - (2 * sideThickness); // 3.0 - 0.1 = 2.9
    const interiorDepth = depth - backThickness;

    // Book dimensions
    const bookColors = [0x8B0000, 0x00008B, 0x006400, 0x8B4513, 0x4B0082, 0x800080, 0x2F4F4F, 0x8B4500];
    const bookHeight = 0.25;
    const bookDepth = 0.18;

    // Back panel
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, backThickness),
        woodMaterial
    );
    back.position.set(0, height / 2, -depth / 2 + backThickness / 2);
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    // Sides
    [width / 2, -width / 2].forEach(x => {
        const side = new THREE.Mesh(
            new THREE.BoxGeometry(sideThickness, height, depth),
            woodMaterial
        );
        side.position.set(x - (x > 0 ? sideThickness / 2 : -sideThickness / 2), height / 2, 0);
        side.castShadow = true;
        group.add(side);
    });

    // Shelves (including top and bottom)
    const shelfSpacing = height / shelves;
    for (let i = 0; i <= shelves; i++) {
        const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(interiorWidth, shelfThickness, depth),
            woodMaterial
        );
        shelf.position.set(0, shelfSpacing * i, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        group.add(shelf);
    }

    // Create pre-populated books for each shelf row (interactive groups)
    // Each shelf row is one clickable zone
    group.userData.shelfRows = [];

    for (let shelfIdx = 0; shelfIdx < shelves; shelfIdx++) {
        // Create a group for this shelf row (for interaction)
        const shelfRowGroup = new THREE.Group();
        shelfRowGroup.name = `shelf_row_${shelfIdx}`;

        // Position at shelf height (on top of shelf)
        const shelfY = shelfSpacing * shelfIdx + shelfThickness;
        shelfRowGroup.position.y = shelfY;

        // Calculate number of books to fill the shelf exactly
        // Using varied spine widths for realism
        const booksPerRow = 60 + Math.floor(Math.random() * 10); // 60-70 books
        const bookSpacing = interiorWidth / booksPerRow;
        let xOffset = -interiorWidth / 2;

        for (let bookIdx = 0; bookIdx < booksPerRow; bookIdx++) {
            // Varying spine widths for realism (but calculated to fit exactly)
            const spineWidth = bookSpacing * (0.85 + Math.random() * 0.3); // 85%-115% of average

            const book = new THREE.Mesh(
                new THREE.BoxGeometry(spineWidth, bookHeight, bookDepth),
                new THREE.MeshStandardMaterial({
                    color: bookColors[(shelfIdx * booksPerRow + bookIdx) % bookColors.length],
                    roughness: 0.8
                })
            );

            // Position book on shelf
            book.position.set(
                xOffset + bookSpacing / 2,
                bookHeight / 2,
                -depth / 2 + backThickness + bookDepth / 2 + 0.02 // Just in front of back panel
            );

            // Slight random tilt for realism
            book.rotation.z = (Math.random() - 0.5) * 0.12;
            book.rotation.y = (Math.random() - 0.5) * 0.08;
            book.rotation.x = (Math.random() - 0.5) * 0.05;

            book.castShadow = true;
            shelfRowGroup.add(book);

            xOffset += bookSpacing;
        }

        // Add invisible hitbox for easier interaction with shelf row
        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(interiorWidth, bookHeight * 1.2, bookDepth * 1.3),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.set(
            0,
            bookHeight / 2,
            -depth / 2 + backThickness + bookDepth / 2 + 0.02
        );
        hitbox.name = `shelf_row_${shelfIdx}_hitbox`;
        shelfRowGroup.add(hitbox);

        group.add(shelfRowGroup);
        group.userData.shelfRows.push(shelfRowGroup);
    }

    return group;
}

export function createFilingCabinet(width = 0.5, height = 1.0, depth = 0.6, drawers = 3) {
    const group = new THREE.Group();

    // Materials with better appearance
    const cabinetMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a, // Darker gray
        metalness: 0.7,
        roughness: 0.3
    });

    const drawerMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        metalness: 0.6,
        roughness: 0.4
    });

    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        metalness: 0.9,
        roughness: 0.2
    });

    // Cabinet body (main frame)
    const bodyThickness = 0.02;

    // Back panel
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, bodyThickness),
        cabinetMaterial
    );
    back.position.set(0, height / 2, -depth / 2 + bodyThickness / 2);
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    // Left side
    const leftSide = new THREE.Mesh(
        new THREE.BoxGeometry(bodyThickness, height, depth),
        cabinetMaterial
    );
    leftSide.position.set(-width / 2 + bodyThickness / 2, height / 2, 0);
    leftSide.castShadow = true;
    leftSide.receiveShadow = true;
    group.add(leftSide);

    // Right side
    const rightSide = new THREE.Mesh(
        new THREE.BoxGeometry(bodyThickness, height, depth),
        cabinetMaterial
    );
    rightSide.position.set(width / 2 - bodyThickness / 2, height / 2, 0);
    rightSide.castShadow = true;
    rightSide.receiveShadow = true;
    group.add(rightSide);

    // Top
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(width, bodyThickness, depth),
        cabinetMaterial
    );
    top.position.set(0, height - bodyThickness / 2, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Base/feet (slightly raised)
    const baseHeight = 0.05;
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.04, baseHeight, depth - 0.04),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.5 })
    );
    base.position.set(0, baseHeight / 2, 0);
    base.castShadow = true;
    group.add(base);

    // Drawers with detail
    const drawerHeight = (height - baseHeight - bodyThickness) / drawers;
    const drawerInset = 0.01;

    for (let i = 0; i < drawers; i++) {
        const drawerY = baseHeight + (i * drawerHeight) + drawerHeight / 2;

        // Drawer front (beveled appearance)
        const drawerFront = new THREE.Mesh(
            new THREE.BoxGeometry(
                width - bodyThickness * 2 - drawerInset * 2,
                drawerHeight - drawerInset * 2,
                0.03
            ),
            drawerMaterial
        );
        drawerFront.position.set(0, drawerY, depth / 2 - 0.015);
        drawerFront.castShadow = true;
        group.add(drawerFront);

        // Label holder (metal card holder on drawer)
        const labelHolder = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.5, drawerHeight * 0.2, 0.015),
            handleMaterial
        );
        labelHolder.position.set(0, drawerY, depth / 2 + 0.005);
        group.add(labelHolder);

        // Label background (white paper look)
        const label = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.45, drawerHeight * 0.15, 0.01),
            new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 })
        );
        label.position.set(0, drawerY, depth / 2 + 0.012);
        group.add(label);

        // Handle (recessed pull)
        const handleWidth = 0.12;
        const handleHeight = 0.015;
        const handleDepth = 0.02;

        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(handleWidth, handleHeight, handleDepth),
            handleMaterial
        );
        handle.position.set(0, drawerY - drawerHeight * 0.25, depth / 2 + handleDepth / 2);
        handle.castShadow = true;
        group.add(handle);

        // Lock mechanism (small circle)
        const lock = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.01, 16),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
        );
        lock.rotation.x = Math.PI / 2;
        lock.position.set(0, drawerY + drawerHeight * 0.25, depth / 2 + 0.005);
        group.add(lock);
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
    back.position.set(0, seatHeight + 0.4, -depth / 2 + 0.1);
    back.castShadow = true;
    group.add(back);

    // Armrests
    [-width / 2 + 0.1, width / 2 - 0.1].forEach(x => {
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
        [width / 2 - 0.2, seatHeight / 2 - 0.05, depth / 2 - 0.2],
        [width / 2 - 0.2, seatHeight / 2 - 0.05, -depth / 2 + 0.2],
        [-width / 2 + 0.2, seatHeight / 2 - 0.05, depth / 2 - 0.2],
        [-width / 2 + 0.2, seatHeight / 2 - 0.05, -depth / 2 + 0.2]
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
        [width / 2 - 0.1, height / 2, depth / 2 - 0.1],
        [width / 2 - 0.1, height / 2, -depth / 2 + 0.1],
        [-width / 2 + 0.1, height / 2, depth / 2 - 0.1],
        [-width / 2 + 0.1, height / 2, -depth / 2 + 0.1]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        group.add(leg);
    });

    return group;
}

export function createArmchair(width = 0.9, depth = 0.9, seatHeight = 0.45) {
    const group = new THREE.Group();
    const fabricMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });
    const cushionMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 0.85 });

    // Seat cushion
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.2, 0.15, depth - 0.2),
        cushionMaterial
    );
    seat.position.y = seatHeight;
    seat.castShadow = true;
    group.add(seat);

    // Backrest
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.7, 0.15),
        fabricMaterial
    );
    back.position.set(0, seatHeight + 0.45, -depth / 2 + 0.075);
    back.castShadow = true;
    group.add(back);

    // Armrests
    [-width / 2 + 0.1, width / 2 - 0.1].forEach(x => {
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.5, depth - 0.2),
            fabricMaterial
        );
        arm.position.set(x, seatHeight + 0.15, 0);
        arm.castShadow = true;
        group.add(arm);
    });

    // Base/frame (slightly visible under seat)
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.1, depth),
        new THREE.MeshStandardMaterial({ color: 0x3a2a1a })
    );
    base.position.y = seatHeight - 0.1;
    base.castShadow = true;
    group.add(base);

    // Legs (simple)
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, seatHeight - 0.15);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
    const legPositions = [
        [width / 2 - 0.15, (seatHeight - 0.15) / 2, depth / 2 - 0.15],
        [width / 2 - 0.15, (seatHeight - 0.15) / 2, -depth / 2 + 0.15],
        [-width / 2 + 0.15, (seatHeight - 0.15) / 2, depth / 2 - 0.15],
        [-width / 2 + 0.15, (seatHeight - 0.15) / 2, -depth / 2 + 0.15]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        group.add(leg);
    });

    return group;
}

export function createRug(width = 2.5, depth = 2.0) {
    const group = new THREE.Group();
    const rugMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4726,
        roughness: 0.95
    });

    // Main rug body
    const rug = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.02, depth),
        rugMaterial
    );
    rug.position.y = 0.01;
    rug.receiveShadow = true;
    group.add(rug);

    // Decorative border pattern
    const borderMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a3819,
        roughness: 0.95
    });

    const borderThickness = 0.15;
    // Top and bottom borders
    [depth / 2 - borderThickness / 2, -depth / 2 + borderThickness / 2].forEach(z => {
        const border = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.025, borderThickness),
            borderMaterial
        );
        border.position.set(0, 0.015, z);
        group.add(border);
    });

    // Left and right borders
    [-width / 2 + borderThickness / 2, width / 2 - borderThickness / 2].forEach(x => {
        const border = new THREE.Mesh(
            new THREE.BoxGeometry(borderThickness, 0.025, depth - 2 * borderThickness),
            borderMaterial
        );
        border.position.set(x, 0.015, 0);
        group.add(border);
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
    screen.position.set(0, 0.05 + screenHeight / 2, 0);
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
                -width / 2 + 0.05 + col * 0.035,
                0.025,
                -depth / 2 + 0.03 + row * 0.035
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
    body.position.y = height / 2;
    body.castShadow = true;
    body.name = "safe";
    group.add(body);

    // Door (front face)
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.9, height * 0.9, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    door.position.set(0, height / 2, depth / 2 + 0.01);
    group.add(door);

    // Combination dial
    const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
    );
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, height / 2 + 0.2, depth / 2 + 0.03);
    group.add(dial);

    // Handle
    const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.2, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
    );
    handle.position.set(0.2, height / 2, depth / 2 + 0.03);
    group.add(handle);

    return group;
}

export function createPaperShredder() {
    const group = new THREE.Group();
    const bodyColor = 0x2a2a2a; // Dark grey
    const topColor = 0x1a1a1a;  // Almost black

    // Bin (Bottom)
    const bin = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.2),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 })
    );
    bin.position.y = 0.2;
    bin.castShadow = true;
    group.add(bin);

    // Shredder Head (Top)
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.1, 0.22),
        new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.5 })
    );
    head.position.y = 0.45;
    head.castShadow = true;
    head.name = "shredder"; // Interactable part
    group.add(head);

    // Slot
    const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.01, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    slot.position.y = 0.5;
    group.add(slot);

    // Add invisible hitbox for easier clicking
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.6, 0.3),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 0.3;
    hitbox.name = "shredder_hitbox";
    group.add(hitbox);

    return group;
}

// ===== CLUTTER & DECOR =====

export function createPaperStack(count = 5) {
    const group = new THREE.Group();
    const paperMaterial = new THREE.MeshStandardMaterial({
        color: 0xfffdf0,
        roughness: 0.9,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < count; i++) {
        const width = 0.21; // A4 approx
        const height = 0.297;

        const paper = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.001, height),
            paperMaterial
        );

        // Stack them with slight randomness
        paper.position.y = i * 0.0015;
        paper.rotation.y = (Math.random() - 0.5) * 0.2; // Random rotation
        paper.position.x = (Math.random() - 0.5) * 0.02; // Random offset
        paper.position.z = (Math.random() - 0.5) * 0.02;

        paper.castShadow = true;
        group.add(paper);
    }

    return group;
}

export function createCardboardBox(width = 0.4, height = 0.3, depth = 0.4) {
    const group = new THREE.Group();
    const cardboardMaterial = new THREE.MeshStandardMaterial({
        color: 0x8d6e63, // Brown
        roughness: 0.9
    });
    const tapeMaterial = new THREE.MeshStandardMaterial({
        color: 0xd7ccc8, // Lighter tape
        roughness: 0.6
    });

    // Main box
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        cardboardMaterial
    );
    box.position.y = height / 2;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Tape across top
    const tape = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.01, 0.005, 0.05),
        tapeMaterial
    );
    tape.position.y = height;
    group.add(tape);

    return group;
}

export function createWhiteboard(width = 2.0, height = 1.2) {
    const group = new THREE.Group();

    // Frame
    const frameThickness = 0.02;
    const frameDepth = 0.02;
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.6 }); // Silver

    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width + frameThickness * 2, height + frameThickness * 2, frameDepth),
        frameMaterial
    );
    frame.castShadow = true;
    group.add(frame);

    // Board surface
    const boardMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1
    });
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, frameDepth / 2),
        boardMaterial
    );
    board.position.z = frameDepth / 2 + 0.001;
    group.add(board);

    // Tray
    const tray = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.05, 0.1),
        frameMaterial
    );
    tray.position.set(0, -height / 2 - 0.025, 0.05);
    group.add(tray);

    // Eraser
    const eraser = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.03, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    eraser.position.set(width / 3, -height / 2 - 0.01, 0.05);
    eraser.rotation.x = 0.2;
    group.add(eraser);

    // Markers
    const markerColors = [0xff0000, 0x0000ff, 0x000000];
    markerColors.forEach((col, i) => {
        const marker = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.12),
            new THREE.MeshStandardMaterial({ color: col })
        );
        marker.rotation.z = Math.PI / 2;
        marker.position.set(-width / 3 + i * 0.05, -height / 2 - 0.015, 0.05);
        group.add(marker);
    });

    return group;
}

export function createScatteredBooks(count = 3) {
    const group = new THREE.Group();
    const bookColors = [0x8B0000, 0x00008B, 0x006400, 0x8B4513];

    for (let i = 0; i < count; i++) {
        const width = 0.15 + Math.random() * 0.05;
        const length = 0.22 + Math.random() * 0.05;
        const thickness = 0.03 + Math.random() * 0.04;

        const book = new THREE.Mesh(
            new THREE.BoxGeometry(width, thickness, length),
            new THREE.MeshStandardMaterial({
                color: bookColors[Math.floor(Math.random() * bookColors.length)],
                roughness: 0.7
            })
        );

        // Stack or scatter
        book.position.y = i * thickness + thickness / 2;
        book.rotation.y = Math.random() * Math.PI * 2;
        book.position.x = (Math.random() - 0.5) * 0.1;
        book.position.z = (Math.random() - 0.5) * 0.1;

        book.castShadow = true;
        group.add(book);
    }

    return group;
}

export function createRoundTable(radius = 0.6, height = 0.75) {
    const group = new THREE.Group();
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });

    // Table Top
    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 0.05, 32),
        woodMaterial
    );
    top.position.y = height;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Central Leg
    const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, height),
        woodMaterial
    );
    leg.position.y = height / 2;
    leg.castShadow = true;
    group.add(leg);

    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.05, 16),
        woodMaterial
    );
    base.position.y = 0.025;
    base.castShadow = true;
    group.add(base);

    return group;
}

export function createSimpleChair(seatHeight = 0.45) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

    // Seat
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.05, 0.4),
        material
    );
    seat.position.y = seatHeight;
    seat.castShadow = true;
    group.add(seat);

    // Back
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.05),
        material
    );
    back.position.set(0, seatHeight + 0.2, -0.175);
    back.castShadow = true;
    group.add(back);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, seatHeight);
    const legPos = [
        [0.15, seatHeight / 2, 0.15],
        [0.15, seatHeight / 2, -0.15],
        [-0.15, seatHeight / 2, 0.15],
        [-0.15, seatHeight / 2, -0.15]
    ];

    legPos.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x666666 }));
        leg.position.set(...pos);
        group.add(leg);
    });

    return group;
}

export function createWaterCooler() {
    const group = new THREE.Group();

    // Base unit
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.0, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 })
    );
    base.position.y = 0.5;
    base.castShadow = true;
    group.add(base);

    // Water Bottle
    const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.4, 16),
        new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1
        })
    );
    bottle.position.y = 1.2;
    group.add(bottle);

    // Taps
    const tapRed = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    tapRed.position.set(0.08, 0.75, 0.18);
    group.add(tapRed);

    const tapBlue = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    tapBlue.position.set(-0.08, 0.75, 0.18);
    group.add(tapBlue);

    return group;
}

export function createCorkboard(width = 1.2, height = 0.8) {
    const group = new THREE.Group();

    // Frame
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.04, height + 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x5d4037 })
    );
    group.add(frame);

    // Cork
    const cork = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.025),
        new THREE.MeshStandardMaterial({ color: 0xc19a6b, roughness: 0.9 })
    );
    group.add(cork);

    // Notes
    const noteColors = [0xffffcc, 0xffccff, 0xccffff];
    for (let i = 0; i < 5; i++) {
        const note = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: noteColors[i % 3], side: THREE.DoubleSide })
        );
        note.position.set(
            (Math.random() - 0.5) * width * 0.8,
            (Math.random() - 0.5) * height * 0.8,
            0.015
        );
        note.rotation.z = (Math.random() - 0.5) * 0.5;
        group.add(note);

        // Pin
        const pin = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        pin.position.copy(note.position);
        pin.position.z += 0.005;
        group.add(pin);
    }

    return group;
}

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

export function createPainting(width = 1.0, height = 0.8) {
    const group = new THREE.Group();

    // Frame
    const frameWidth = 0.05;
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x3d2f1f }) // Dark wood
    );
    group.add(frame);

    // Canvas/Picture
    const canvas = new THREE.Mesh(
        new THREE.BoxGeometry(width - frameWidth * 2, height - frameWidth * 2, 0.02),
        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }) // Random color abstract art
    );
    canvas.position.z = 0.02;
    group.add(canvas);

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
    handle.position.y = height / 2 + 0.05;
    group.add(handle);

    // Latches
    [-width / 4, width / 4].forEach(x => {
        const latch = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.02, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
        );
        latch.position.set(x, 0, depth / 2 + 0.01);
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
    can.position.y = height / 2;
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
    pole.position.y = height / 2;
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
    [height / 2, -height / 2].forEach(y => {
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, 0.12),
            frameMaterial
        );
        frame.position.y = y;
        group.add(frame);
    });

    // Left/Right
    [-width / 2, width / 2].forEach(x => {
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
    tray.position.set(0, -height / 2 - 0.05, 0.05);
    group.add(tray);

    return group;
}

export function createTVStand(screenWidth = 1.2, screenHeight = 0.7, standWidth = 1.5) {
    const group = new THREE.Group();

    // TV Stand/Cabinet
    const standHeight = 0.5;
    const standDepth = 0.4;
    const standMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6 });

    const stand = new THREE.Mesh(
        new THREE.BoxGeometry(standWidth, standHeight, standDepth),
        standMaterial
    );
    stand.position.y = standHeight / 2;
    stand.castShadow = true;
    group.add(stand);

    // TV Screen (mounted on top of stand)
    const tvThickness = 0.08;
    const screen = new THREE.Mesh(
        new THREE.BoxGeometry(screenWidth, screenHeight, tvThickness),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2 })
    );
    screen.position.set(0, standHeight + screenHeight / 2 + 0.05, 0);
    screen.castShadow = true;
    screen.name = "tv_screen";
    group.add(screen);

    // TV Frame
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 });
    const frameThickness = 0.05;

    // Top/Bottom frame
    [screenHeight / 2, -screenHeight / 2].forEach(y => {
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(screenWidth + frameThickness * 2, frameThickness, tvThickness),
            frameMaterial
        );
        frame.position.set(0, standHeight + screenHeight / 2 + 0.05 + y, 0);
        group.add(frame);
    });

    // Left/Right frame
    [-screenWidth / 2 - frameThickness / 2, screenWidth / 2 + frameThickness / 2].forEach(x => {
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, screenHeight, tvThickness),
            frameMaterial
        );
        frame.position.set(x, standHeight + screenHeight / 2 + 0.05, 0);
        group.add(frame);
    });

    return group;
}

export function createCoffeeCup(radius = 0.04, height = 0.1) {
    const group = new THREE.Group();
    const cupMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.6 });

    // Cup body
    const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.9, radius * 0.8, height, 16),
        cupMaterial
    );
    cup.position.y = height / 2;
    cup.castShadow = true;
    group.add(cup);

    // Coffee inside
    const coffee = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, 0.01, 16),
        new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.4 })
    );
    coffee.position.y = height * 0.9;
    group.add(coffee);

    // Handle
    const handleGeometry = new THREE.TorusGeometry(radius * 0.6, radius * 0.15, 8, 12, Math.PI);
    const handle = new THREE.Mesh(
        handleGeometry,
        cupMaterial
    );
    handle.rotation.z = -Math.PI / 2;
    handle.rotation.y = Math.PI / 2;
    handle.position.set(radius * 0.9, height * 0.6, 0);
    handle.castShadow = true;
    group.add(handle);

    return group;
}

export function createNewspaper(width = 0.3, height = 0.4) {
    const group = new THREE.Group();

    // Create canvas texture for realistic newspaper appearance
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 682; // Newspaper aspect ratio
    const ctx = canvas.getContext('2d');

    // Background (aged newspaper color)
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some texture/noise for aged paper effect
    ctx.fillStyle = 'rgba(200, 180, 150, 0.05)';
    for (let i = 0; i < 100; i++) {
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 10,
            Math.random() * 10
        );
    }

    // Newspaper header
    ctx.fillStyle = '#000';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE DAILY NEWS', canvas.width / 2, 60);

    // Date
    ctx.font = '16px serif';
    ctx.fillText('Today\'s Edition', canvas.width / 2, 90);

    // Dividing line
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.lineTo(canvas.width - 30, 110);
    ctx.stroke();

    // Headline
    ctx.fillStyle = '#000';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'left';
    ctx.fillText('BREAKING:', 40, 150);
    ctx.fillText('Local Office Mystery', 40, 190);

    // Article text (simulated with lines)
    ctx.font = '14px serif';
    ctx.fillStyle = '#333';
    const articleY = 230;
    const lineHeight = 18;
    const lines = [
        'Investigators are looking into',
        'strange occurrences at a local',
        'office building. Sources report',
        'unusual activities and hidden',
        'secrets within the premises.',
        '',
        'Staff members claim they\'ve',
        'discovered mysterious clues',
        'scattered throughout the office,',
        'leading to speculation about',
        'what might be concealed there.',
        '',
        'Authorities recommend anyone',
        'visiting the location to keep',
        'an eye out for anything unusual.',
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 40, articleY + (i * lineHeight));
    });

    // Second column
    ctx.fillText('In related news, experts', 290, articleY);
    ctx.fillText('suggest that solving', 290, articleY + lineHeight);
    ctx.fillText('puzzles may help unlock', 290, articleY + lineHeight * 2);
    ctx.fillText('hidden compartments.', 290, articleY + lineHeight * 3);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const paperMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.9,
        side: THREE.DoubleSide
    });

    // Single sheet newspaper (flat on table with slight wrinkle)
    const newspaper = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        paperMaterial
    );
    newspaper.rotation.x = -Math.PI / 2; // Lay flat
    newspaper.position.y = 0.002; // Just above surface
    newspaper.castShadow = true;
    newspaper.receiveShadow = true;
    group.add(newspaper);

    return group;
}

export function createRemote(length = 0.15, width = 0.05) {
    const group = new THREE.Group();
    const remoteMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });

    // Remote body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.015, length),
        remoteMaterial
    );
    body.position.y = 0.0075;
    body.castShadow = true;
    group.add(body);

    // Buttons (simple colored squares)
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.3 });
    const buttonSize = width * 0.15;

    // Create a grid of buttons
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 2; col++) {
            const button = new THREE.Mesh(
                new THREE.BoxGeometry(buttonSize, 0.003, buttonSize),
                buttonMaterial
            );
            button.position.set(
                -width * 0.2 + col * width * 0.4,
                0.017,
                -length * 0.3 + row * length * 0.18
            );
            group.add(button);
        }
    }

    // Power button (red)
    const powerButton = new THREE.Mesh(
        new THREE.CylinderGeometry(buttonSize * 0.5, buttonSize * 0.5, 0.003, 12),
        new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.3 })
    );
    powerButton.rotation.x = Math.PI / 2;
    powerButton.position.set(0, 0.017, length * 0.35);
    group.add(powerButton);

    // Add larger invisible hitbox for easier interaction
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(width * 2.5, 0.05, length * 1.5),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    hitbox.position.y = 0.025;
    hitbox.visible = false;
    group.add(hitbox);

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
            -width / 2,
            height * 0.4,
            -depth / 2 + 0.02 + (i * (depth - 0.04) / 7)
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

// ===== UTILITY FUNCTIONS =====

/**
 * Adds an invisible hitbox to an object to make it easier to interact with.
 * This is especially useful for small objects like books, pens, plants, etc.
 *
 * @param {THREE.Object3D} object - The object to add a hitbox to
 * @param {Object} size - Size of the hitbox {width, height, depth}
 * @param {Object} offset - Position offset for the hitbox {x, y, z}
 * @param {string} name - Name for the hitbox (for interaction)
 * @returns {THREE.Mesh} The invisible hitbox mesh
 */
export function addInvisibleHitbox(object, size = { width: 0.3, height: 0.3, depth: 0.3 }, offset = { x: 0, y: 0, z: 0 }, name = null) {
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(size.width, size.height, size.depth),
        new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        })
    );

    hitbox.position.set(offset.x, offset.y, offset.z);

    if (name) {
        hitbox.name = name;
    }

    // Make the hitbox a child of the object
    object.add(hitbox);

    return hitbox;
}

/**
 * Creates an interactable wrapper for small objects.
 * The wrapper includes the original object plus a larger invisible hitbox.
 *
 * @param {THREE.Object3D} object - The small object to wrap
 * @param {string} name - Name for interaction
 * @param {Object} hitboxSize - Optional size override for hitbox
 * @returns {Object} Object with .group (the wrapper) and .hitbox (the invisible mesh to add to interactables)
 */
export function createInteractableWrapper(object, name, hitboxSize = null) {
    const group = new THREE.Group();
    group.add(object);

    // Default hitbox size - generous for easy clicking
    const defaultSize = {
        width: 0.4,
        height: 0.4,
        depth: 0.4
    };

    const size = hitboxSize || defaultSize;
    const hitbox = addInvisibleHitbox(group, size, { x: 0, y: 0, z: 0 }, name);

    return {
        group: group,
        hitbox: hitbox
    };
}
