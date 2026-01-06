import asyncio
from playwright.async_api import async_playwright

async def verify_app():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))

        print("Navigating to app...")
        try:
            await page.goto("http://localhost:5173", timeout=60000)

            # Wait for canvas to be present
            await page.wait_for_selector("canvas", timeout=30000)
            print("Canvas element found.")

            # Check for loading text to disappear (indicating 3D scene loaded)
            # The loader has text "Loading"
            # We wait for it to detach
            try:
                await page.wait_for_selector("text=Loading", state="detached", timeout=30000)
                print("Loading screen finished.")
            except Exception as e:
                print(f"Warning: Loading screen might still be visible or not found: {e}")

            # Take screenshot
            await page.screenshot(path="verification/screenshot.png")
            print("Screenshot taken.")

            # Check for UI elements
            ui_overlay = await page.query_selector("h1")
            if ui_overlay:
                print("UI Overlay Title found.")
            else:
                print("UI Overlay Title NOT found.")

        except Exception as e:
            print(f"Error navigating or interacting: {e}")

        print("\nConsole Logs:")
        for log in console_logs:
            print(log)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_app())
