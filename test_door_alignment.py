
import pytest
from playwright.sync_api import sync_playwright
import math

def test_door_alignment():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Go to the page
        page.goto("http://localhost:8000/blank_room_template.html")

        # Wait for scene
        page.wait_for_function("window.interactables && window.interactables.some(i => i.name === 'door')")

        # Get Door Pivot Position
        pivot_pos = page.evaluate("""() => {
            const Vector3 = window.scene.position.constructor;
            const doorGroup = window.scene.children.find(o => o.type === 'Group' && o.position.x === 5);
            const doorPivot = doorGroup.children.find(c => c.type === 'Group'); // The first group is pivot

            const worldPos = new Vector3();
            doorPivot.getWorldPosition(worldPos);
            return {x: worldPos.x, y: worldPos.y, z: worldPos.z};
        }""")

        print(f"Door Pivot World Pos: {pivot_pos}")

        # Check Y (Should be on floor)
        if abs(pivot_pos['y']) > 0.1:
            raise AssertionError(f"Door is floating! Y={pivot_pos['y']}")

        # Check Z
        # Wall segment is 0.5 to 1.5.
        # Pivot should be at the edge (approx 0.5) to fill the hole.
        # Allow range 0.45 to 0.6.
        if pivot_pos['z'] < 0.45 or pivot_pos['z'] > 0.6:
             raise AssertionError(f"Door Pivot is not aligned with wall edge! Z={pivot_pos['z']}")

        browser.close()

if __name__ == "__main__":
    try:
        test_door_alignment()
        print("Test Passed!")
    except Exception as e:
        print(f"Test Failed: {e}")
        exit(1)
