import { IVinylResponse } from "./interface"

const VINYL_API_URL = `${import.meta.env.VITE_VINYL_API_URL}/api/queue`

export const postVinylQueue = async (ids: number[]): Promise<IVinylResponse> => {
	const response = await fetch(VINYL_API_URL, {
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
