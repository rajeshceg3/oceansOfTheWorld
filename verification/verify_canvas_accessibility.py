from playwright.sync_api import sync_playwright

def verify_canvas():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")
        try:
            page.wait_for_selector('text=Loading', state='detached', timeout=10000)
        except:
            pass

        # Check if the container with aria-label exists
        container = page.locator('div[aria-label="3D Ocean View"]')
        if container.count() > 0:
            print("Accessible container found.")
            # Check if it has role img
            role = container.get_attribute("role")
            print(f"Role: {role}")
        else:
            print("Accessible container NOT found.")

        browser.close()

if __name__ == "__main__":
    verify_canvas()
