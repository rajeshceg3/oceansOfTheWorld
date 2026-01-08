from playwright.sync_api import sync_playwright

def debug_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")
        try:
            page.wait_for_selector('text=Loading', state='detached', timeout=10000)
        except:
            pass

        print(page.content())
        browser.close()

if __name__ == "__main__":
    debug_html()
