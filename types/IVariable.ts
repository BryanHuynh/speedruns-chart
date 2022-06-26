export default interface IVariable {
	id: string;
	name: string;
	selected: Option | null;
	options: Option[];
}

export interface Option {
	id: string;
	label: string;
}
