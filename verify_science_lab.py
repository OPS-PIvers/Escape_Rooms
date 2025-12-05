from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to the science lab
        # Assuming server is running on port 8000
        page.goto("http://localhost:8000/science_lab.html")
        
        # Wait for load
        page.wait_for_timeout(2000)
        
        # Check title
        title = page.title()
        print(f"Page Title: {title}")
        
        # Dismiss instructions
        page.click("#instructions")
        page.wait_for_timeout(500)
        
        # Check for inventory container
        inventory = page.query_selector("#inventory-container")
        if inventory:
            print("Inventory container found.")
            slots = page.query_selector_all(".inventory-slot")
            print(f"Found {len(slots)} inventory slots.")
            if len(slots) == 3:
                print("SUCCESS: 3 slots present.")
            else:
                print("FAILURE: Incorrect number of slots.")
        else:
            print("FAILURE: Inventory container not found.")
            
        # Take screenshot
        page.screenshot(path="verification_science_lab_ui.png")
        print("Screenshot saved to verification_science_lab_ui.png")
        
        browser.close()

if __name__ == "__main__":
    run()
