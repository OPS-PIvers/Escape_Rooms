from playwright.sync_api import sync_playwright
import time
import math

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/MN_History_6.html")
        
        # Hide instructions
        page.wait_for_selector("#instructions")
        page.eval_on_selector("#instructions", "el => el.style.display = 'none'")
        
        time.sleep(1) # Wait for init
        
        # Move camera to look at the clock
        # Clock is at x=-4.9, y=3.5, z=0 on the left wall (x=-5)
        # We position camera at x=0, y=3.5, z=0 and look at the clock
        page.evaluate("""
            window.camera.position.set(0, 3.5, 0);
            window.camera.lookAt(-4.9, 3.5, 0);
            window.renderer.render(window.scene, window.camera);
        """)
        
        time.sleep(0.5) # Allow render
        
        page.screenshot(path="clock_verification.png")
        print("Screenshot saved to clock_verification.png")
        browser.close()

if __name__ == "__main__":
    run()