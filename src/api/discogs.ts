import { ICollections, IIdentify, IProfile } from "./interface"

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

export const getCollectionReleases = async (): Promise<ICollections> => {
	const response = await fetch(`${API_URL}/users/soup-bowl/collection/folders/0/releases?sort=added`, {
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
