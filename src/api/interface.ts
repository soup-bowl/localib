interface pagination {
	page: number
	pages: number
	per_page: number
	items: number
	urls: {
		first?: string
		last?: string
		prev?: string
		next?: string
	}
}

interface artist {
	id: number
	resource_url: string
	name: string
	anv: string
	join: string
	role: string
	tracks: string
}

interface label {
	id: number
	resource_url: string
	name: string
	catno: string
	entity_type: string
	entity_type_name: string
}

interface releases {
	id: number
	instance_id: number
	folder_id: number
	date_added: Date
	rating: number
	basic_information: {
		id: number
		master_id: number
		master_url?: string
		resource_url: string
		thumb: string
		cover_image: string
		title: string
		year: number
		formats: [
			{
				name: string
				qty: string
				descriptions: string[]
			},
		]
		artists: artist[]
		labels: label[]
		genres: string[]
		styles: string[]
	}
}

export interface ICollections {
	pagination: pagination
	releases: releases[]
}

export interface IIdentify {
	id: number
	username: string
	resource_url: string
	consumer_name: string
}

export interface IProfile {
	id: number
	username: string
	name: string
	email: string
	resource_url: string
	inventory_url: string
	collection_folders_url: string
	collection_fields_url: string
	wantlist_url: string
	uri: string
	profile: string
	home_page: string
	location: string
	registered: string
	num_lists: number
	num_for_sale: number
	num_collection: number
	num_wantlist: number
	num_pending: number
	releases_contributed: number
	rank: number
	releases_rated: number
	rating_avg: number
}
