/**
 * inventory.js
 * Manages the player's inventory (3 slots).
 */

export const INVENTORY_SIZE = 3;
export let inventory = [null, null, null]; // Array of { id, name, icon, description } or null
let selectedSlot = -1;

// Event listeners for UI updates
let onInventoryChange = null;

export function setInventoryChangeListener(callback) {
    onInventoryChange = callback;
}

function notifyChange() {
    if (onInventoryChange) onInventoryChange(inventory, selectedSlot);
}

/**
 * Adds an item to the first available slot.
 * @param {Object} item - { id, name, icon, description }
 * @returns {boolean} - True if added, False if full.
 */
export function addItem(item) {
    const emptyIndex = inventory.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
        console.log("Inventory is full!");
        return false;
    }
    inventory[emptyIndex] = item;
    console.log(`Added ${item.name} to slot ${emptyIndex}`);
    notifyChange();
    return true;
}

/**
 * Removes an item from a specific slot.
 * @param {number} index 
 */
export function removeItem(index) {
    if (index >= 0 && index < INVENTORY_SIZE) {
        inventory[index] = null;
        if (selectedSlot === index) selectedSlot = -1;
        notifyChange();
    }
}

/**
 * Checks if the player has a specific item by ID.
 * @param {string} itemId 
 * @returns {boolean}
 */
export function hasItem(itemId) {
    return inventory.some(item => item && item.id === itemId);
}

/**
 * Selects a slot. If already selected, deselects.
 * @param {number} index 
 */
export function selectSlot(index) {
    if (selectedSlot === index) {
        selectedSlot = -1; // Deselect
    } else {
        selectedSlot = index;
    }
    notifyChange();
}

export function getSelectedSlot() {
    return selectedSlot;
}

export function getSelectedItem() {
    if (selectedSlot === -1) return null;
    const item = inventory[selectedSlot];
    if (item) {
        return { ...item, index: selectedSlot };
    }
    return null;
}

/**
 * Tries to combine the currently selected item with another item (targetItem).
 * This logic might need to be expanded or moved to gameLogic depending on complexity.
 * @param {Object} targetItem - The item being interacted with in the world or another inventory item.
 */
export function combineWith(targetItem) {
    const selected = getSelectedItem();
    if (!selected) return null;

    // Logic for combination would go here or be delegated to gameLogic
    // For now, return a simple object indicating the attempt
    return {
        source: selected,
        target: targetItem
    };
}

// Debugging
window.inventorySystem = {
    inventory,
    addItem,
    removeItem,
    hasItem
};
