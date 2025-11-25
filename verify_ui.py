
from playwright.sync_api import Page, expect, sync_playwright
import time

def test_ui_elements(page: Page):
    # 1. Go to the page
    page.goto("http://localhost:8000/office.html")

    # Wait for fonts to load (approx)
    page.wait_for_timeout(1000)

    # 2. Screenshot Instructions
    page.screenshot(path="verification_instructions.png")
    print("Instructions screenshot taken.")

    # 3. Click instructions to lock pointer (handled by browser, might be tricky in headless,
    # but clicking hides the instructions div).
    # Actually, clicking #instructions calls controls.lock(). In headless, pointer lock might not work,
    # but the event listener also hides #instructions on 'lock' event.
    # Let's manually hide it to simulate.
    page.evaluate("document.getElementById('instructions').style.display = 'none'")
    page.wait_for_timeout(500)

    # 4. Trigger a modal to see the new style
    # We can expose a function or just call showModal if it's in scope.
    # Since showModal is inside the module, we might not reach it easily from window.
    # However, I can check if I can inject a call.
    # The script is type="module", so variables aren't global.
    # But I can interact with the DOM to trigger it if I knew where to click, but 3D is hard.
    # Alternatives:
    # A. Edit the file temporarily to expose showModal to window.
    # B. Just trust the CSS visual inspection of the instructions and static analysis.

    # Let's try to find the modal element and force it visible via styles for screenshot purposes.
    page.evaluate("""
        const m = document.getElementById('clueModal');
        m.style.display = 'block';
        document.getElementById('modalTitle').innerText = 'TEST TITLE';
        document.getElementById('modalContent').innerHTML = '<div class="question-box">Test Question?</div>';
        const optC = document.getElementById('optionsContainer');
        optC.innerHTML = '<button class="option-btn">Option 1</button><button class="option-btn">Option 2</button>';
    """)
    page.wait_for_timeout(500)
    page.screenshot(path="verification_modal.png")
    print("Modal screenshot taken.")

    # 5. Check if we can see the Timer or Computer?
    # The camera starts at a specific position.
    # Maybe we can rotate the camera using the exposed controls? No, controls are inside the module.
    # We can try to take a screenshot of the canvas if we can find it.
    # The computer screen is a CanvasTexture. The Timer is a CanvasTexture.
    # They are rendered on the 3D canvas.

    # Let's just verify the 2D UI elements for now as that was the bulk of the "Digital Elements" design work.

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_ui_elements(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
