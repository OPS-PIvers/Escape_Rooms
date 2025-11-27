// Centralized constants for the escape room game.

// --- PHYSICS & MOVEMENT ---
/** Speed of camera rotation when using keys. */
export const LOOK_SPEED = 1.5;

/** Speed of player movement. */
export const MOVE_SPEED = 3.0;

/** Speed of camera rotation when using mouse. */
export const MOUSE_LOOK_SPEED = 0.002;

/** Minimum vertical angle for the camera (radians). */
export const MIN_POLAR_ANGLE = 0.5;

/** Maximum vertical angle for the camera (radians). */
export const MAX_POLAR_ANGLE = 2.5;

/** Default height of the player camera. */
export const CAMERA_HEIGHT = 1.4;

/** Default initial room bounds for player movement collision. */
export const INITIAL_ROOM_BOUNDS = 4.5;


// --- GAME SETTINGS ---
/** Maximum number of allowed animation errors before showing the error screen. */
export const MAX_ANIMATION_ERRORS = 10;

/** Default duration for the countdown timer in seconds. */
export const TIMER_DURATION = 600;

/** Number of failed attempts allowed for safe/keypad before reset. */
export const SAFE_ATTEMPTS = 3;


// --- SCENE & RENDERING ---
/** Default background color for the scene. */
export const SCENE_BACKGROUND_COLOR = 0xebe5ce; // Cream/Beige

/** Default fog color (should match background). */
export const FOG_COLOR = 0xebe5ce;

/** Near distance for fog. */
export const FOG_NEAR = 5;

/** Far distance for fog. */
export const FOG_FAR = 30;

/** Default shadow map size for directional lights. */
export const SHADOW_MAP_SIZE = 2048;


// --- WORLD GENERATION (TEMPLATE) ---
/** Scale factor for models in the blank room template. */
export const TILE_SCALE = 1.0;

/** Number of wall segments along one side of the room in template. */
export const ROOM_SIZE = 10;

/** Height of the walls in units. */
export const WALL_HEIGHT = 3.0;

/** Size of a single wall segment in template. */
export const WALL_SIZE = 1.0;

/** Starting coordinate for room generation in template. */
export const ROOM_START_COORDINATE = -4.5;


// --- GAME DATA CONSTANTS ---
/** List of possible locations for clues/items in the game. */
export const LOCATIONS = [
    "computer", "filing_cabinet_1", "filing_cabinet_2", "filing_cabinet_3", "papers",
    "briefcase", "mug", "hat", "lamp",
    "globe", "radio", "typewriter", "plant", "trophy", "clock", "trash", "lunchbox",
    "picture", "desk_lamp", "cardboard_box", "fire_extinguisher",
    "computer", "filing_cabinet_1", "filing_cabinet_2", "filing_cabinet_3", "papers", "safe",
    "briefcase", "globe", "plant", "clock", "trash",
    "book_cluster_1", "book_cluster_2", "book_cluster_3", "book_cluster_4",
    "keyboard", "mouse"
];
