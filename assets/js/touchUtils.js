/**
 * Shared utilities for touch controls
 */

/**
 * Creates a touch interaction handler for the escape room
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.showModal - The modal display function
 * @param {boolean} deps.isInteracting - Current interaction state
 * @param {Function} deps.getContext - Function that returns scene-specific context
 * @returns {Function} The interaction handler
 */
export function createTouchInteractionHandler({ showModal, isInteracting, getContext }) {
    return function handleTouchInteract(object) {
        if (!isInteracting) {
            showModal(object.name, getContext());
        }
    };
}
