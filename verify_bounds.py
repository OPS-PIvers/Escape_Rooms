
import asyncio
import json
from playwright.async_api import async_playwright

async def verify_bounds():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the page
        await page.goto("http://localhost:8000/blank_room_template.html")

        # Click instructions to start
        try:
            await page.click('#instructions', timeout=5000)
        except:
            print("Could not click instructions, maybe not present or already hidden")

        # Wait for scene to populate (simple wait)
        await page.wait_for_timeout(3000)

        # Inject script to get bounds
        # Note: THREE is not global by default if imported as module in the page script,
        # BUT blank_room_template.js doesn't expose it globally explicitly until I added 'window.scene = scene'.
        # However, I need to access Box3.
        # I can access window.scene.
        # I can get THREE from window.scene constructor (if needed) or just trust that THREE might be available if I attached it?
        # blank_room_template.js DOES NOT attach THREE to window.

        # Strategy: Use the scene objects to calculate bounds.
        # I can use `new window.THREE.Box3()` if THREE is on window.
        # But it's not.
        # I can assume the objects are THREE.Group or THREE.Mesh.
        # I can try to find THREE in the module? No.
        # I can use `window.scene.children[0].constructor` etc?

        # Better: I will use a minimal box calculation manual, OR
        # Since I edited blank_room_template.js in my thought process but NOT in reality?
        # Wait, I did `read_file`, I did NOT edit it.
        # `read_file` output showed `window.scene = scene;` at the end!
        # Ah! `read_file` showed:
        # window.camera = camera;
        # window.scene = scene;
        # window.renderer = renderer;
        # window.interactables = interactables;

        # So scene is available. But THREE is not.
        # I can get Box3 from `new window.scene.constructor.prototype.constructor.Box3()` ? No.
        # THREE is imported as `import * as THREE`.

        # I will hack it:
        # I will assume that the objects have a `.geometry` and I can read boundingBox from there if computed?
        # Or I can use `window.scene` to find a Mesh, then `mesh.geometry.boundingBox`.

        bounds_data = await page.evaluate("""
            async () => {
                // We need THREE.Box3.
                // Since we can't easily access THREE, we will try to find it on window if attached by other scripts?
                // Or we can try to compute bounds manually if we access geometry vertices? Too hard.

                // Let's look for THREE on window.
                if (!window.THREE) {
                    // Try to borrow from a known object if possible?
                    // No easy way.

                    // Let's assume the user put `import * as THREE from 'three'; window.THREE = THREE;` ? No.

                    // Helper to get bounding box from geometry if present
                    // This is imperfect because it ignores transforms.
                }

                // Wait! I can't easily use Box3 without THREE.
                // However, I can inspect the 'position' property which gives the center (usually).

                let roomGroup = null;
                // Find roomGroup
                // In blank_room_template.js: scene.add(roomGroup);
                // It is likely the 3rd child (Ambient, Directional, RoomGroup)

                const children = window.scene.children;
                // Log types
                const report = [];

                // We want to find walls and corners.
                // We know their positions from the code loop.
                // Let's just log the positions of all children in roomGroup.

                for (let c of children) {
                    if (c.type === 'Group') {
                        // Likely roomGroup or doorGroup
                        // roomGroup has many children (walls). doorGroup has doorPivot.
                        if (c.children.length > 5) {
                            roomGroup = c;
                        }
                    }
                }

                if (!roomGroup) return { error: "No roomGroup found" };

                const objects = [];
                roomGroup.children.forEach((child, index) => {
                    const pos = child.position;
                    const rot = child.rotation;
                    const scale = child.scale;

                    // We can't identify if it is Wall or Corner easily without name or userData.
                    // But we can guess by position.
                    // Corners are at +/- 4.5.
                    // Walls are at +/- 3.5, 2.5, 1.5, 0.5.

                    // We can also check if it's a Group (loaded model) or Mesh.
                    // loadModel returns a Group usually (GLTF scene).

                    objects.push({
                        index: index,
                        type: child.type,
                        pos: {x: pos.x, y: pos.y, z: pos.z},
                        rot: {x: rot.x, y: rot.y, z: rot.z},
                        scale: {x: scale.x, y: scale.y, z: scale.z},
                        // If we can drill down to geometry, we can get bounding box
                        // child -> traverse -> if mesh -> geometry.boundingBox
                        bounds: getMeshBounds(child)
                    });
                });

                function getMeshBounds(root) {
                    let minX = Infinity, minY = Infinity, minZ = Infinity;
                    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
                    let found = false;

                    root.traverse((node) => {
                        if (node.isMesh && node.geometry) {
                            if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
                            const b = node.geometry.boundingBox;
                            // This is local bounds of the mesh geometry.
                            // We need to account for scale of the mesh?
                            // And scale of the parent?

                            // Let's just return the local geometry bounds for now to see if the model is 1x1.
                            if (b) {
                                minX = Math.min(minX, b.min.x);
                                minY = Math.min(minY, b.min.y);
                                minZ = Math.min(minZ, b.min.z);
                                maxX = Math.max(maxX, b.max.x);
                                maxY = Math.max(maxY, b.max.y);
                                maxZ = Math.max(maxZ, b.max.z);
                                found = true;
                            }
                        }
                    });

                    if (!found) return null;
                    return { min: {x: minX, y: minY, z: minZ}, max: {x: maxX, y: maxY, z: maxZ} };
                }

                return objects;
            }
        """)

        # Print nicely
        print(json.dumps(bounds_data, indent=2))
        await browser.close()

asyncio.run(verify_bounds())
