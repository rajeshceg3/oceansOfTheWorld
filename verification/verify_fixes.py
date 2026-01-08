from playwright.sync_api import sync_playwright

def verify_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")

        try:
            page.wait_for_selector('text=Loading', state='detached', timeout=10000)
        except:
            print("Loading indicator timeout (might be gone already).")

        # 1. Verify OceanWorld Canvas Accessibility
        container = page.locator('div[aria-label="3D Ocean View"]')
        if container.count() > 0:
            role = container.get_attribute("role")
            print(f"Canvas Container Found. Role: {role}")
            if role == "img":
                print("PASS: Canvas has correct role.")
            else:
                print(f"FAIL: Canvas has incorrect role: {role}")
        else:
            print("FAIL: Canvas container not found.")

        # 2. Verify UIOverlay Sound Button Accessibility
        # Find button by accessible name
        sound_btn = page.locator('button[aria-label="Enable sound"]')
        if sound_btn.count() == 0:
             sound_btn = page.locator('button[aria-label="Mute sound"]')

        if sound_btn.count() > 0:
            print("Sound Button Found.")
            aria_pressed = sound_btn.get_attribute("aria-pressed")
            print(f"aria-pressed: {aria_pressed}")
            if aria_pressed is not None:
                print("PASS: Sound button has aria-pressed.")
            else:
                print("FAIL: Sound button missing aria-pressed.")

            # Check inner div hidden
            inner_div = sound_btn.locator("div").first
            aria_hidden = inner_div.get_attribute("aria-hidden")
            print(f"Inner div aria-hidden: {aria_hidden}")
            if aria_hidden == "true":
                print("PASS: Inner decorative div is hidden.")
            else:
                print("FAIL: Inner div not hidden.")
        else:
            print("FAIL: Sound button not found.")

        browser.close()

if __name__ == "__main__":
    verify_fixes()
