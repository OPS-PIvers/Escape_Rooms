/**
 * Centralized height constants for all furniture and objects in the game.
 * All measurements are in meters (world units).
 *
 * These heights are calibrated for the Kenney Furniture Kit models.
 * Furniture models have their origin at the bottom center.
 */

// === FURNITURE SURFACE HEIGHTS ===
// Height where objects should be placed ON TOP of furniture

/**
 * Standard desk/table surface height
 * Objects placed on desks should use this Y coordinate
 */
export const DESK_SURFACE_HEIGHT = 0.40;

/**
 * Coffee table surface height
 * Lower than regular desks/tables
 */
export const COFFEE_TABLE_HEIGHT = 0.20;

/**
 * Kitchen cabinet/drawer top surface height
 */
export const CABINET_TOP_HEIGHT = 0.45;

/**
 * Side table surface height
 */
export const SIDE_TABLE_HEIGHT = 0.35;

// === SEATING HEIGHTS ===
// These are for reference - seats are placed at y=0

/**
 * Chair seat height (for reference only - chairs placed at y=0)
 */
export const CHAIR_SEAT_HEIGHT = 0.45;

/**
 * Sofa/couch seat height (for reference only - sofas placed at y=0)
 */
export const SOFA_SEAT_HEIGHT = 0.40;

// === BOOKSHELF HEIGHTS ===
/**
 * Bookshelf shelf heights for placing books and objects
 * Array of heights from bottom to top shelf
 */
export const BOOKSHELF_SHELF_HEIGHTS = [0.30, 0.65, 1.00, 1.35];

// === WALL MOUNTED OBJECTS ===
/**
 * Height for wall-mounted objects like clocks, pictures, etc.
 */
export const WALL_MOUNT_HEIGHT = 2.0;

// === FLOOR OBJECTS ===
/**
 * Ground level - all furniture bases
 */
export const FLOOR_HEIGHT = 0.0;

/**
 * Small objects that sit slightly above floor (rugs, etc.)
 */
export const FLOOR_OFFSET = 0.01;

// === CONVENIENCE ACCESSORS ===
/**
 * Alias for desk surface - for backward compatibility
 */
export const DESK_SURFACE_Y = DESK_SURFACE_HEIGHT;

/**
 * Alias for cabinet top - for backward compatibility
 */
export const CABINET_TOP_Y = CABINET_TOP_HEIGHT;

/**
 * Alias for coffee table - for backward compatibility
 */
export const COFFEE_TABLE_Y = COFFEE_TABLE_HEIGHT;

/**
 * Alias for bookshelf heights - for backward compatibility
 */
export const BOOKSHELF_HEIGHTS = BOOKSHELF_SHELF_HEIGHTS;

/**
 * Alias for wall mount - for backward compatibility
 */
export const WALL_MOUNT_Y = WALL_MOUNT_HEIGHT;
