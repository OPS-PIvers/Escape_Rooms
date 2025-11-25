# MN History Escape Room

## Project Overview

This project is a web-based 3D escape room game titled **"The MN History Escape"**. Players explore a 3D archive room, find clues related to Minnesota history, solve puzzles to reveal digits, and use those digits to unlock a safe and escape the room.

The application is built using **Three.js** for 3D rendering and modular JavaScript for game logic, recently refactored from a single-file prototype into a structured, maintainable architecture.

## Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules).
*   **3D Engine:** Three.js (loaded via CDN).
*   **Testing:** Python, Playwright.

## Project Structure

The codebase has been modularized to separate concerns:

*   **`office.html`**: The main entry point. It sets up the DOM overlays and initializes the game by importing the main module.
*   **`assets/`**: Contains all static assets and source code.
    *   **`css/main.css`**: Styles for the UI overlays (instructions, modals, crosshair) and fonts.
    *   **`js/`**: Core JavaScript modules.
        *   **`main.js`**: The application bootstrapper. Sets up the Three.js scene, camera, and renderer loop.
        *   **`gameLogic.js`**: Manages game state (clues found, active puzzles, safe codes, victory conditions).
        *   **`ui.js`**: Handles 2D UI interactions (modals, crosshair, instructions).
        *   **`materials.js`**: Centralized definitions for Three.js materials and textures.
        *   **`utils.js`**: Helper functions.
        *   **`prefabs/`**: Reusable 3D object definitions (e.g., `clock.js`, `desk.js`, `shelves.js`).
*   **`verify_ui.py`**: A Python script using Playwright to verify 2D UI elements (instructions, modals) by capturing screenshots of `office.html`.
*   **`verify_clock.py`**: A Python script using Playwright to verify specific 3D elements (the wall clock) by manipulating the camera.
*   **`server.log`**: Log file from the local development server.

## Getting Started

### Running the Game

Since the project uses ES modules (`<script type="module">`), it must be served over HTTP/HTTPS and cannot be run directly from the file system (`file://`).

1.  Start a local web server in the project root:
    ```bash
    python3 -m http.server 8000
    ```
2.  Open your browser and navigate to:
    `http://localhost:8000/office.html`

### Running Tests

The project includes automated visual verification scripts using Playwright.

1.  Ensure the local server is running on port 8000 (as above).
2.  Install dependencies (if not already installed):
    ```bash
    pip install playwright
    playwright install chromium
    ```
3.  Run the verification scripts:
    ```bash
    python3 verify_ui.py
    python3 verify_clock.py
    ```
    *   These scripts will generate screenshot files (e.g., `verification_modal.png`, `clock_verification.png`) for manual inspection.

## Development Notes

*   **Modular Architecture:** The project recently underwent a significant refactor to move away from a monolithic HTML file. Logic is now split into specialized modules within `assets/js`, and 3D objects are defined in `assets/js/prefabs`.
*   **Procedural Assets:** To minimize external dependencies, textures for objects like the globe, computer screen, and clock face are generated programmatically using the HTML5 Canvas API.
*   **Interaction System:** Raycasting is used for mouse/center-screen interaction with 3D objects. The game supports a "pointer lock" style experience where the cursor acts as a crosshair.