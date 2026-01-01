from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173", timeout=60000)

            print("Waiting for Canvas...")
            page.wait_for_selector("canvas", timeout=60000)

            # Wait for text to appear (indicates loading done)
            page.wait_for_selector("text=Pacific Serenity", timeout=60000)

            # Take screenshot of initial state
            print("Taking screenshot 1...")
            page.screenshot(path="verification/initial.png")

            # Test sound toggle
            print("Testing sound toggle...")
            sound_btn = page.get_by_label("Enable sound")
            if sound_btn.is_visible():
                sound_btn.click()
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/sound_enabled.png")

            # Test ocean switch
            print("Testing ocean switch...")
            # Atlantic is index 1
            btns = page.locator("button[aria-label^='Switch to']")
            if btns.count() > 1:
                btns.nth(1).click()
                print("Clicked Atlantic...")
                # Wait for transition (approx 1.5s + buffer)
                page.wait_for_timeout(2000)
                page.screenshot(path="verification/atlantic.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
