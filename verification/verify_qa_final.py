import os
from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")

        try:
            page.wait_for_selector('text=Loading', state='detached', timeout=10000)
            print("Loading finished.")
        except:
            print("Loading indicator did not disappear in time.")

        page.screenshot(path="verification/screenshot_final.png")
        print("Screenshot taken.")

        # Check Canvas Container
        canvas = page.locator("div[aria-label='3D Ocean View']")
        if canvas.count() > 0:
            print("Canvas container found.")
        else:
            print("Canvas container NOT found.")

        browser.close()

if __name__ == "__main__":
    verify_app()
