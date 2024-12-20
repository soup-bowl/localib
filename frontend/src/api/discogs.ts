import { isNullOrBlank } from "@/utils"
import {
	ICollections,
	IIdentify,
	IProfile,
	IRelease,
	IReleases,
	IReleaseSet,
	VinylAPIImageMap,
	VinylAPIImageRecord,
} from "./interface"

const API_URL = "https://api.discogs.com"

export const getMe = async (password: string): Promise<IIdentify> => {
	const response = await fetch(`${API_URL}/oauth/identity`, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Discogs token=${password}`,
		},
	})
	if (!response.ok) {
		throw new Error("Discogs API responded with an unexpected error.")
	}
	return response.json()
}

export const getProfile = async (username: string, password: string): Promise<IProfile> => {
	const response = await fetch(`${API_URL}/users/${username}`, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Discogs token=${password}`,
		},
	})
	if (!response.ok) {
		throw new Error("Discogs API responded with an unexpected error.")
	}
	return response.json()
}

export const getCollectionAndWants = async (
	username: string,
	password: string,
	imageQuality: boolean,
	onProgress?: (page: number, pages: number) => void
): Promise<IReleaseSet> => {
	const vinylURL = import.meta.env.VITE_VINYL_API_URL

	/**
	 * Fetches the image map from the Vinyl API for a given set of release IDs.
	 *
	 * @param {number[]} ids - Array of release IDs to fetch images for.
	 * @returns {Promise<Record<number, VinylAPIImageMap>>} - A map of release IDs to their corresponding image data.
	 */
	const fetchVinylAPIImageMap = async (ids: number[]): Promise<Record<number, VinylAPIImageMap>> => {
		if (!vinylURL) return {}

		try {
			const response = await fetch(`${vinylURL}/api/queue`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(ids),
			})

			if (response.ok) {
				const imageData = await response.json()
				return imageData.available.reduce(
					(acc: Record<number, VinylAPIImageMap>, record: VinylAPIImageRecord) => {
						acc[record.recordID] = {
							image: record.image,
							imageHigh: record.imageHigh,
							barcode: record.barcode?.replace(/\D/g, "") ?? undefined,
						}
						return acc
					},
					{}
				)
			} else {
				console.warn("Vinyl API response was not ok, skipping.")
			}
		} catch (error) {
			console.error("Vinyl API response hit an error, skipping.", error)
		}

		return {}
	}

	/**
	 * Enriches release data with additional information pulled from the Vinyl API.
	 *
	 * @param {any[]} releases - Array of release objects to enrich.
	 * @param {Record<number, VinylAPIImageMap>} imageMap - Map of release IDs to image data.
	 * @returns {any[]} - Enriched release objects with added image and barcode data.
	 */
	const enrichReleases = (releases: any[], imageMap: Record<number, VinylAPIImageMap>): any[] => {
		return releases.map((release) => {
			const getImage = (imageRecord: VinylAPIImageMap): string | undefined => {
				if (imageQuality) {
					return !isNullOrBlank(imageRecord.imageHigh) ? imageRecord.imageHigh : imageRecord.image
				}
				return imageRecord.image
			}

			const imageRecord = imageMap[release.basic_information.id] || {
				image: null,
				imageHigh: null,
				barcode: null,
			}

			return {
				...release,
				image_base64: getImage(imageRecord),
				barcode: imageRecord.barcode,
			}
		})
	}

	/**
	 * Fetches release data for a user, including collection or wantlist, from the Discogs API.
	 * Uses pagination to fetch all pages of data and enriches releases with image and barcode information.
	 *
	 * @param {string} url - The API endpoint URL to fetch release data from.
	 * @param {"collection" | "wants"} releaseType - The type of release data to fetch ("collection" or "wants").
	 * @returns {Promise<IReleases[]>} - Array of release data enriched with image and barcode information.
	 * @throws {Error} - Throws an error if the network response is not ok.
	 */
	const fetchReleases = async (url: string, releaseType: "collection" | "wants"): Promise<IReleases[]> => {
		let allReleases: IReleases[] = []

		while (url) {
			const response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Discogs token=${password}`,
				},
			})

			if (!response.ok) {
				throw new Error("Discogs API responded with an unexpected error.")
			}

			const data: ICollections = await response.json()

			// @ts-expect-error Cheating a bit - converting the reference to keep the same models.
			const ids = (releaseType === "wants" ? data.wants : data.releases).map((item) => item.basic_information.id)
			const imageMap = await fetchVinylAPIImageMap(ids)

			const releasesExtraData = enrichReleases(
				// @ts-expect-error Cheating a bit - converting the reference to keep the same models.
				releaseType === "wants" ? data.wants : data.releases,
				imageMap
			)

			allReleases = [...allReleases, ...releasesExtraData]

			if (onProgress) {
				onProgress(data.pagination.page, data.pagination.pages)
			}

			// @ts-expect-error not sure?
			url = data.pagination.urls?.next ?? null
		}

		return allReleases
	}

	// Fetch wants and collection in parallel
	const [wantsReleases, collectionReleases] = await Promise.all([
		fetchReleases(`${API_URL}/users/${username}/wants?per_page=100`, "wants"),
		fetchReleases(`${API_URL}/users/${username}/collection/folders/0/releases?per_page=100`, "collection"),
	])

	return {
		collection: collectionReleases,
		wants: wantsReleases,
	}
}

export const getReleaseInfo = async (password: string, id: number): Promise<IRelease> => {
	const response = await fetch(`${API_URL}/releases/${id}`, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Discogs token=${password}`,
		},
	})

	if (!response.ok) {
		throw new Error("Discogs API responded with an unexpected error.")
	}

	return await response.json()
}
