export interface IGame {
	id: string;
	names: Names;
	abbreviation: string;
	weblink: string;
	released: number;
	"release-date": Date;
	ruleset: Ruleset;
	romhack: boolean;
	gametypes: any[];
	platforms: string[];
	regions: string[];
	genres: any[];
	engines: any[];
	developers: any[];
	publishers: any[];
	moderators: Moderators;
	created: Date;
	assets: { [key: string]: Asset | null };
	links: Link[];
}

export interface Names {
	international: string;
	japanese: string;
	twitch: string;
}

export interface Moderators {
	wzx7q875: string;
	zzb12med: string;
}

export interface Ruleset {
	"show-milliseconds": boolean;
	"require-verification": boolean;
	"require-video": boolean;
	"run-times": string[];
	"default-time": string;
	"emulators-allowed": boolean;
}

export interface Link {
	rel: string;
	uri: string;
}

export interface Asset {
	uri: string;
	width: number;
	height: number;
}
