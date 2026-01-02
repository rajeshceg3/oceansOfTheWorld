from playwright.sync_api import sync_playwright
import time

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Removed "audio-capture" permission as it caused an error
        context = browser.new_context()
        page = context.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173", timeout=60000)

            print("Waiting for initial load...")
            # Wait for loader to disappear
            try:
                page.wait_for_selector("text=Loading", state="detached", timeout=30000)
                print("Loader disappeared.")
            except:
                print("Loader did not disappear or wasn't found (maybe loaded too fast).")

            print("Waiting for Canvas...")
            page.wait_for_selector("canvas", timeout=30000)

            # Wait for title text to appear
            page.wait_for_selector("h1:has-text('Pacific Serenity')", timeout=30000)

            # Give 3D scene a moment to render frames
            time.sleep(2)

            # Take screenshot of initial state
            print("Taking screenshot 1 (initial)...")
            page.screenshot(path="verification/initial.png")

            # Test sound toggle
            print("Testing sound toggle...")
            sound_btn = page.locator("button[aria-label='Enable sound']")
            if sound_btn.is_visible():
                sound_btn.click()
                time.sleep(1)
                page.screenshot(path="verification/sound_enabled.png")
            else:
                print("Sound button not found")

            # Test ocean switch
            print("Testing ocean switch...")
            # Atlantic is index 1
            btns = page.locator("button[aria-label^='Switch to']")
            count = btns.count()
            print(f"Found {count} navigation buttons.")

            if count > 1:
                # Hover to check tooltip interaction (optional)
                btns.nth(1).hover()
                time.sleep(0.5)

                print("Clicking Atlantic...")
                btns.nth(1).click()

                # Wait for transition
                print("Waiting for transition...")
                time.sleep(2.5)

                # Verify text changed - specifically looking for H1 to avoid tooltip ambiguity
                if page.locator("h1:has-text('Atlantic Drift')").is_visible():
                    print("Verified text changed to Atlantic Drift")
                else:
                    print("Warning: Text did not change to Atlantic Drift")

                page.screenshot(path="verification/atlantic.png")

        except Exception as e:
            print(f"Error: {e}")
            # Take error screenshot
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
