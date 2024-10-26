import { isNullOrBlank } from "../utils"
import { ICollections, IIdentify, IProfile, IReleases, IReleaseSet, VinylAPIImageMap } from "./interface"

const API_URL = "https://api.discogs.com"

export const getMe = async (password: string): Promise<IIdentify> => {
	const response = await fetch(`${API_URL}/oauth/identity`, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Discogs token=${password}`,
		},
	})
	if (!response.ok) {
		throw new Error("Network response was not ok")
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
		throw new Error("Network response was not ok")
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
	
	const fetchReleases = async (
		url: string,
		releaseType: 'collection' | 'wants'
	): Promise<IReleases[]> => {
		let allReleases: IReleases[] = []
		while (url) {
			const response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Discogs token=${password}`,
				},
			})

			if (!response.ok) {
				throw new Error("Network response was not ok")
			}

			const data: ICollections = await response.json()

			let imageMap: Record<number, VinylAPIImageMap> = {}
			if (vinylURL && vinylURL !== "") {
				try {
					const secondaryResponse = await fetch(`${vinylURL}/api/queue`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(
							// @ts-expect-error Cheating a bit - converting the reference to keep the same models.
							(releaseType === 'wants' ? data.wants : data.releases).map((item) => item.basic_information.id) ?? []
						),
					})

					if (secondaryResponse.ok) {
						const imageData = await secondaryResponse.json()

						imageMap = imageData.available.reduce((acc: Record<number, VinylAPIImageMap>, record: any) => {
							acc[record.recordID] = {
								image: record.image,
								imageHigh: record.imageHigh,
								barcode: record.barcode,
							}
							return acc
						}, {})
					} else {
						console.warn("Vinyl API response was not ok, skipping.")
					}
				} catch (error) {
					console.error("Vinyl API response hit an error, skipping.", error)
				}
			}

			// @ts-expect-error Cheating a bit - converting the reference to keep the same models.
			const releasesExtraData = (releaseType === 'wants' ? data.wants : data.releases).map((release) => {
				const imageRecord = imageMap[release.basic_information.id] || {
					image: null,
					imageHigh: null,
					barcode: null,
				}
				return {
					...release,
					image_base64: imageQuality
						? !isNullOrBlank(imageRecord.imageHigh)
							? imageRecord.imageHigh
							: imageRecord.image
						: imageRecord.image,
					barcode: imageRecord.barcode,
				}
			})

			allReleases = [...allReleases, ...releasesExtraData]

			if (onProgress) {
				onProgress(data.pagination.page, data.pagination.pages)
			}

			// @ts-expect-error not sure?
			url = data.pagination.urls.next
		}

		return allReleases
	}

	// Fetch wants and collection in parallel
	const [wantsReleases, collectionReleases] = await Promise.all([
		fetchReleases(`${API_URL}/users/${username}/wants?per_page=100`, 'wants'),
		fetchReleases(`${API_URL}/users/${username}/collection/folders/0/releases?per_page=100`, 'collection'),
	])

	return {
		collection: collectionReleases,
		wants: wantsReleases,
	}
}
