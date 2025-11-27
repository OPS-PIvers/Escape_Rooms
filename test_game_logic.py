
from playwright.sync_api import sync_playwright

def test_game_logic_initialization():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/test_runner.html")
        page.wait_for_function("window.testReady === true")

        # Test initGame
        result = page.evaluate("""() => {
            window.gameLogic.initGame();
            return {
                safeAttempts: window.gameLogic.safeAttempts,
                activeCluesLength: window.gameLogic.activeClues.length,
                locationMapKeys: Object.keys(window.gameLogic.locationMap).length
            };
        }""")

        assert result['safeAttempts'] == 3  # Assuming SAFE_ATTEMPTS is 3
        assert result['activeCluesLength'] == 4
        assert result['locationMapKeys'] > 0

        browser.close()

def test_move_clue():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/test_runner.html")
        page.wait_for_function("window.testReady === true")

        # Initialize game
        page.evaluate("window.gameLogic.initGame()")

        # Find a location with a clue
        clue_location = page.evaluate("""() => {
            const locs = Object.keys(window.gameLogic.locationMap);
            return locs.find(loc => window.gameLogic.locationMap[loc] !== null);
        }""")

        assert clue_location is not None

        # Move the clue
        new_location = page.evaluate(f"""() => {{
            const slotIndex = window.gameLogic.locationMap["{clue_location}"];
            return window.gameLogic.moveClue(slotIndex, "{clue_location}");
        }}""")

        assert new_location is not None
        assert new_location != clue_location

        # Verify old location is empty
        old_loc_value = page.evaluate(f"""() => {{
            return window.gameLogic.locationMap["{clue_location}"];
        }}""")
        assert old_loc_value is None

        # Verify new location has the clue
        new_loc_value = page.evaluate(f"""() => {{
            return window.gameLogic.locationMap["{new_location}"];
        }}""")
        assert new_loc_value is not None

        browser.close()

def test_skeleton_key():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/test_runner.html")
        page.wait_for_function("window.testReady === true")

        # Check default
        has_key = page.evaluate("window.gameLogic.hasSkeletonKey")
        assert has_key is False

        # Set key
        page.evaluate("window.gameLogic.setHasSkeletonKey(true)")
        has_key = page.evaluate("window.gameLogic.hasSkeletonKey")
        assert has_key is True

        browser.close()

if __name__ == "__main__":
    # If run directly, run the tests
    test_game_logic_initialization()
    test_move_clue()
    test_skeleton_key()
    print("All game logic tests passed!")
