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
- **[modelLoader.js](assets/js/modelLoader.js)**: GLB/GLTF model loading utilities
- **[materials.js](assets/js/materials.js)**: Reusable Three.js materials
- **[utils.js](assets/js/utils.js)**: Helper functions (createBox, etc.)
- **[touchControls.js](assets/js/touchControls.js)**: Mobile touch control system
- **[touchUtils.js](assets/js/touchUtils.js)**: Touch interaction helpers
- **[prefabs/](assets/js/prefabs/)**: Reusable scene objects (desk, clock, shelves)

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
│   │   ├── modelLoader.js         # Model loading utilities
│   │   ├── materials.js           # Reusable materials
│   │   ├── utils.js               # Helper functions
│   │   ├── touchControls.js       # Touch controls
│   │   ├── touchUtils.js          # Touch utilities
│   │   └── prefabs/               # Reusable objects
│   │       ├── desk.js
│   │       ├── clock.js
│   │       └── shelves.js
│   ├── css/
│   │   └── main.css               # Shared styles
│   └── models/                    # GLB/GLTF 3D models
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
import { loadModel } from './modelLoader.js';
import { showModal } from './ui.js';
import { initGame } from './gameLogic.js';

async function buildMyRoomScene(engine) {
    const scene = engine.scene;

    // Add floor
    const floor = await loadModel('assets/models/floorFull.glb');
    // ... add tiles

    // Add walls, furniture, props
    // ...

    // Add interactables
    const desk = await loadModel('assets/models/desk.glb');
    desk.name = "desk";
    engine.interactables.push(desk);
    scene.add(desk);
}

async function initMyRoom() {
    const engine = new RoomEngine({
        roomWidth: 10,
        roomDepth: 10,
        enableProceduralRoom: false,  // Build custom scene
        enableDoor: true,
        enableTimer: true,
        onInteract: (name, obj) => {
            showModal(name, {});
        }
    });

    await buildMyRoomScene(engine);
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
const object = await loadModel('path/to/model.glb');
object.name = "unique_identifier";
engine.interactables.push(object);
scene.add(object);
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

### 3. Async Scene Building
Rooms load models asynchronously:
```javascript
async function buildScene(engine) {
    const model1 = await loadModel('model1.glb');
    const model2 = await loadModel('model2.glb');
    // Build scene...
}
```

### 4. Dynamic Bounds
RoomEngine automatically constrains camera movement. Override with:
```javascript
engine.roomBounds = {
    minX: -5, maxX: 5,
    minZ: -5, maxZ: 5
};
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
- Ensure object is added to `engine.interactables`
- Check object has a `name` property
- Verify raycasting is working (check crosshair highlight)

**Models not loading:**
- Check file path is correct
- Use browser DevTools Network tab
- Ensure GLB file is valid

**Controls not working:**
- Check instructions modal is dismissed
- Verify no JavaScript errors in console
- Test on different browsers/devices

## Performance Tips

1. **Use model cloning** for repeated objects:
```javascript
const tile = baseFloor.clone();
```

2. **Limit interactables** - only add clickable objects
3. **Use fog** to hide far geometry
4. **Optimize shadow maps** - set appropriate resolution
5. **Test on mobile** - touch controls may need adjustment

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
