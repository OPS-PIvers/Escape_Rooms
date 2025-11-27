
import pytest
from playwright.sync_api import sync_playwright
import time

def solve_clue(page, location_name):
    print(f"Solving clue at: {location_name}")
    # Trigger interaction via ui.showModal
    page.evaluate(f"""async () => {{
        const ui = await import('./assets/js/ui.js');
        ui.showModal("{location_name}", {{}});
    }}""")

    # Wait for modal
    page.wait_for_selector("#clueModal", state="visible")

    # Check if solved
    title = page.locator("#modalTitle").inner_text()
    if title == "SOLVED":
        print(f"  Already solved.")
        page.evaluate("""async () => {
            const ui = await import('./assets/js/ui.js');
            ui.closeModal();
        }""")
        return

    # Get question
    try:
        page.wait_for_selector(".question-box strong", timeout=3000)
        question_text = page.locator(".question-box strong").inner_text()
    except Exception:
        print(f"  No question text found. Title was: {title}")
        page.evaluate("""async () => {
            const ui = await import('./assets/js/ui.js');
            ui.closeModal();
        }""")
        return

    # Find answer using exposed gameLogic
    correct_text = page.evaluate(f"""(qText) => {{
        const q = window.gameLogic.questionPool.find(q => q.q === qText);
        return q.o[q.c];
    }}""", question_text)

    # Click option
    page.locator(f"button.option-btn:has-text('{correct_text}')").click()

    # Wait for feedback
    page.wait_for_selector("#modalFeedback", state="visible")

    # Close
    page.evaluate("""async () => {
        const ui = await import('./assets/js/ui.js');
        ui.closeModal();
    }""")
    page.wait_for_selector("#clueModal", state="hidden")


def test_full_game_walkthrough():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        # Enable DEV mode to expose gameLogic
        page.add_init_script("window.__DEV__ = true;")

        # Abort model requests to speed up test and avoid WebGL complexity
        page.route("**/*.glb", lambda route: route.abort())

        page.goto("http://localhost:8000/office.html")

        # Wait for instructions and click
        page.wait_for_selector("#instructions", state="visible")
        page.click("#instructions")

        # Wait for gameLogic initialization
        print("Waiting for game initialization...")
        try:
            page.wait_for_function("""() => {
                return window.gameLogic &&
                       Object.values(window.gameLogic.locationMap).some(v => v !== null);
            }""", timeout=10000)
        except Exception as e:
            pytest.fail(f"Timed out waiting for game init: {e}")

        # Get clue locations from exposed gameLogic
        clue_locations = page.evaluate("""() => {
            const locs = [];
            for (const [loc, slot] of Object.entries(window.gameLogic.locationMap)) {
                if (slot !== null) {
                    locs.push({loc: loc, slot: slot});
                }
            }
            return locs;
        }""")

        print(f"Clues found at: {clue_locations}")
        assert len(clue_locations) == 4

        # Solve clues
        for item in clue_locations:
            solve_clue(page, item['loc'])
            time.sleep(0.5)

        # Verify solved
        all_solved = page.evaluate("""() => {
            return window.gameLogic.activeClues.every(c => c.solved);
        }""")
        assert all_solved is True, "Not all clues solved"

        # Safe
        print("Opening Safe...")
        page.evaluate("""async () => {
            const ui = await import('./assets/js/ui.js');
            ui.showModal("safe", {});
        }""")

        # Enter 1858
        for digit in "1858":
             page.locator(f".key-btn:has-text('{digit}')").first.click()
             time.sleep(0.1)

        page.locator(".key-btn:has-text('E')").click()

        # Take key
        page.wait_for_selector("button:has-text('TAKE KEY')")
        page.click("button:has-text('TAKE KEY')")

        # Verify key
        has_key = page.evaluate("""() => {
            return window.gameLogic.hasSkeletonKey;
        }""")
        assert has_key is True

        # Door
        print("Escaping...")
        page.evaluate("""async () => {
            const ui = await import('./assets/js/ui.js');
            ui.showModal("door", {});
        }""")

        page.wait_for_selector("#victoryModal", state="visible")
        print("Victory!")

        browser.close()

if __name__ == "__main__":
    test_full_game_walkthrough()
