
from playwright.sync_api import sync_playwright
import json
import base64
import urllib.parse

def verify_share_link():
    # 1. Create custom data
    custom_questions = [
        {"t": "Q1 Title", "q": "Custom Question 1?", "o": ["A", "B", "C", "D"], "c": 0},
        {"t": "Q2 Title", "q": "Custom Question 2?", "o": ["A", "B", "C", "D"], "c": 1},
        {"t": "Q3 Title", "q": "Custom Question 3?", "o": ["A", "B", "C", "D"], "c": 2},
        {"t": "Q4 Title", "q": "Custom Question 4?", "o": ["A", "B", "C", "D"], "c": 3}
    ]
    
    json_str = json.dumps(custom_questions)
    encoded_data = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
    # URL encode just in case, though base64 is usually url-safe enough for simple tests, 
    # standard practice is to handle special chars if any. Base64 can have + and / and =.
    # The builder uses straight btoa().
    encoded_data_url = urllib.parse.quote(encoded_data)
    
    target_url = f"http://localhost:8000/office.html?data={encoded_data_url}"
    print(f"Testing URL: {target_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Listen for console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        page.goto(target_url)
        
        # Wait for the script to parse and run
        page.wait_for_timeout(2000)
        
        # Check the exposed debug variable
        loaded_questions = page.evaluate("window.debug_questionPool")
        
        if not loaded_questions:
            print("FAILURE: window.debug_questionPool is undefined or empty.")
            browser.close()
            return

        print(f"Loaded {len(loaded_questions)} questions in game.")
        
        # Verify content
        first_q = loaded_questions[0]
        # Note: The game logic sorts them randomly! So we check if the set contains our Q1.
        # But wait, the sort happens in initGame(). questionPool itself might be sorted or unsorted depending on when we inspect.
        # initGame() sorts questionPool in place: `questionPool.sort(...)`.
        
        found_q1 = False
        for q in loaded_questions:
            if q['t'] == "Q1 Title" and q['q'] == "Custom Question 1?":
                found_q1 = True
                break
        
        if found_q1:
            print("SUCCESS: Found 'Custom Question 1' in the game's question pool.")
        else:
            print("FAILURE: Did not find the custom question in the pool.")
            print("Pool content:", loaded_questions)

        browser.close()

if __name__ == "__main__":
    verify_share_link()
