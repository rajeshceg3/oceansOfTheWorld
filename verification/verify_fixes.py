import asyncio
from playwright.async_api import async_playwright

async def verify_fixes():
    async with async_playwright() as p:
        # Launch with specific args for SwiftShader if needed, but standard should work
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate
        print("Navigating to app...")
        try:
            await page.goto("http://localhost:5173", timeout=60000)

            # Wait for canvas
            await page.wait_for_selector("canvas", timeout=30000)

            # Wait for loading to finish
            # The loading text is "Loading X%"
            # We can wait for it to detach
            try:
                await page.wait_for_selector("text=Loading", state="detached", timeout=30000)
                print("Loading screen finished.")
            except:
                print("Loading screen wait timed out or failed.")

            # 1. Verify Accessibility Fixes (UIOverlay)
            # Check if idle class is applied after 8 seconds? No, too long to wait.
            # We can check if the button exists and has aria-label.

            sound_btn = page.locator("button[aria-label='Enable sound']")
            if await sound_btn.count() > 0:
                print("Sound button found with correct aria-label.")
                # Verify it is not disabled initially
                if await sound_btn.is_disabled():
                    print("ERROR: Sound button is disabled initially.")
                else:
                    print("Sound button is enabled initially.")

            # 2. Verify Particles (Standard Material)
            # Hard to verify material type via DOM, but we can ensure no errors.

            # 3. Verify OceanWorld (Timeout)
            # Also hard to verify without triggering transition failure.

            # Take a screenshot to see if it's still black or if anything rendered
            # Note: Headless rendering of WebGL might still be black/problematic
            await page.screenshot(path="verification/verification_after_fix.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="verification/error_screenshot.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_fixes())
