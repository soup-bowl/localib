import { ICollections, IIdentify, IProfile, IReleases, VinylAPIImageMap } from "./interface"

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

export const getCollectionWants = async (
	username: string,
	password: string,
	imageQuality: boolean,
	onProgress?: (page: number, pages: number) => void
): Promise<IReleases[]> => {
	let allReleases: IReleases[] = []
	let url: string | undefined = `${API_URL}/users/${username}/wants?per_page=100`
	const vinylURL = import.meta.env.VITE_VINYL_API_URL

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
					// @ts-expect-error Cheating a bit - converting the reference to keep the same models.
					body: JSON.stringify(data.wants.map((item) => item.basic_information.id) ?? []),
				})

				if (secondaryResponse.ok) {
					const imageData = await secondaryResponse.json()

					imageMap = imageData.available.reduce((acc: Record<number, VinylAPIImageMap>, record: any) => {
						acc[record.recordID] = { image: record.image, imageHigh: record.imageHigh, barcode: record.barcode }
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
		const releasesExtraData = data.wants.map((release) => {
			const imageRecord = imageMap[release.basic_information.id] || { image: null, imageHigh: null, barcode: null }
			return {
				...release,
				image_base64: (imageQuality) ? (imageRecord.imageHigh !== null ? imageRecord.imageHigh : imageRecord.image) : imageRecord.image,
				barcode: imageRecord.barcode,
			}
		})

		allReleases = [...allReleases, ...releasesExtraData]

		if (onProgress) {
			onProgress(data.pagination.page, data.pagination.pages)
		}

		// Set the url to the next page, or undefined if there are no more pages
		url = data.pagination.urls.next
	}

	return allReleases
}

export const getCollectionReleases = async (
	username: string,
	password: string,
	imageQuality: boolean,
	onProgress?: (page: number, pages: number) => void
): Promise<IReleases[]> => {
	let allReleases: IReleases[] = []
	let url: string | undefined = `${API_URL}/users/${username}/collection/folders/0/releases?per_page=100`
	const vinylURL = import.meta.env.VITE_VINYL_API_URL

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
					body: JSON.stringify(data.releases.map((item) => item.basic_information.id) ?? []),
				})

				if (secondaryResponse.ok) {
					const imageData = await secondaryResponse.json()

					imageMap = imageData.available.reduce((acc: Record<number, VinylAPIImageMap>, record: any) => {
						acc[record.recordID] = { image: record.image, imageHigh: record.imageHigh, barcode: record.barcode }
						return acc
					}, {})
				} else {
					console.warn("Vinyl API response was not ok, skipping.")
				}
			} catch (error) {
				console.error("Vinyl API response hit an error, skipping.", error)
			}
		}

		const releasesExtraData = data.releases.map((release) => {
			const imageRecord = imageMap[release.basic_information.id] || { image: null, imageHigh: null, barcode: null }
			return {
				...release,
				image_base64: (imageQuality) ? (imageRecord.imageHigh !== null ? imageRecord.imageHigh : imageRecord.image) : imageRecord.image,
				barcode: imageRecord.barcode,
			}
		})

		allReleases = [...allReleases, ...(releasesExtraData as IReleases[])]

		if (onProgress) {
			onProgress(data.pagination.page, data.pagination.pages)
		}

		// Set the url to the next page, or undefined if there are no more pages
		url = data.pagination.urls.next
	}

	return allReleases
}
