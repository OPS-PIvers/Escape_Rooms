/**
 * Mobile Touch Controls for Escape Room
 * Provides virtual joystick, drag-to-look, and tap-to-interact functionality
 */

export class TouchControls {
    constructor(camera, raycaster, interactables, onInteract) {
        this.camera = camera;
        this.raycaster = raycaster;
        this.interactables = interactables;
        this.onInteract = onInteract; // Callback for when object is tapped

        // Movement state (simulates WASD keys)
        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        // Camera look state
        this.lookDelta = { x: 0, y: 0 };
        this.lookSensitivity = 0.003; // Adjust for desired sensitivity

        // Touch tracking
        this.touches = new Map(); // Track multiple touches
        this.joystickTouch = null; // Touch controlling joystick
        this.lookTouch = null; // Touch controlling camera look

        // Joystick state
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };
        this.joystickMaxDistance = 50; // pixels

        // UI Elements
        this.joystickBase = null;
        this.joystickStick = null;
        this.interactButton = null;

        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Create joystick container
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'mobile-joystick';
        joystickContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 120px;
            height: 120px;
            z-index: 1000;
            display: none;
        `;

        // Joystick base (outer circle)
        this.joystickBase = document.createElement('div');
        this.joystickBase.style.cssText = `
            position: absolute;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: rgba(0, 255, 204, 0.2);
            border: 2px solid rgba(0, 255, 204, 0.5);
            box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
        `;

        // Joystick stick (inner circle)
        this.joystickStick = document.createElement('div');
        this.joystickStick.style.cssText = `
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(0, 255, 204, 0.6);
            border: 2px solid #00ffcc;
            box-shadow: 0 0 15px rgba(0, 255, 204, 0.8);
            top: 35px;
            left: 35px;
            transition: none;
        `;

        joystickContainer.appendChild(this.joystickBase);
        joystickContainer.appendChild(this.joystickStick);
        document.body.appendChild(joystickContainer);

        // Create interact button
        this.interactButton = document.createElement('button');
        this.interactButton.id = 'mobile-interact-btn';
        this.interactButton.innerHTML = '⊕<br><span style="font-size: 12px;">INTERACT</span>';
        this.interactButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(0, 255, 204, 0.3);
            border: 2px solid #00ffcc;
            color: #00ffcc;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(0, 255, 204, 0.5);
            z-index: 1000;
            display: none;
            cursor: pointer;
            font-family: 'Orbitron', monospace;
            line-height: 1.2;
            padding: 10px;
        `;
        document.body.appendChild(this.interactButton);

        // Show controls on mobile
        this.updateUIVisibility();
    }

    updateUIVisibility() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                         || window.innerWidth < 768;

        const joystick = document.getElementById('mobile-joystick');
        const interactBtn = document.getElementById('mobile-interact-btn');

        if (joystick) joystick.style.display = isMobile ? 'block' : 'none';
        if (interactBtn) interactBtn.style.display = isMobile ? 'block' : 'none';
    }

    setupEventListeners() {
        // Touch events for joystick and camera look
        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });

        // Interact button
        if (this.interactButton) {
            this.interactButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleCenterScreenInteract();
            });

            this.interactButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCenterScreenInteract();
            });
        }

        // Window resize
        window.addEventListener('resize', () => this.updateUIVisibility());
    }

    onTouchStart(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const x = touch.clientX;
            const y = touch.clientY;

            // Check if touch is on left side (joystick area) or right side (look area)
            const isLeftSide = x < window.innerWidth / 2;

            if (isLeftSide && !this.joystickTouch) {
                // Start joystick control
                event.preventDefault();
                this.joystickTouch = touch.identifier;
                this.joystickActive = true;
                this.joystickCenter = { x, y };
                this.joystickCurrent = { x, y };
                this.updateJoystickPosition(x, y);
            } else if (!isLeftSide && !this.lookTouch) {
                // Start camera look control
                event.preventDefault();
                this.lookTouch = touch.identifier;
                this.touches.set(touch.identifier, { x, y, startX: x, startY: y });
            }
        }
    }

    onTouchMove(event) {
        event.preventDefault();

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];

            if (touch.identifier === this.joystickTouch) {
                // Update joystick
                this.updateJoystickPosition(touch.clientX, touch.clientY);
            } else if (touch.identifier === this.lookTouch) {
                // Update camera look
                const lastTouch = this.touches.get(touch.identifier);
                if (lastTouch) {
                    const deltaX = touch.clientX - lastTouch.x;
                    const deltaY = touch.clientY - lastTouch.y;

                    this.lookDelta.x = deltaX * this.lookSensitivity;
                    this.lookDelta.y = deltaY * this.lookSensitivity;

                    this.touches.set(touch.identifier, {
                        x: touch.clientX,
                        y: touch.clientY,
                        startX: lastTouch.startX,
                        startY: lastTouch.startY
                    });
                }
            }
        }
    }

    onTouchEnd(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];

            if (touch.identifier === this.joystickTouch) {
                // End joystick control
                this.joystickTouch = null;
                this.joystickActive = false;
                this.resetJoystick();
                this.moveState = {
                    forward: false,
                    backward: false,
                    left: false,
                    right: false
                };
            } else if (touch.identifier === this.lookTouch) {
                // End camera look control
                const touchData = this.touches.get(touch.identifier);

                // Check if this was a tap (minimal movement)
                if (touchData) {
                    const dx = Math.abs(touch.clientX - touchData.startX);
                    const dy = Math.abs(touch.clientY - touchData.startY);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 10) { // Tap threshold
                        this.handleTapInteract(touch.clientX, touch.clientY);
                    }
                }

                this.lookTouch = null;
                this.lookDelta = { x: 0, y: 0 };
                this.touches.delete(touch.identifier);
            }
        }
    }

    updateJoystickPosition(x, y) {
        const dx = x - this.joystickCenter.x;
        const dy = y - this.joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Limit to max distance
        let finalX = dx;
        let finalY = dy;
        if (distance > this.joystickMaxDistance) {
            finalX = (dx / distance) * this.joystickMaxDistance;
            finalY = (dy / distance) * this.joystickMaxDistance;
        }

        // Update visual position
        const stickX = 35 + finalX; // 35 is half of (120-50)
        const stickY = 35 + finalY;
        this.joystickStick.style.left = stickX + 'px';
        this.joystickStick.style.top = stickY + 'px';

        // Update movement state based on direction
        const threshold = 15; // Deadzone threshold
        this.moveState.forward = finalY < -threshold;
        this.moveState.backward = finalY > threshold;
        this.moveState.left = finalX < -threshold;
        this.moveState.right = finalX > threshold;

        this.joystickCurrent = { x: finalX, y: finalY };
    }

    resetJoystick() {
        this.joystickStick.style.left = '35px';
        this.joystickStick.style.top = '35px';
        this.joystickCurrent = { x: 0, y: 0 };
    }

    handleTapInteract(x, y) {
        // Convert screen coordinates to normalized device coordinates
        const mouse = {
            x: (x / window.innerWidth) * 2 - 1,
            y: -(y / window.innerHeight) * 2 + 1
        };

        // Perform raycast
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, false);

        if (intersects.length > 0 && this.onInteract) {
            const object = intersects[0].object;
            this.onInteract(object);
        }
    }

    handleCenterScreenInteract() {
        // Raycast from center of screen (like pressing Space)
        const centerMouse = { x: 0, y: 0 };
        this.raycaster.setFromCamera(centerMouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, false);

        if (intersects.length > 0 && this.onInteract) {
            const object = intersects[0].object;
            this.onInteract(object);
        }
    }

    // Get current movement state (to be read by game loop)
    getMovement() {
        return this.moveState;
    }

    // Get camera look delta (to be read by game loop)
    getLookDelta() {
        const delta = { ...this.lookDelta };
        // Reset delta after reading (for smooth continuous movement)
        this.lookDelta = { x: 0, y: 0 };
        return delta;
    }

    // Cleanup
    dispose() {
        document.getElementById('mobile-joystick')?.remove();
        document.getElementById('mobile-interact-btn')?.remove();
    }
}
