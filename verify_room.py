from playwright.sync_api import sync_playwright

def verify_room():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}\n{exc.stack}"))

        print("Navigating...")
        page.goto("http://localhost:8000/improved_room.html")

        # Wait for page load
        page.wait_for_load_state("networkidle")

        try:
            page.evaluate("if(document.getElementById('instructions')) document.getElementById('instructions').style.display = 'none'")
            print("Instructions hidden.")
        except Exception as e:
            print(f"Error hiding instructions: {e}")

        # Wait for potential async errors or loading
        page.wait_for_timeout(5000)

        page.screenshot(path="verification_room_debug.png")
        browser.close()

if __name__ == "__main__":
    verify_room()
