
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(has_touch=True)
        page = await context.new_page()

        # Enable DEV mode to expose camera
        await page.add_init_script("window.__DEV__ = true;")

        await page.goto("http://localhost:8000/office.html")
        await page.wait_for_selector('#instructions')
        await page.click('#instructions')

        await page.evaluate('() => { window.camera.position.set(2, 1.6, 2); }')
        await page.evaluate('() => { window.camera.lookAt(0, 1, 0); }')

        await asyncio.sleep(2)

        await page.screenshot(path="verification_scene.png")

        await browser.close()

asyncio.run(main())
