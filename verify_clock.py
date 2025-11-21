
from playwright.sync_api import Page, expect, sync_playwright
import time
import math

def verify_clock(page: Page):
    # 1. Go to the page
    page.goto("http://localhost:8000/MN_History_6.html")

    # Wait for initial load
    page.wait_for_timeout(2000)

    # Hide instructions
    page.evaluate("document.getElementById('instructions').style.display = 'none'")

    # 2. Move camera to look at the clock
    # Clock is at (-4.9, 3.5, 0).
    # Let's position camera at (-2, 3.5, 0) and look at it.
    page.evaluate("""
        // Unlock controls first to avoid conflict (though setting position manually should work)
        // controls.unlock();
        // Actually, if controls are unlocked, we can move camera freely?
        // But the animate loop might override it?
        // The animate loop updates camera via controls ONLY if controls.isLocked is true.
        // If not locked, it doesn't update camera from mouse movement.
        // But we can set position directly.

        camera.position.set(-2, 3.5, 0);
        camera.lookAt(-4.9, 3.5, 0);
        camera.updateProjectionMatrix();
    """)

    page.wait_for_timeout(1000)

    # 3. Screenshot
    page.screenshot(path="clock_verification.png")
    print("Clock verification screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_clock(page)
        browser.close()
