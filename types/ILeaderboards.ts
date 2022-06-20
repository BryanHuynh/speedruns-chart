export default interface ILeaderboard {
	weblink: string;
	game: string;
	category: string;
	level: null;
	platform: null;
	region: null;
	emulators: null;
	"video-only": boolean;
	timing: string;
	values: Values;
	runs: RunElement[];
	links: SplitsElement[];
}

export interface SplitsElement {
	rel: string;
	uri: string;
}

export interface RunElement {
	place: number;
	run: Run;
}

export interface Run {
	id: string;
	weblink: string;
	game: string;
	level: null;
	category: string;
	videos: Videos;
	comment: null | string;
	status: StatusClass;
	players: Player[];
	date: Date;
	submitted: Date;
	times: Times;
	system: System;
	splits: SplitsElement | null;
	values: Values;
}

export interface Player {
	rel: Rel;
	id: string;
	uri: string;
	name?: string;
}

export enum Rel {
	Guest = "guest",
	User = "user",
}

export interface StatusClass {
	status: StatusEnum;
	examiner: string;
	"verify-date": Date;
}

export enum StatusEnum {
	Verified = "verified",
}

export interface System {
	platform: Platform;
	emulated: boolean;
	region: Region;
}

export enum Platform {
	The8Gej2N93 = "8gej2n93",
}

export enum Region {
	O316X197 = "o316x197",
	Pr184Lqn = "pr184lqn",
}

export interface Times {
	primary: string;
	primary_t: number;
	realtime: string;
	realtime_t: number;
	realtime_noloads: null | string;
	realtime_noloads_t: number;
	ingame: null | string;
	ingame_t: number;
}

export interface Values {}

export interface Videos {
	links: VideosLink[];
}

export interface VideosLink {
	uri: string;
}
