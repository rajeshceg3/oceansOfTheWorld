from playwright.sync_api import sync_playwright

def verify_ocean_scene():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # Wait for loading to finish (CustomLoader disappears)
            # The CustomLoader is inside <Html center>.
            # It has text "Loading X%".
            # We wait for it to detach.
            page.wait_for_selector('text=Loading', state='detached', timeout=30000)

            # Wait a bit for the scene to settle (fade in)
            page.wait_for_timeout(3000)

            # Take a screenshot of the initial state (Pacific)
            page.screenshot(path="verification/initial_ocean.png")

            # Click on the second ocean button (Atlantic)
            # Buttons are in a flex container, aria-label="Switch to Atlantic Drift"
            atlantic_btn = page.locator('button[aria-label="Switch to Atlantic Drift"]')
            atlantic_btn.click()

            # Wait for transition (approx 2s)
            page.wait_for_timeout(2500)

            # Take screenshot of Atlantic
            page.screenshot(path="verification/atlantic_ocean.png")

            print("Verification screenshots captured.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ocean_scene()
