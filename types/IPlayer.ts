export default interface IPlayer {
	id: string;
	names: Names;
	supporterAnimation: boolean;
	pronouns: string;
	weblink: string;
	"name-style": NameStyle;
	role: string;
	signup: Date;
	location: Location;
	twitch: Speedrunslive;
	hitbox: null;
	youtube: Speedrunslive;
	twitter: Speedrunslive;
	speedrunslive: Speedrunslive;
	assets: Assets;
	links: Link[];
}

export interface Assets {
	icon: Speedrunslive;
	supporterIcon: null;
	image: Speedrunslive;
}

export interface Speedrunslive {
	uri: null | string;
}

export interface Link {
	rel: string;
	uri: string;
}

export interface Location {
	country: Country;
}

export interface Country {
	code: string;
	names: Names;
}

export interface Names {
	international: string;
	japanese: null;
}

export interface NameStyle {
	style: string;
	"color-from": Color;
	"color-to": Color;
}

export interface Color {
	light: string;
	dark: string;
}
