export interface ICategories {
	id: string;
	name: string;
	weblink: string;
	type: string;
	rules: string;
	players: Players;
	miscellaneous: boolean;
	links: Link[];
}

export interface Players {
	id: string;
	rel: string;
	uri: string;
}

export interface Link {
	rel: string;
	uri: string;
}
