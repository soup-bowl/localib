import { ICollections, IIdentify, IProfile, IReleases } from "./interface"

const API_URL = "https://api.discogs.com"
const API_TOKEN = "dfejgRsOzLNszWoSSmgGOoAARZVkJQSxrOtwWvvL"

export const getMe = async (): Promise<IIdentify> => {
	const response = await fetch(`${API_URL}/oauth/identity`, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Discogs token=${API_TOKEN}`,
		},
	})
	if (!response.ok) {
		throw new Error("Network response was not ok")
	}
	return response.json()
}

export const getProfile = async (): Promise<IProfile> => {
	const response = await fetch(`${API_URL}/users/soup-bowl`, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Discogs token=${API_TOKEN}`,
		},
	})
	if (!response.ok) {
		throw new Error("Network response was not ok")
	}
	return response.json()
}

export const getCollectionReleases = async (): Promise<IReleases[]> => {
	let allReleases: IReleases[] = []
	let url: string | undefined = `${API_URL}/users/soup-bowl/collection/folders/0/releases?sort=added&per_page=100`

	while (url) {
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Discogs token=${API_TOKEN}`,
			},
		})

		if (!response.ok) {
			throw new Error("Network response was not ok")
		}

		const data: ICollections = await response.json()
		allReleases = [...allReleases, ...data.releases]

		// Set the url to the next page, or undefined if there are no more pages
		url = data.pagination.urls.next
	}

	return allReleases
}
