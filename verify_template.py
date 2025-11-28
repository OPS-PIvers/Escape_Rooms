
import asyncio
from playwright.async_api import async_playwright
import math

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(has_touch=True)
        page = await context.new_page()

        # Enable DEV mode to expose camera
        await page.add_init_script("window.__DEV__ = true;")

        print("Navigating to blank_room_template.html...")
        await page.goto("http://localhost:8000/blank_room_template.html")
        await page.wait_for_selector('#instructions', state="visible")
        await page.click('#instructions')

        # Wait for scene initialization (models loading)
        await asyncio.sleep(2)

        # 1. View Corner (Back-Left: X=-5, Z=-5)
        # Position camera inside room looking at corner
        print("Taking screenshot of corner...")
        await page.evaluate('''() => {
            window.camera.position.set(-2, 1.5, -2);
            window.camera.lookAt(-5, 1.5, -5);
        }''')
        await asyncio.sleep(0.5)
        await page.screenshot(path="verification_corner.png")

        # 2. View Ceiling and Floor
        print("Taking screenshot of ceiling and floor...")
        await page.evaluate('''() => {
            window.camera.position.set(0, 1.5, 0);
            window.camera.lookAt(0, 0, -5); // Look at back wall
            window.camera.rotateX(0.5); // Look slightly up/down? No, let's just use wide angle or look up then down
        }''')

        # Look Up (Ceiling)
        await page.evaluate('''() => {
             window.camera.lookAt(0, 3, 0);
        }''')
        await asyncio.sleep(0.5)
        await page.screenshot(path="verification_ceiling.png")

        # Look Down (Floor)
        await page.evaluate('''() => {
             window.camera.lookAt(0, 0, 0);
        }''')
        await asyncio.sleep(0.5)
        await page.screenshot(path="verification_floor.png")

        # 3. View Door and Timer (Right Wall: X=5)
        print("Taking screenshot of door...")
        await page.evaluate('''() => {
            window.camera.position.set(2, 1.5, 0);
            window.camera.lookAt(5, 1.5, 0);
        }''')
        await asyncio.sleep(0.5)
        await page.screenshot(path="verification_door.png")

        await browser.close()
        print("Verification screenshots saved.")

asyncio.run(main())
