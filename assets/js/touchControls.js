/**
 * Mobile Touch Controls for Escape Room
 * Provides virtual joystick, drag-to-look, and tap-to-interact functionality
 */

export class TouchControls {
    // Configuration constants (non-dimensional)
    static JOYSTICK_MAX_DISTANCE = 50;
    static JOYSTICK_DEADZONE = 15;
    static LOOK_SENSITIVITY = 0.003;
    static TAP_THRESHOLD = 10;

    // Read dimensional values from CSS custom properties
    static getCSSValue(property) {
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue(property)) || 0;
    }

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

        // Camera look state - accumulates deltas
        this.lookDelta = { x: 0, y: 0 };

        // Touch tracking
        this.touches = new Map(); // Track multiple touches
        this.joystickTouch = null; // Touch controlling joystick
        this.lookTouch = null; // Touch controlling camera look

        // Joystick state
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickCurrent = { x: 0, y: 0 };

        // UI Elements
        this.joystickBase = null;
        this.joystickStick = null;
        this.interactButton = null;

        // Dimensional values from CSS
        this.joystickSize = 0;
        this.joystickStickSize = 0;
        this.centerOffset = 0;

        // Store bound event handlers for cleanup
        this.boundHandlers = {
            touchStart: this.onTouchStart.bind(this),
            touchMove: this.onTouchMove.bind(this),
            touchEnd: this.onTouchEnd.bind(this),
            interactTouch: this.handleInteractTouch.bind(this),
            resize: this.onResize.bind(this)
        };

        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Create joystick container (styling in CSS)
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'mobile-joystick';
        joystickContainer.setAttribute('role', 'application');
        joystickContainer.setAttribute('aria-label', 'Virtual joystick for movement control');
        joystickContainer.setAttribute('aria-description', 'Touch and drag to move your character');

        // Joystick base (outer circle)
        this.joystickBase = document.createElement('div');
        this.joystickBase.className = 'joystick-base';

        // Joystick stick (inner circle)
        this.joystickStick = document.createElement('div');
        this.joystickStick.className = 'joystick-stick';

        joystickContainer.appendChild(this.joystickBase);
        joystickContainer.appendChild(this.joystickStick);
        document.body.appendChild(joystickContainer);

        // Create interact button (styling in CSS)
        this.interactButton = document.createElement('button');
        this.interactButton.id = 'mobile-interact-btn';
        this.interactButton.innerHTML = '⊕<br><span class="interact-label">INTERACT</span>';
        this.interactButton.setAttribute('aria-label', 'Interact with object');
        document.body.appendChild(this.interactButton);

        // Read dimensional values from CSS after elements are added to DOM
        this.updateDimensionsFromCSS();
    }

    updateDimensionsFromCSS() {
        // Read values from CSS custom properties
        this.joystickSize = TouchControls.getCSSValue('--joystick-size');
        this.joystickStickSize = TouchControls.getCSSValue('--joystick-stick-size');
        this.centerOffset = (this.joystickSize - this.joystickStickSize) / 2;
    }

    setupEventListeners() {
        // Touch events for joystick and camera look
        // Use canvas element if available to avoid interfering with UI modals
        const touchTarget = document.querySelector('canvas') || document;

        touchTarget.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
        touchTarget.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
        touchTarget.addEventListener('touchend', this.boundHandlers.touchEnd, { passive: false });
        touchTarget.addEventListener('touchcancel', this.boundHandlers.touchEnd, { passive: false });

        // Interact button - only touchstart to avoid double-fire with click
        if (this.interactButton) {
            this.interactButton.addEventListener('touchstart', this.boundHandlers.interactTouch, { passive: false });
        }

        // Window resize
        window.addEventListener('resize', this.boundHandlers.resize);
    }

    handleInteractTouch(e) {
        e.preventDefault();
        e.stopPropagation();

        // Don't trigger interaction if modal is open
        const modal = document.getElementById('clueModal');
        if (modal && modal.style.display !== 'none') {
            return;
        }

        this.handleCenterScreenInteract();
    }

    onResize() {
        // Re-read dimensions from CSS in case they changed
        this.updateDimensionsFromCSS();
    }

    onTouchStart(event) {
        // Don't interfere if modal or instructions are open
        const modal = document.getElementById('clueModal');
        const instructions = document.getElementById('instructions');
        if ((modal && modal.style.display !== 'none') ||
            (instructions && instructions.style.display !== 'none')) {
            return;
        }

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const x = touch.clientX;
            const y = touch.clientY;

            // Check if touch is on UI element or modal
            const target = touch.target;
            if (target.closest('#mobile-joystick') ||
                target.closest('#mobile-interact-btn') ||
                target.closest('#clueModal') ||
                target.closest('#victoryModal') ||
                target.closest('#instructions')) {
                continue; // Let UI handle it
            }

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
        // Don't interfere if modal or instructions are open
        const modal = document.getElementById('clueModal');
        const instructions = document.getElementById('instructions');
        if ((modal && modal.style.display !== 'none') ||
            (instructions && instructions.style.display !== 'none')) {
            return;
        }

        event.preventDefault();

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];

            if (touch.identifier === this.joystickTouch) {
                // Update joystick
                this.updateJoystickPosition(touch.clientX, touch.clientY);
            } else if (touch.identifier === this.lookTouch) {
                // Update camera look - accumulate deltas instead of overwriting
                const lastTouch = this.touches.get(touch.identifier);
                if (lastTouch) {
                    const deltaX = touch.clientX - lastTouch.x;
                    const deltaY = touch.clientY - lastTouch.y;

                    // Accumulate deltas to prevent lost movements
                    this.lookDelta.x += deltaX * TouchControls.LOOK_SENSITIVITY;
                    this.lookDelta.y += deltaY * TouchControls.LOOK_SENSITIVITY;

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
        // Check if modal or instructions are open for tap interaction prevention
        const modal = document.getElementById('clueModal');
        const instructions = document.getElementById('instructions');
        const isModalOpen = (modal && modal.style.display !== 'none') ||
                           (instructions && instructions.style.display !== 'none');

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

                // Check if this was a tap (minimal movement) and modal is NOT open
                if (touchData && !isModalOpen) {
                    const dx = Math.abs(touch.clientX - touchData.startX);
                    const dy = Math.abs(touch.clientY - touchData.startY);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < TouchControls.TAP_THRESHOLD) {
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
        if (distance > TouchControls.JOYSTICK_MAX_DISTANCE) {
            finalX = (dx / distance) * TouchControls.JOYSTICK_MAX_DISTANCE;
            finalY = (dy / distance) * TouchControls.JOYSTICK_MAX_DISTANCE;
        }

        // Update visual position using CSS-derived center offset
        const stickX = this.centerOffset + finalX;
        const stickY = this.centerOffset + finalY;
        this.joystickStick.style.left = stickX + 'px';
        this.joystickStick.style.top = stickY + 'px';

        // Update movement state based on direction
        this.moveState.forward = finalY < -TouchControls.JOYSTICK_DEADZONE;
        this.moveState.backward = finalY > TouchControls.JOYSTICK_DEADZONE;
        this.moveState.left = finalX < -TouchControls.JOYSTICK_DEADZONE;
        this.moveState.right = finalX > TouchControls.JOYSTICK_DEADZONE;

        this.joystickCurrent = { x: finalX, y: finalY };
    }

    resetJoystick() {
        // Reset to center using CSS-derived offset
        this.joystickStick.style.left = this.centerOffset + 'px';
        this.joystickStick.style.top = this.centerOffset + 'px';
        this.joystickCurrent = { x: 0, y: 0 };
    }

    handleTapInteract(x, y) {
        // Convert screen coordinates to normalized device coordinates
        const mouse = {
            x: (x / window.innerWidth) * 2 - 1,
            y: -(y / window.innerHeight) * 2 + 1
        };

        // Perform raycast - use recursive to detect nested objects
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, true);

        if (intersects.length > 0 && this.onInteract) {
            const object = intersects[0].object;
            this.onInteract(object);
        }
    }

    handleCenterScreenInteract() {
        // Raycast from center of screen (like pressing Space)
        const centerMouse = { x: 0, y: 0 };
        this.raycaster.setFromCamera(centerMouse, this.camera);
        // Use recursive to detect nested objects
        const intersects = this.raycaster.intersectObjects(this.interactables, true);

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

    // Cleanup - properly remove all event listeners
    dispose() {
        // Remove event listeners
        const touchTarget = document.querySelector('canvas') || document;
        touchTarget.removeEventListener('touchstart', this.boundHandlers.touchStart);
        touchTarget.removeEventListener('touchmove', this.boundHandlers.touchMove);
        touchTarget.removeEventListener('touchend', this.boundHandlers.touchEnd);
        touchTarget.removeEventListener('touchcancel', this.boundHandlers.touchEnd);

        if (this.interactButton) {
            this.interactButton.removeEventListener('touchstart', this.boundHandlers.interactTouch);
        }

        window.removeEventListener('resize', this.boundHandlers.resize);

        // Remove DOM elements
        document.getElementById('mobile-joystick')?.remove();
        document.getElementById('mobile-interact-btn')?.remove();

        // Clear references
        this.joystickBase = null;
        this.joystickStick = null;
        this.interactButton = null;
        this.touches.clear();
    }
}
