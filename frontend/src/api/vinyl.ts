import { IVinylResponse } from "./interface"

export const postVinylQueue = async (ids: number[]): Promise<IVinylResponse | undefined> => {
	const apiURL = import.meta.env.VITE_VINYL_API_URL

	if (apiURL === "" || apiURL === undefined) {
		return undefined
	}

	const response = await fetch(`${apiURL}/api/queue`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(ids),
	})

	if (!response.ok) {
		throw new Error("Network response was not ok")
	}

	return response.json()
}
