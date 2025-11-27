import * as THREE from 'three';
import { initClassroom } from './classroom.js';
import { initOffice } from './office.js';
import { interactables } from './utils.js';
import { initGame as initGameLogic } from './gameLogic.js';
import { showModal, closeModal, isInteracting } from './ui.js';
import { TouchControls } from './touchControls.js';
import { createTouchInteractionHandler } from './touchUtils.js';

/**
 * InputManager
 * Handles keyboard and mouse state to decouple input from game logic.
 */
class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = new THREE.Vector2(0, 0);
        this.mouseDelta = new THREE.Vector2(0, 0);
        this.isMouseDown = false;
        this.lastMousePos = new THREE.Vector2();

        this._setupListeners();
    }

    _setupListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => this._onKeyDown(e));
        document.addEventListener('keyup', (e) => this._onKeyUp(e));

        // Mouse
        document.addEventListener('mousedown', () => { this.isMouseDown = true; });
        document.addEventListener('mouseup', () => { this.isMouseDown = false; });
        document.addEventListener('mousemove', (e) => this._onMouseMove(e));
    }

    _onKeyDown(e) {
        this.keys[e.key] = true;
        this.keys[e.code] = true;
    }

    _onKeyUp(e) {
        this.keys[e.key] = false;
        this.keys[e.code] = false;
    }

    _onMouseMove(event) {
        // Normalize mouse coordinates for Raycaster
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Calculate delta for look controls if dragging and not interacting
        if (this.isMouseDown && !isInteracting) {
            const deltaX = event.clientX - this.lastMousePos.x;
            const deltaY = event.clientY - this.lastMousePos.y;
            this.mouseDelta.x += deltaX;
            this.mouseDelta.y += deltaY;
        }

        this.lastMousePos.set(event.clientX, event.clientY);
    }

    getMovementDirection() {
        const dir = { x: 0, z: 0 };
        if (this.keys.w || this.keys.KeyW || this.keys.ArrowUp) dir.z += 1; // Forward
        if (this.keys.s || this.keys.KeyS || this.keys.ArrowDown) dir.z -= 1; // Backward
        if (this.keys.a || this.keys.KeyA || this.keys.ArrowLeft) dir.x -= 1; // Left
        if (this.keys.d || this.keys.KeyD || this.keys.ArrowRight) dir.x += 1; // Right
        return dir;
    }

    getLookDelta() {
        const delta = this.mouseDelta.clone();
        this.mouseDelta.set(0, 0); // Reset after reading
        return delta;
    }

    isInteractPressed() {
        return this.keys.Space || this.keys[' '];
    }
}

/**
 * GameManager
 * Central controller for the Three.js scene, game loop, and logic.
 */
class GameManager {
    constructor() {
        // Configuration
        this.config = {
            moveSpeed: 3.0,
            lookSpeed: 1.5,
            mouseLookSpeed: 0.002,
            minPolarAngle: 0.5,
            maxPolarAngle: 2.5,
            initialBounds: 4.5
        };

        // State
        this.isRunning = false;
        this.prevTime = performance.now();
        this.roomBounds = {
            minX: -this.config.initialBounds, maxX: this.config.initialBounds,
            minZ: -this.config.initialBounds, maxZ: this.config.initialBounds
        };

        // Components
        this.input = new InputManager();
        this.raycaster = new THREE.Raycaster();
        this.touchControls = null;

        // Scene setup
        this._initThreeJS();
        this._initUI();
    }

    _initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xebe5ce);
        this.scene.fog = new THREE.Fog(0xebe5ce, 5, 30);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3.5);
        this.camera.lookAt(0, 1.4, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Helper vectors for math to avoid garbage collection
        this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this._vec = new THREE.Vector3();
        this._PI_2 = Math.PI / 2;

        window.addEventListener('resize', () => this._onResize());

        // Expose for debugging
        if (window.__DEV__) {
            window.game = this;
            window.scene = this.scene;
            window.camera = this.camera;
            window.renderer = this.renderer;
        }
    }

    _initUI() {
        this.crosshair = document.getElementById('crosshair');
        this.instructions = document.getElementById('instructions');

        if (this.instructions) {
            this.instructions.addEventListener('click', () => {
                this.instructions.style.display = 'none';
                // Try to request pointer lock if needed, though this game seems to use drag-to-look
            });
        }

        // Global click handler for interaction
        document.addEventListener('click', (e) => {
            if (isInteracting || (this.instructions && this.instructions.style.display !== 'none')) return;
            this._handleInteraction();
        });

        // Spacebar handler is tricky because input manager catches it,
        // but we need to trigger 'once'.
        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.key === ' ') && !isInteracting) {
                e.preventDefault();
                this._handleInteraction();
            } else if ((e.code === 'Space' || e.key === ' ') && isInteracting) {
                e.preventDefault();
                closeModal();
            }
        });
    }

    async loadScene() {
        const path = window.location.pathname;
        try {
            if (path.includes('classroom.html')) {
                await initClassroom(this.scene);
            } else {
                await initOffice(this.scene);
            }

            this._calculateRoomBounds();
            this._setupTouchControls();

            // Initialize Game Logic (questions, clues)
            initGameLogic();

            this.isRunning = true;
            this.animate();
        } catch (error) {
            this._showError("Failed to load scene", error);
        }
    }

    _calculateRoomBounds() {
        const box = new THREE.Box3();
        let foundWalls = false;

        this.scene.traverse((object) => {
            if (object.isMesh && object.userData?.isWall === true) {
                box.expandByObject(object);
                foundWalls = true;
            }
        });

        if (foundWalls && !box.isEmpty()) {
            const padding = 0.5;
            this.roomBounds = {
                minX: box.min.x + padding,
                maxX: box.max.x - padding,
                minZ: box.min.z + padding,
                maxZ: box.max.z - padding
            };
        }
    }

    _setupTouchControls() {
        const handleTouchInteract = createTouchInteractionHandler({
            showModal,
            isInteracting: () => isInteracting,
            getContext: () => ({})
        });

        this.touchControls = new TouchControls(
            this.camera,
            this.raycaster,
            interactables,
            handleTouchInteract
        );
    }

    _handleInteraction() {
        this.raycaster.setFromCamera(this.input.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(interactables, false);
        if (intersects.length > 0) {
            showModal(intersects[0].object.name, {});
        }
    }

    _updateMovement(delta) {
        // 1. Calculate proposed movement vector
        const moveDir = this.input.getMovementDirection();
        let moveVec = new THREE.Vector3(0, 0, 0);

        // Forward/Backward (Z)
        if (moveDir.z !== 0) {
            this._vec.setFromMatrixColumn(this.camera.matrix, 0);
            this._vec.crossVectors(this.camera.up, this._vec);
            moveVec.addScaledVector(this._vec, moveDir.z);
        }

        // Left/Right (X)
        if (moveDir.x !== 0) {
            this._vec.setFromMatrixColumn(this.camera.matrix, 0);
            moveVec.addScaledVector(this._vec, moveDir.x);
        }

        // Touch Joystick
        if (this.touchControls) {
            const moveState = this.touchControls.getMovement();
            if (moveState.forward) {
                this._vec.setFromMatrixColumn(this.camera.matrix, 0);
                this._vec.crossVectors(this.camera.up, this._vec);
                moveVec.addScaledVector(this._vec, 1);
            }
            if (moveState.backward) {
                this._vec.setFromMatrixColumn(this.camera.matrix, 0);
                this._vec.crossVectors(this.camera.up, this._vec);
                moveVec.addScaledVector(this._vec, -1);
            }
            if (moveState.right) {
                this._vec.setFromMatrixColumn(this.camera.matrix, 0);
                moveVec.addScaledVector(this._vec, 1);
            }
            if (moveState.left) {
                this._vec.setFromMatrixColumn(this.camera.matrix, 0);
                moveVec.addScaledVector(this._vec, -1);
            }
        }

        // Normalize if moving diagonally to prevent faster speed
        if (moveVec.lengthSq() > 0) {
            moveVec.normalize().multiplyScalar(this.config.moveSpeed * delta);
        }

        // 2. Apply movement with collision check (Clamping)
        const nextPos = this.camera.position.clone().add(moveVec);

        // Simple AABB collision against room bounds
        nextPos.x = Math.max(this.roomBounds.minX, Math.min(this.roomBounds.maxX, nextPos.x));
        nextPos.z = Math.max(this.roomBounds.minZ, Math.min(this.roomBounds.maxZ, nextPos.z));

        this.camera.position.copy(nextPos);
    }

    _updateLook(delta) {
        this._euler.setFromQuaternion(this.camera.quaternion);

        // Mouse Drag Look
        const mouseDelta = this.input.getLookDelta();
        this._euler.y -= mouseDelta.x * this.config.mouseLookSpeed;
        this._euler.x -= mouseDelta.y * this.config.mouseLookSpeed;

        // Keyboard Look (legacy support, optional but good for accessibility)
        if (this.input.keys.ArrowLeft) this._euler.y += this.config.lookSpeed * delta;
        if (this.input.keys.ArrowRight) this._euler.y -= this.config.lookSpeed * delta;
        if (this.input.keys.ArrowUp) this._euler.x += this.config.lookSpeed * delta;
        if (this.input.keys.ArrowDown) this._euler.x -= this.config.lookSpeed * delta;

        // Touch Look
        if (this.touchControls) {
            const touchDelta = this.touchControls.getLookDelta();
            this._euler.y -= touchDelta.x * 2; // Sensitivity multiplier
            this._euler.x -= touchDelta.y * 2;
        }

        // Clamp Pitch
        this._euler.x = Math.max(this._PI_2 - this.config.maxPolarAngle, Math.min(this._PI_2 - this.config.minPolarAngle, this._euler.x));

        this.camera.quaternion.setFromEuler(this._euler);
    }

    _updateCrosshair() {
        if (!this.crosshair) return;

        // Visual update using transform for performance
        // Only update position if mouse moved (handled by InputManager implicitly?)
        // Actually, CSS top/left is okay if we are careful, but transform is smoother.
        // However, the original code used mouse movement to update cursor.
        // Let's stick to mouse tracking from InputManager.

        // We actually want the crosshair to follow the mouse pointer if it's a "cursor"
        // OR stay in center if locked?
        // The original code: crosshair.style.left = event.clientX + 'px';
        // This implies the crosshair IS the mouse cursor replacement.

        if (!isInteracting) {
            // Use transform instead of top/left
            // Note: clientX/Y are relative to viewport.
            // Using requestAnimationFrame allows us to sync this.
             // We need current mouse pos.
            const x = (this.input.lastMousePos.x) + 'px';
            const y = (this.input.lastMousePos.y) + 'px';

             // Check interaction for highlighting
            this.raycaster.setFromCamera(this.input.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(interactables, false);

            if (intersects.length > 0) {
                this.crosshair.classList.add('active');
            } else {
                this.crosshair.classList.remove('active');
            }

            // To avoid layout thrashing, we could use transforms:
            // this.crosshair.style.transform = `translate(${x}, ${y})`;
            // But 'left/top' with 'position: absolute' is standard for custom cursors if the element is out of flow.
            this.crosshair.style.left = x;
            this.crosshair.style.top = y;
        }
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _showError(message, error) {
        console.error(message, error);
        // Create error overlay
        const errorScreen = document.createElement('div');
        errorScreen.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); color: #ff3333; display: flex;
            flex-direction: column; justify-content: center; align-items: center;
            z-index: 10000; font-family: monospace; text-align: center; padding: 20px;
        `;
        errorScreen.innerHTML = `
            <h1>⚠️ ERROR</h1>
            <p>${message}</p>
            <p style="color:#999; font-size:0.8em">${error.message}</p>
            <button onclick="location.reload()" style="padding:10px 20px; cursor:pointer;">Reload</button>
        `;
        document.body.appendChild(errorScreen);
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const time = performance.now();
        const delta = Math.min((time - this.prevTime) / 1000, 0.1); // Cap delta to prevent huge jumps
        this.prevTime = time;

        if (isInteracting) {
            // Pause game logic/movement when interacting
            document.body.classList.remove('game-active');
            return;
        }

        // Hide instructions check
        if (this.instructions && this.instructions.style.display !== 'none') {
            document.body.classList.remove('game-active');
            return;
        }

        document.body.classList.add('game-active');

        this._updateLook(delta);
        this._updateMovement(delta);
        this._updateCrosshair();

        this.renderer.render(this.scene, this.camera);
    }
}

// Instantiate and start
const game = new GameManager();
game.loadScene();
