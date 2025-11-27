/**
 * Centralized constants for the Escape Rooms game.
 * All game configuration, physics, dimensions, and object heights are defined here.
 */

// ============================================================================
// FURNITURE & OBJECT HEIGHT CONSTANTS
// ============================================================================
// All measurements are in meters (world units).
// These heights are calibrated for the Kenney Furniture Kit models.
// Furniture models have their origin at the bottom center.

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

// === BACKWARD COMPATIBILITY ALIASES ===
export const DESK_SURFACE_Y = DESK_SURFACE_HEIGHT;
export const CABINET_TOP_Y = CABINET_TOP_HEIGHT;
export const COFFEE_TABLE_Y = COFFEE_TABLE_HEIGHT;
export const BOOKSHELF_HEIGHTS = BOOKSHELF_SHELF_HEIGHTS;
export const WALL_MOUNT_Y = WALL_MOUNT_HEIGHT;

// ============================================================================
// ROOM DIMENSION CONSTANTS
// ============================================================================

// === CLASSROOM DIMENSIONS ===
/**
 * Classroom room width (X-axis)
 */
export const CLASSROOM_WIDTH = 8;

/**
 * Classroom room depth (Z-axis)
 */
export const CLASSROOM_DEPTH = 8;

/**
 * Classroom wall height
 */
export const CLASSROOM_WALL_HEIGHT = 3;

// === OFFICE DIMENSIONS ===
/**
 * Office room size (square room)
 */
export const OFFICE_ROOM_SIZE = 6;

// === TEMPLATE ROOM DIMENSIONS ===
/**
 * Tile scale for template room
 */
export const TEMPLATE_TILE_SCALE = 2.5;

/**
 * Template room size (in tiles)
 */
export const TEMPLATE_ROOM_SIZE = 4;

/**
 * Wall size for template room
 */
export const TEMPLATE_WALL_SIZE = 2.5;

/**
 * Starting position for template room tiles
 */
export const TEMPLATE_START_POSITION = -3.75;

// ============================================================================
// PHYSICS & CONTROLS CONSTANTS
// ============================================================================

/**
 * Look speed for keyboard controls
 */
export const LOOK_SPEED = 1.5;

/**
 * Movement speed for character
 */
export const MOVE_SPEED = 3.0;

/**
 * Mouse look sensitivity
 */
export const MOUSE_LOOK_SPEED = 0.002;

/**
 * Minimum polar angle for camera (prevents looking too far up)
 */
export const MIN_POLAR_ANGLE = 0.5;

/**
 * Maximum polar angle for camera (prevents looking too far down)
 */
export const MAX_POLAR_ANGLE = 2.5;

/**
 * Initial room bounds for collision detection
 * This is a fallback value, updated dynamically after scene loads
 */
export const INITIAL_ROOM_BOUNDS = 4.5;

/**
 * Maximum number of animation errors before stopping error logging
 */
export const MAX_ANIMATION_ERRORS = 10;

// ============================================================================
// CAMERA CONSTANTS
// ============================================================================

/**
 * Default camera field of view
 */
export const CAMERA_FOV = 75;

/**
 * Camera near clipping plane
 */
export const CAMERA_NEAR = 0.1;

/**
 * Camera far clipping plane
 */
export const CAMERA_FAR = 1000;

/**
 * Default camera height (eye level)
 */
export const CAMERA_HEIGHT = 1.6;

// ============================================================================
// SCENE CONSTANTS
// ============================================================================

/**
 * Default scene background color (beige/cream)
 */
export const SCENE_BACKGROUND_COLOR = 0xebe5ce;

/**
 * Template scene background color (light blue sky)
 */
export const TEMPLATE_BACKGROUND_COLOR = 0x87CEEB;

/**
 * Fog color (matches template background)
 */
export const FOG_COLOR = 0x87CEEB;

/**
 * Fog near distance
 */
export const FOG_NEAR = 10;

/**
 * Fog far distance
 */
export const FOG_FAR = 50;

// ============================================================================
// TIMER CONSTANTS
// ============================================================================

/**
 * Default timer duration in seconds (10 minutes)
 */
export const DEFAULT_TIMER_DURATION = 600;

// ============================================================================
// LIGHTING CONSTANTS
// ============================================================================

/**
 * Ambient light intensity
 */
export const AMBIENT_LIGHT_INTENSITY = 0.6;

/**
 * Directional light intensity
 */
export const DIRECTIONAL_LIGHT_INTENSITY = 0.8;
