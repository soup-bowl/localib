import { expect, test } from "@playwright/test"
import { mockDiscogsCollectionApi } from "./support/discogsMocks"

test.describe("Localib core journeys", () => {
	test("shows logged-out message when auth is missing", async ({ page }) => {
		await page.goto("/collection")
		await expect(page.getByText("You are not logged in.")).toBeVisible()
	})

	test("loads mocked collection and supports searching", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("username", JSON.stringify("test-user"))
			localStorage.setItem("accessToken", JSON.stringify("access-token"))
			localStorage.setItem("secretToken", JSON.stringify("secret-token"))
		})
		await mockDiscogsCollectionApi(page)

		await page.goto("/collection")
		await expect(page.getByText("Kind Of Blue")).toBeVisible()

		await page.locator('ion-segment-button[value="want"]').click()
		await expect(page.getByText("The Black Saint and the Sinner Lady")).toBeVisible()

		await page.locator('ion-tab-button[tab="search"]').click()
		await page.locator("ion-searchbar input").fill("miles")

		await expect(page.getByText("Kind Of Blue")).toBeVisible()
		await expect(page.getByText("A Love Supreme")).toHaveCount(0)
	})
})
