from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            # 1. Navigate to the web UI
            page.goto("http://localhost:3000")

            # 2. Assert that the main heading is visible
            expect(page.get_by_role("heading", name="Route Analysis Tool")).to_be_visible()

            # 3. Take a screenshot of the initial page
            page.screenshot(path="jules-scratch/verification/verification.png")

            print("Successfully captured screenshot of the UI.")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Take a screenshot even on failure for debugging
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()