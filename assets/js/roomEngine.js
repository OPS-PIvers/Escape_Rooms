// Room Engine - Shared logic for all escape rooms
// This provides the foundation: controls, camera, raycasting, timer, door, etc.

import * as THREE from 'three';
import {
    ROOM_SIZE,
    WALL_HEIGHT,
    CAMERA_HEIGHT,
    TIMER_DURATION,
    LOOK_SPEED,
    MOVE_SPEED,
    MOUSE_LOOK_SPEED,
    MIN_POLAR_ANGLE,
    MAX_POLAR_ANGLE,
    SCENE_BACKGROUND_COLOR,
    FOG_COLOR,
    FOG_NEAR,
    FOG_FAR
} from './constants.js';
import { TouchControls } from './touchControls.js';
import { closeModal, isInteracting } from './ui.js';

export class RoomEngine {
    constructor(config = {}) {
        // Configuration
        this.config = {
            roomWidth: config.roomWidth || 10,
            roomDepth: config.roomDepth || 10,
            wallThickness: config.wallThickness || 0.5,
            enableDoor: config.enableDoor !== false,
            enableTimer: config.enableTimer !== false,
            enableProceduralRoom: config.enableProceduralRoom !== false,
            onInteract: config.onInteract || null,
            ...config
        };

        // Core Three.js objects
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
        this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(
            config.cameraX || 0,
            CAMERA_HEIGHT,
            config.cameraZ || 0
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Interactables array
        this.interactables = [];

        // Game state
        this.gameWon = false;
        this.timeLeft = TIMER_DURATION;

        // Control state
        this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this._PI_2 = Math.PI / 2;
        this._vector = new THREE.Vector3();
        this.mouse = new THREE.Vector2(0, 0);
        this.mouseDelta = new THREE.Vector2();
        this.lastMousePos = new THREE.Vector2();
        this.isMouseDown = false;
        this.raycaster = new THREE.Raycaster();

        // Room bounds
        const boundSize = (Math.max(this.config.roomWidth, this.config.roomDepth) / 2) - 0.5;
        this.roomBounds = {
            minX: -boundSize,
            maxX: boundSize,
            minZ: -boundSize,
            maxZ: boundSize
        };

        // DOM elements
        this.instructions = document.getElementById('instructions');
        this.crosshair = document.getElementById('crosshair');

        // Door reference
        this.doorPivot = null;
        this.doorHitbox = null;

        // Timer reference
        this.timerTexture = null;
        this.timerCanvas = null;
        this.timerCtx = null;
        this.finalTimeStr = "00:00";

        // Input handling
        this.keys = {
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            w: false, a: false, s: false, d: false,
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            Space: false
        };

        this.touchControls = null;

        // Animation loop reference
        this.prevTime = performance.now();
        this.animationId = null;

        // Initialize
        this._setupLighting();
        if (this.config.enableProceduralRoom) {
            this._createProceduralRoom();
        }
        this._setupInputHandlers();
        this._setupWindowResize();

        // Expose for debugging
        window.camera = this.camera;
        window.scene = this.scene;
        window.renderer = this.renderer;
        window.interactables = this.interactables;
    }

    _setupLighting() {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(-5, 10, -5);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = -10;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    _createProceduralRoom() {
        const roomGroup = new THREE.Group();
        this.scene.add(roomGroup);

        const halfW = this.config.roomWidth / 2;
        const halfD = this.config.roomDepth / 2;

        // Materials
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.2 });

        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.roomWidth, this.config.roomDepth),
            floorMat
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        roomGroup.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.roomWidth, this.config.roomDepth),
            ceilingMat
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = WALL_HEIGHT;
        roomGroup.add(ceiling);

        // Door dimensions
        const doorW = 1.2;
        const doorH = 2.2;

        // South Wall (Z = +halfD) - Solid
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.config.roomWidth, WALL_HEIGHT, this.config.wallThickness),
            wallMat
        );
        southWall.position.set(0, WALL_HEIGHT / 2, halfD);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        roomGroup.add(southWall);

        // East Wall (X = +halfW) - Solid
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.config.wallThickness, WALL_HEIGHT, this.config.roomDepth),
            wallMat
        );
        eastWall.position.set(halfW, WALL_HEIGHT / 2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        roomGroup.add(eastWall);

        // West Wall (X = -halfW) - Solid
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.config.wallThickness, WALL_HEIGHT, this.config.roomDepth),
            wallMat
        );
        westWall.position.set(-halfW, WALL_HEIGHT / 2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        roomGroup.add(westWall);

        // North Wall (Z = -halfD) - With Door Hole
        const sidePartWidth = (this.config.roomWidth - doorW) / 2;

        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(sidePartWidth, WALL_HEIGHT, this.config.wallThickness),
            wallMat
        );
        leftWall.position.set(-(doorW/2 + sidePartWidth/2), WALL_HEIGHT/2, -halfD);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        roomGroup.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(sidePartWidth, WALL_HEIGHT, this.config.wallThickness),
            wallMat
        );
        rightWall.position.set((doorW/2 + sidePartWidth/2), WALL_HEIGHT/2, -halfD);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        roomGroup.add(rightWall);

        const lintelHeight = WALL_HEIGHT - doorH;
        const lintel = new THREE.Mesh(
            new THREE.BoxGeometry(doorW, lintelHeight, this.config.wallThickness),
            wallMat
        );
        lintel.position.set(0, doorH + lintelHeight/2, -halfD);
        lintel.castShadow = true;
        lintel.receiveShadow = true;
        roomGroup.add(lintel);

        if (this.config.enableDoor) {
            this._createDoor(roomGroup, doorW, doorH, -halfD, doorMat, handleMat);
        }

        if (this.config.enableTimer) {
            this._createTimer(roomGroup, doorH, -halfD);
        }

        // Door light
        const doorLight = new THREE.PointLight(0xffaa00, 0.5, 10);
        doorLight.position.set(0, 2, -halfD + 1);
        this.scene.add(doorLight);
    }

    _createDoor(roomGroup, doorW, doorH, wallZ, doorMat, handleMat) {
        this.doorPivot = new THREE.Group();
        this.doorPivot.position.set(-doorW / 2, 0, wallZ);
        roomGroup.add(this.doorPivot);

        const doorThickness = 0.1;
        const doorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(doorW, doorH, doorThickness),
            doorMat
        );
        doorMesh.position.set(doorW / 2, doorH / 2, 0);
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        this.doorPivot.add(doorMesh);

        // Paddle handle
        const handle = this._createPaddleHandle(handleMat);
        handle.position.set((doorW / 2) - 0.15, -0.1, doorThickness/2 + 0.005);
        doorMesh.add(handle);

        // Lock
        const lock = this._createSkeletonKeyLock(handleMat);
        lock.position.set((doorW / 2) - 0.15, 0.05, doorThickness/2 + 0.005);
        doorMesh.add(lock);

        // Hitbox
        this.doorHitbox = new THREE.Mesh(
            new THREE.BoxGeometry(doorW, doorH, 0.5),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.doorHitbox.name = "door";
        this.doorHitbox.position.set(doorW/2, doorH/2, 0);
        this.doorPivot.add(this.doorHitbox);
        this.interactables.push(this.doorHitbox);
    }

    _createPaddleHandle(handleMat) {
        const handleGroup = new THREE.Group();
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.01), handleMat);
        handleGroup.add(plate);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8), handleMat);
        stem.rotation.x = Math.PI / 2;
        stem.position.set(0, 0, 0.03);
        handleGroup.add(stem);
        const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.015), handleMat);
        paddle.position.set(-0.04, 0, 0.06);
        handleGroup.add(paddle);
        return handleGroup;
    }

    _createSkeletonKeyLock(handleMat) {
        const lockGroup = new THREE.Group();
        const lockPlate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.015, 32),
            handleMat
        );
        lockPlate.rotation.x = Math.PI / 2;
        lockPlate.castShadow = true;
        lockPlate.receiveShadow = true;
        lockGroup.add(lockPlate);

        const keyholeOuter = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        keyholeOuter.rotation.x = Math.PI / 2;
        keyholeOuter.position.z = 0.015;
        lockGroup.add(keyholeOuter);

        const keyholeSlot = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.025, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        keyholeSlot.position.set(0, -0.02, 0.015);
        lockGroup.add(keyholeSlot);

        return lockGroup;
    }

    _createTimer(roomGroup, doorH, wallZ) {
        const timerGroup = new THREE.Group();
        timerGroup.position.set(0, doorH + 0.4, wallZ + this.config.wallThickness/2 + 0.05);
        roomGroup.add(timerGroup);

        const timerBoxMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const timerBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.1), timerBoxMat);
        timerGroup.add(timerBox);

        this.timerCanvas = document.createElement('canvas');
        this.timerCanvas.width = 512;
        this.timerCanvas.height = 256;
        this.timerCtx = this.timerCanvas.getContext('2d');
        this.timerTexture = new THREE.CanvasTexture(this.timerCanvas);

        const displayMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 0.25),
            new THREE.MeshBasicMaterial({ map: this.timerTexture })
        );
        displayMesh.position.z = 0.051;
        timerGroup.add(displayMesh);
    }

    _updateTimer(dt) {
        if (!this.config.enableTimer || !this.timerCtx) return;
        if (!this.gameWon) this.timeLeft = Math.max(0, this.timeLeft - dt);

        const m = Math.floor(this.timeLeft / 60);
        const s = Math.floor(this.timeLeft % 60);
        this.finalTimeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        this.timerCtx.fillStyle = '#000000';
        this.timerCtx.fillRect(0, 0, 512, 256);
        this.timerCtx.shadowColor = "#00ff00";
        this.timerCtx.shadowBlur = 20;
        this.timerCtx.fillStyle = '#00ff00';
        this.timerCtx.font = 'bold 120px "Courier New", monospace';
        this.timerCtx.textAlign = 'center';
        this.timerCtx.textBaseline = 'middle';
        this.timerCtx.fillText(this.finalTimeStr, 256, 128);
        this.timerTexture.needsUpdate = true;
    }

    _setupInputHandlers() {
        // Instructions dismiss
        if (this.instructions) {
            const dismissInstructions = () => {
                this.instructions.style.display = 'none';
            };
            this.instructions.addEventListener('click', dismissInstructions);
            this.instructions.addEventListener('touchstart', (e) => {
                e.preventDefault();
                dismissInstructions();
            });
        }

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key) || this.keys.hasOwnProperty(e.code)) {
                this.keys[e.key] = true;
                this.keys[e.code] = true;
            }
            if ((e.code === 'Space' || e.key === ' ')) {
                e.preventDefault();
                if (isInteracting) {
                    closeModal();
                } else {
                    this.interact();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key) || this.keys.hasOwnProperty(e.code)) {
                this.keys[e.key] = false;
                this.keys[e.code] = false;
            }
        });

        // Mouse
        document.addEventListener('mousedown', () => { this.isMouseDown = true; });
        document.addEventListener('mouseup', () => { this.isMouseDown = false; });
        document.addEventListener('mousemove', (event) => {
            const currentlyInteracting = isInteracting;
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            if (this.isMouseDown && !currentlyInteracting) {
                const deltaX = event.clientX - this.lastMousePos.x;
                const deltaY = event.clientY - this.lastMousePos.y;
                this.mouseDelta.x += deltaX;
                this.mouseDelta.y += deltaY;
            }
            this.lastMousePos.set(event.clientX, event.clientY);

            if (!currentlyInteracting && this.crosshair) {
                this.crosshair.style.left = event.clientX + 'px';
                this.crosshair.style.top = event.clientY + 'px';
            }
        });

        document.addEventListener('click', () => {
            if (isInteracting) return;
            this.interact();
        });

        // Touch controls
        const handleTouchInteract = (touchObject) => {
            if (!isInteracting && touchObject) {
                // Use the object from touch raycast, don't do another raycast
                if (this.config.onInteract) {
                    this.config.onInteract(touchObject.name, touchObject);
                }
                // Default door interaction
                if (touchObject.name === "door" && this.doorPivot) {
                    this.toggleDoor();
                }
            }
        };
        this.touchControls = new TouchControls(this.camera, this.raycaster, this.interactables, handleTouchInteract);
    }

    _setupWindowResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    interact() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Use recursive: false to only detect objects directly in interactables array
        // This prevents parent objects from blocking child objects
        const intersects = this.raycaster.intersectObjects(this.interactables, false);
        if (intersects.length > 0) {
            const obj = intersects[0].object;

            // Custom interaction handler
            if (this.config.onInteract) {
                this.config.onInteract(obj.name, obj);
            }

            // Default door interaction
            if (obj.name === "door" && this.doorPivot) {
                this.toggleDoor();
            }
        }
    }

    toggleDoor() {
        if (!this.doorPivot) return;

        if (this.doorPivot.rotation.y === 0) {
            // Open
            const targetRot = -Math.PI / 2;
            const duration = 1000;
            const start = performance.now();
            const animateDoor = (now) => {
                const p = Math.min(1, (now - start) / duration);
                const ease = 1 - Math.pow(1 - p, 3);
                this.doorPivot.rotation.y = targetRot * ease;
                if (p < 1) requestAnimationFrame(animateDoor);
            };
            requestAnimationFrame(animateDoor);
        } else {
            // Close
            const startRot = this.doorPivot.rotation.y;
            const duration = 1000;
            const start = performance.now();
            const animateDoorClose = (now) => {
                const p = Math.min(1, (now - start) / duration);
                const ease = 1 - Math.pow(1 - p, 3);
                this.doorPivot.rotation.y = startRot * (1 - ease);
                if (p < 1) requestAnimationFrame(animateDoorClose);
            };
            requestAnimationFrame(animateDoorClose);
        }
    }

    moveForward(distance) {
        this._vector.setFromMatrixColumn(this.camera.matrix, 0);
        this._vector.crossVectors(this.camera.up, this._vector);
        this.camera.position.addScaledVector(this._vector, distance);
    }

    moveRight(distance) {
        this._vector.setFromMatrixColumn(this.camera.matrix, 0);
        this.camera.position.addScaledVector(this._vector, distance);
    }

    setGameCursor(active) {
        if (active) {
            document.body.classList.add('game-active');
        } else {
            document.body.classList.remove('game-active');
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;
        this.prevTime = time;

        this._updateTimer(delta);

        // Cursor state
        if (!isInteracting && this.instructions && this.instructions.style.display === 'none') {
            this.setGameCursor(true);
        } else {
            this.setGameCursor(false);
        }

        if (!isInteracting) {
            // Crosshair highlight
            this.raycaster.setFromCamera(this.mouse, this.camera);
            // Enable recursive raycasting to detect nested objects
            const intersects = this.raycaster.intersectObjects(this.interactables, true);
            if (this.crosshair) {
                if (intersects.length > 0) {
                    this.crosshair.classList.add('active');
                } else {
                    this.crosshair.classList.remove('active');
                }
            }

            // Camera look
            this._euler.setFromQuaternion(this.camera.quaternion);
            if (this.isMouseDown) {
                this._euler.y -= this.mouseDelta.x * MOUSE_LOOK_SPEED;
                this._euler.x -= this.mouseDelta.y * MOUSE_LOOK_SPEED;
            }
            this.mouseDelta.set(0, 0);

            if (this.keys.ArrowLeft) this._euler.y += LOOK_SPEED * delta;
            if (this.keys.ArrowRight) this._euler.y -= LOOK_SPEED * delta;
            if (this.keys.ArrowUp) this._euler.x += LOOK_SPEED * delta;
            if (this.keys.ArrowDown) this._euler.x -= LOOK_SPEED * delta;

            if (this.touchControls) {
                const lookDelta = this.touchControls.getLookDelta();
                this._euler.y -= lookDelta.x * 2;
                this._euler.x -= lookDelta.y * 2;
            }

            this._euler.x = Math.max(this._PI_2 - MAX_POLAR_ANGLE, Math.min(this._PI_2 - MIN_POLAR_ANGLE, this._euler.x));
            this.camera.quaternion.setFromEuler(this._euler);

            // Movement
            const actualSpeed = MOVE_SPEED * delta;
            if (this.keys.w || this.keys.KeyW) this.moveForward(actualSpeed);
            if (this.keys.s || this.keys.KeyS) this.moveForward(-actualSpeed);
            if (this.keys.a || this.keys.KeyA) this.moveRight(-actualSpeed);
            if (this.keys.d || this.keys.KeyD) this.moveRight(actualSpeed);

            if (this.touchControls) {
                const moveState = this.touchControls.getMovement();
                if (moveState.forward) this.moveForward(actualSpeed);
                if (moveState.backward) this.moveForward(-actualSpeed);
                if (moveState.left) this.moveRight(-actualSpeed);
                if (moveState.right) this.moveRight(actualSpeed);
            }

            // Collision bounds
            const pos = this.camera.position;
            pos.x = Math.max(this.roomBounds.minX, Math.min(this.roomBounds.maxX, pos.x));
            pos.z = Math.max(this.roomBounds.minZ, Math.min(this.roomBounds.maxZ, pos.z));
        }

        this.renderer.render(this.scene, this.camera);
    }

    // Public method to create door for custom rooms
    createDoor(position = null) {
        if (!this.config.enableDoor) return;

        const halfD = this.config.roomDepth / 2;
        const doorW = 1.2;
        const doorH = 2.2;
        const wallZ = position?.z ?? -halfD;

        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.2 });

        // Create a group for the door if we don't have a room group
        const doorGroup = new THREE.Group();
        this.scene.add(doorGroup);

        this._createDoor(doorGroup, doorW, doorH, wallZ, doorMat, handleMat);

        // Add light near door
        const doorLight = new THREE.PointLight(0xffaa00, 0.5, 10);
        doorLight.position.set(0, 2, wallZ + 1);
        this.scene.add(doorLight);
    }

    // Public method to create timer for custom rooms
    createTimer(position = null) {
        if (!this.config.enableTimer) return;

        const halfD = this.config.roomDepth / 2;
        const doorH = 2.2;
        const wallZ = position?.z ?? -halfD;

        // Create a group for the timer
        const timerGroup = new THREE.Group();
        this.scene.add(timerGroup);

        this._createTimer(timerGroup, doorH, wallZ);
    }

    start() {
        this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}
