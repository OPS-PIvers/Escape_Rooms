import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        print("Navigating to office.html...")
        await page.goto("http://localhost:8000/office.html")
        
        try:
            print("Waiting for instructions...")
            await page.wait_for_selector('#instructions', timeout=5000)
            await page.click('#instructions')
            print("Instructions dismissed.")
        except:
            print("Instructions not found or timeout.")

        # Wait for scene to load
        await asyncio.sleep(3)
        
        # Position camera to look at the East Wall
        # East wall is at x=6. Camera at x=0 facing x=6.
        # Looking at z=-1.5 (center of secret bookshelf)
        print("Positioning camera...")
        await page.evaluate('''() => { 
            if(window.engine && window.engine.camera) { 
                window.engine.camera.position.set(0, 1.6, 0); 
                window.engine.camera.lookAt(6, 1.6, -1.5); 
            } else {
                console.error("Engine or camera not found!");
            }
        }''')
        
        await asyncio.sleep(1)
        
        await page.screenshot(path="verification_east_wall.png")
        print("Screenshot taken: verification_east_wall.png")
        
        await browser.close()

asyncio.run(main())
