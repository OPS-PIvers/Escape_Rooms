
import asyncio
from playwright.async_api import async_playwright

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

        # View Door and Timer (Right Wall: X=5)
        print("Taking verification screenshot...")
        await page.evaluate('''() => {
            window.camera.position.set(2, 1.5, 0);
            window.camera.lookAt(5, 1.5, 0);
        }''')
        await asyncio.sleep(1.0)

        await page.screenshot(path="verification/verification.png")
        await browser.close()
        print("Verification screenshot saved to verification/verification.png")

asyncio.run(main())
