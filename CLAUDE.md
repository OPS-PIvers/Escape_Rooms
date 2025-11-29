# Escape Rooms - Architecture Documentation

## Overview

This project contains multiple escape room experiences built with Three.js. The codebase uses a **shared engine architecture** that allows for code reuse while keeping individual rooms easy to customize.

## Architecture

### Core Components

#### 1. **RoomEngine** ([assets/js/roomEngine.js](assets/js/roomEngine.js))
The shared foundation for all escape rooms. Provides:
- **Camera system**: First-person camera with keyboard (WASD), mouse, and touch controls
- **Raycasting**: Object interaction via click/tap
- **Input handling**: Unified keyboard, mouse, and touch input
- **Timer system**: Countdown timer with canvas-based display
- **Door system**: Procedural door with lock, handle, and open/close animation
- **Collision detection**: Configurable room bounds
- **Animation loop**: Optimized render loop with delta time
- **Procedural room generation** (optional): Creates basic room geometry

**Configuration Options:**
```javascript
new RoomEngine({
    roomWidth: 10,           // Room width in units
    roomDepth: 10,           // Room depth in units
    wallThickness: 0.5,      // Wall thickness
    enableDoor: true,        // Enable procedural door
    enableTimer: true,       // Enable countdown timer
    enableProceduralRoom: true,  // Generate basic room geometry
    cameraX: 0,              // Initial camera X position
    cameraZ: 0,              // Initial camera Z position
    onInteract: (name, obj) => {}  // Custom interaction handler
})
```

#### 2. **Game Rooms** ([assets/js/office.js](assets/js/office.js), [assets/js/classroom.js](assets/js/classroom.js))
Room-specific implementations that:
- Create a `RoomEngine` instance with custom configuration
- Build room-specific scene content (walls, furniture, props)
- Define interactable objects
- Integrate with game logic (puzzles, clues, win conditions)

**Structure:**
```javascript
async function buildRoomScene(engine) {
    // Build walls, floor, ceiling
    // Add furniture and props
    // Register interactables with engine.interactables
}

async function initRoom() {
    const engine = new RoomEngine({ /* config */ });
    await buildRoomScene(engine);
    initGame(); // Game logic
    engine.start();
}
```

#### 3. **Blank Room Template** ([assets/js/blank_room_template.js](assets/js/blank_room_template.js))
A **self-contained** reference implementation that:
- Shows how everything works in a single file
- Serves as a learning tool and starting point
- Does NOT use RoomEngine (intentionally independent)
- Demonstrates all core concepts without dependencies

**Use this when:**
- Learning how the system works
- Creating a completely standalone room
- Understanding the underlying mechanics

#### 4. **Game Logic** ([assets/js/gameLogic.js](assets/js/gameLogic.js))
Shared puzzle and clue system:
- Question pools
- Clue distribution
- Safe/lock combinations
- Win conditions
- Multiple game modes (classic, hidden_key, etc.)

#### 5. **UI System** ([assets/js/ui.js](assets/js/ui.js))
Modal dialogs and user interface:
- Clue display
- Victory screen
- Question/answer interface
- Modal open/close management

#### 6. **Support Modules**
- **[constants.js](assets/js/constants.js)**: Shared configuration values
- **[prefabs.js](assets/js/prefabs.js)**: Procedural object generators (desk, chair, bookshelf, safe, etc.)
- **[materials.js](assets/js/materials.js)**: Reusable Three.js materials
- **[utils.js](assets/js/utils.js)**: Helper functions (createBox, etc.)
- **[touchControls.js](assets/js/touchControls.js)**: Mobile touch control system
- **[touchUtils.js](assets/js/touchUtils.js)**: Touch interaction helpers

## File Structure

```
Escape_Rooms/
├── index.html                      # Main menu/landing page
├── office.html                     # Office escape room entry
├── classroom.html                  # Classroom escape room entry
├── blank_room_template.html        # Template room (standalone reference)
├── assets/
│   ├── js/
│   │   ├── roomEngine.js          # ⭐ SHARED ENGINE (all rooms use this)
│   │   ├── office.js              # Office room implementation
│   │   ├── classroom.js           # Classroom room implementation
│   │   ├── blank_room_template.js # Standalone template (no dependencies)
│   │   ├── gameLogic.js           # Puzzle/clue system
│   │   ├── ui.js                  # Modal and UI management
│   │   ├── constants.js           # Shared constants
│   │   ├── prefabs.js             # ⭐ PROCEDURAL OBJECT GENERATORS
│   │   ├── materials.js           # Reusable materials
│   │   ├── utils.js               # Helper functions
│   │   ├── touchControls.js       # Touch controls
│   │   └── touchUtils.js          # Touch utilities
│   └── css/
│       └── main.css               # Shared styles
└── CLAUDE.md                      # This file
```

## Creating a New Room

### Method 1: Using RoomEngine (Recommended)

1. **Create HTML file** (e.g., `myroom.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Escape Room</title>
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <div id="instructions">
        <h1>My Room Title</h1>
        <p><b>CLICK TO START</b></p>
        <p>WASD to Move | ARROWS to Look</p>
        <p>SPACE to Interact/Close | CLICK to Select</p>
    </div>
    <div id="crosshair"></div>
    <div id="clueModal"><!-- ... --></div>
    <div id="victoryModal"><!-- ... --></div>

    <script type="importmap">
        {
            "imports": {
                "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
                "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
            }
        }
    </script>
    <script type="module" src="assets/js/myroom.js"></script>
</body>
</html>
```

2. **Create JavaScript file** (`assets/js/myroom.js`):
```javascript
import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import * as Prefabs from './prefabs.js';
import { showModal } from './ui.js';
import { initGame } from './gameLogic.js';

function buildMyRoomScene(engine) {
    const scene = engine.scene;
    const halfWidth = 5;
    const halfDepth = 5;

    // Add procedural furniture
    const desk = Prefabs.createDesk(1.5, 0.75, 0.8);
    desk.position.set(-halfWidth + 2, 0, -halfDepth + 2);
    desk.name = "desk";
    engine.interactables.push(desk);
    scene.add(desk);

    // Add more objects
    const chair = Prefabs.createChair();
    chair.position.set(-halfWidth + 2, 0, -halfDepth + 3);
    scene.add(chair);

    const safe = Prefabs.createSafe(0.8, 1.0, 0.8);
    safe.position.set(halfWidth - 1, 0, -halfDepth + 1);
    safe.children[0].name = "safe";  // The body is interactable
    engine.interactables.push(safe.children[0]);
    scene.add(safe);
}

function initMyRoom() {
    const engine = new RoomEngine({
        roomWidth: 10,
        roomDepth: 10,
        enableProceduralRoom: true,   // Use procedural room
        enableDoor: true,
        enableTimer: true,
        onInteract: (name, obj) => {
            showModal(name, {});
        }
    });

    buildMyRoomScene(engine);
    initGame();
    engine.start();
}

initMyRoom();
```

### Method 2: Standalone (Like Template)

Copy and modify [blank_room_template.html](blank_room_template.html) and [blank_room_template.js](assets/js/blank_room_template.js).

**Use this when:**
- You want complete control
- You don't need shared game logic
- You're creating a one-off experiment

## Key Design Patterns

### 1. Interactables System
Objects that can be clicked/tapped must be registered:
```javascript
// For single objects
const desk = Prefabs.createDesk(1.5, 0.75, 0.8);
desk.name = "desk";
engine.interactables.push(desk);
scene.add(desk);

// For groups (like safe), register the specific mesh
const safe = Prefabs.createSafe(0.8, 1.0, 0.8);
safe.children[0].name = "safe";  // The body mesh
engine.interactables.push(safe.children[0]);
scene.add(safe);
```

### 2. Interaction Handling
Handle clicks via the `onInteract` callback:
```javascript
new RoomEngine({
    onInteract: (name, obj) => {
        if (name === "desk") {
            showModal("desk", {});
        } else if (name === "safe") {
            // Custom logic
        }
    }
});
```

### 3. Procedural Object Creation
All objects are created using procedural generators from prefabs.js:
```javascript
function buildScene(engine) {
    // Create objects with explicit dimensions
    const desk = Prefabs.createDesk(1.5, 0.75, 0.8);  // width, height, depth
    const chair = Prefabs.createChair(0.5, 0.9);      // seatHeight, backHeight
    const bookshelf = Prefabs.createBookshelf(1.0, 2.0, 0.4, 4);  // w, h, d, shelves

    // Position and add to scene
    desk.position.set(x, y, z);
    scene.add(desk);
}
```

### 4. Available Prefabs
The prefabs.js module provides these generators:

**Furniture:**
- `createDesk(width, height, depth)` - Office/student desk with drawer
- `createChair(seatHeight, backHeight)` - Simple chair with backrest
- `createBookshelf(width, height, depth, shelves)` - Bookshelf with adjustable shelves
- `createFilingCabinet(width, height, depth, drawers)` - Metal filing cabinet
- `createSofa(width, depth, seatHeight)` - Lounge sofa with armrests
- `createCoffeeTable(width, height, depth)` - Glass-top coffee table

**Office Equipment:**
- `createComputer(screenWidth, screenHeight)` - Monitor with stand
- `createKeyboard(width, depth)` - Keyboard with keys
- `createMouse()` - Computer mouse
- `createSafe(width, height, depth)` - Safe with dial and handle

**Decorations:**
- `createGlobe(radius)` - Globe on wooden base
- `createClock(radius)` - Wall clock with hands
- `createBooks(count, stackHeight)` - Stack of books
- `createPlant(potRadius, plantHeight)` - Potted plant
- `createLamp(type)` - Desk or floor lamp ('desk' or 'floor')
- `createBriefcase(width, height, depth)` - Leather briefcase
- `createTrashCan(radius, height)` - Cylindrical trash can
- `createCoatRack(height)` - Standing coat rack
- `createChalkboard(width, height)` - Chalkboard with frame

### 5. Dynamic Bounds
RoomEngine automatically constrains camera movement. Override with:
```javascript
engine.roomBounds = {
    minX: -5, maxX: 5,
    minZ: -5, maxZ: 5
};
```

### 6. Object Orientation and Positioning

**IMPORTANT**: Always consider object orientation when placing furniture and props. Objects must face the correct direction for the scene to make sense.

#### Coordinate System
- **X-axis**: East (+) / West (-)
- **Y-axis**: Up (+) / Down (-)
- **Z-axis**: South (+) / North (-)
- **Rotation**: `rotation.y` controls horizontal facing (yaw)

#### Common Rotation Values
```javascript
0           // Facing North (default, toward -Z)
Math.PI/2   // Facing East  (90° clockwise)
Math.PI     // Facing South (180°)
-Math.PI/2  // Facing West  (90° counter-clockwise)
```

#### Wall-Mounted Objects
When placing objects against walls, consider both position AND rotation:

```javascript
// WRONG: Bookshelf perpendicular to east wall
const bookshelf = Prefabs.createBookshelf(2.5, 2.0, 0.4, 4);
bookshelf.position.set(halfWidth - 0.5, 0, z);  // Against east wall
// No rotation - faces NORTH by default (perpendicular to wall!)
scene.add(bookshelf);

// CORRECT: Bookshelf parallel to east wall, facing west
const bookshelf = Prefabs.createBookshelf(2.5, 2.0, 0.4, 4);
bookshelf.position.set(halfWidth - 0.5, 0, z);  // Against east wall
bookshelf.rotation.y = Math.PI / 2;  // Rotate to face WEST into room
scene.add(bookshelf);
```

#### Orientation by Wall Position

| Wall Position | Rotation | Faces Direction |
|--------------|----------|-----------------|
| **North wall** (Z = -halfDepth) | `0` or `0` | South (into room) |
| **South wall** (Z = +halfDepth) | `Math.PI` | North (into room) |
| **East wall** (X = +halfWidth) | `Math.PI/2` | West (into room) |
| **West wall** (X = -halfWidth) | `-Math.PI/2` | East (into room) |

#### Practical Examples

```javascript
// Desk against north wall, facing south
const desk = Prefabs.createDesk(1.5, 0.75, 0.8);
desk.position.set(0, 0, -halfDepth + 1);
desk.rotation.y = 0;  // Faces south (default)
scene.add(desk);

// Chair facing the desk
const chair = Prefabs.createChair(0.5, 0.9);
chair.position.set(0, 0, -halfDepth + 2);
chair.rotation.y = Math.PI;  // Faces north (toward desk)
scene.add(chair);

// Filing cabinet against west wall
const cabinet = Prefabs.createFilingCabinet(0.5, 1.0, 0.6, 3);
cabinet.position.set(-halfWidth + 0.5, 0, 0);
cabinet.rotation.y = -Math.PI/2;  // Faces east (into room)
scene.add(cabinet);

// Chalkboard on east wall
const chalkboard = Prefabs.createChalkboard(4.0, 2.0);
chalkboard.position.set(halfWidth - 0.1, 1, 0);
chalkboard.rotation.y = Math.PI/2;  // Faces west (into room)
scene.add(chalkboard);
```

#### Items on Rotated Objects
When placing items ON or IN rotated objects (like books on a rotated bookshelf), use the parent's local coordinate system:

```javascript
// Bookshelf rotated to face west
const bookshelf = Prefabs.createBookshelf(2.5, 2.0, 0.4, 4);
bookshelf.position.set(halfWidth - 0.5, 0, 0);
bookshelf.rotation.y = Math.PI/2;
scene.add(bookshelf);

// WRONG: Using world coordinates
const books = Prefabs.createBooks(5, 0.15);
books.position.set(halfWidth - 0.3, 1.0, 0.5);  // Will be misaligned!
scene.add(books);

// CORRECT: Using parent's local space or adjust for rotation
const books = Prefabs.createBooks(5, 0.15);
books.position.set(halfWidth - 0.3, 1.0, 0.5);  // World position
books.rotation.y = Math.PI/2;  // Match parent rotation
scene.add(books);

// OR: Add to parent's local space
const books = Prefabs.createBooks(5, 0.15);
books.position.set(0, 1.0, 0.5);  // Relative to bookshelf center
bookshelf.add(books);  // Inherits parent rotation
```

#### Debugging Orientation Issues
1. **Visualize axes**: Temporarily add axis helpers to objects
2. **Check from above**: Use browser dev tools to inspect object transforms
3. **Console log rotations**: `console.log(object.rotation.y)` to verify angles
4. **Test incrementally**: Rotate by 45° steps to find correct angle

```javascript
// Add temporary axis helper for debugging
import { AxesHelper } from 'three';
const axesHelper = new AxesHelper(1);  // Red=X, Green=Y, Blue=Z
object.add(axesHelper);
```

## Testing & Debugging

### Browser Console
Access exposed objects:
```javascript
window.engine       // RoomEngine instance
window.scene        // Three.js scene
window.camera       // Camera object
window.renderer     // Three.js renderer
window.interactables // Array of clickable objects
```

### Common Issues

**Objects not clickable:**
- Ensure object (or child mesh) is added to `engine.interactables`
- Check object has a `name` property
- Verify raycasting is working (check crosshair highlight)
- For Groups, make sure to register the specific mesh, not the group

**Objects not visible:**
- Check position is within room bounds
- Verify object is added to scene
- Check for JavaScript errors in console
- Ensure shadows are properly configured

**Controls not working:**
- Check instructions modal is dismissed
- Verify no JavaScript errors in console
- Test on different browsers/devices

## Performance Tips

1. **Reuse geometries and materials** for repeated objects:
```javascript
const deskGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.8);
const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
// Reuse for multiple desks
```

2. **Limit interactables** - only add clickable objects
3. **Use fog** to hide far geometry
4. **Optimize shadow maps** - set appropriate resolution
5. **Procedural generation is fast** - no network overhead
6. **Test on mobile** - touch controls may need adjustment

## Version Control

When making changes:
1. Test thoroughly before committing
2. Update cache-busting version in HTML (`?v=hash`)
3. Document breaking changes in this file
4. Keep template standalone (don't add dependencies)

## Future Enhancements

Possible improvements:
- [ ] VR support via WebXR
- [ ] Multiplayer via WebSockets
- [ ] Save/load game state
- [ ] Audio system
- [ ] Particle effects
- [ ] Advanced lighting
- [ ] Procedural content generation

## License

[Add your license here]

## Credits

Built with [Three.js](https://threejs.org/)
