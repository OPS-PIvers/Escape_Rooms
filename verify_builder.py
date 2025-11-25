
from playwright.sync_api import Page, expect, sync_playwright
import time

def test_ui_elements(page: Page):
    # 1. Go to the builder page
    page.goto("http://localhost:8000/builder.html")
    page.wait_for_timeout(1000)
    
    # Fill out the form
    page.fill("#qTitle", "Test Q1")
    page.fill("#qText", "What is 1+1?")
    inputs = page.query_selector_all(".qOpt")
    inputs[0].fill("2")
    inputs[1].fill("3")
    inputs[2].fill("4")
    inputs[3].fill("5")
    
    # Click Add
    page.click("text=Add Question")
    
    # Add 3 more to satisfy requirement
    for i in range(3):
        page.fill("#qTitle", f"Test Q{i+2}")
        page.fill("#qText", f"Question {i+2}?")
        inputs = page.query_selector_all(".qOpt")
        inputs[0].fill("A")
        inputs[1].fill("B")
        inputs[2].fill("C")
        inputs[3].fill("D")
        page.click("text=Add Question")

    # Check list count
    count = page.inner_text("#qCount")
    if count != "4":
        print(f"Error: Expected 4 questions, found {count}")
    else:
        print("Added 4 questions successfully.")

    # Click Generate Link
    page.click("text=Generate Share Link")
    page.wait_for_timeout(500)
    
    link_text = page.inner_text("#outputLink")
    print(f"Generated Link: {link_text}")
    
    if "office.html?data=" in link_text:
        print("Link format looks correct.")
    else:
        print("Error: Link format incorrect.")

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
