from playwright.sync_api import sync_playwright
import time

def verify_objects():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to the game
        print("Loading game...")
        page.goto("http://localhost:8000/office.html")
        
        # Wait for game to load (canvas to appear)
        page.wait_for_selector("canvas", timeout=10000)
        
        # Wait a bit for the scene to fully initialize
        time.sleep(2)
        
        # Check for new objects in the interactables list via console
        new_objects = [
            "printer",
            "fire_extinguisher",
            "lunchbox",
            "trophy",
            "radio",
            "typewriter",
            "hat"
        ]
        
        print("\nVerifying new objects...")
        all_found = True
        
        for obj_name in new_objects:
            # Execute JavaScript to check if an interactable with this name exists
            result = page.evaluate(f"""
                (function() {{
                    if (!window.gameEngine || !window.gameEngine.interactables) return false;
                    return window.gameEngine.interactables.some(obj => obj.name === '{obj_name}');
                }})()
            """)
            
            if result:
                print(f"[PASS] Found object: {obj_name}")
            else:
                print(f"[FAIL] Could not find object: {obj_name}")
                all_found = False
                
        if all_found:
            print("\nSUCCESS: All new objects verified in scene.")
        else:
            print("\nFAILURE: Some objects were missing.")
            
        browser.close()

if __name__ == "__main__":
    verify_objects()
