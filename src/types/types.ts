export interface Socket {
	group: number;
	attr: boolean;
	sColour: string;
}

export interface Property {
	name: string;
	values: string[][];
	displayMode: number;
	progress?: number;
	type: number;
}

export interface Requirement {
	name: string;
	values: string[][];
	displayMode: number;
}

export interface Item {
	id: string;
	verified: boolean;
	w: number;
	h: number;
	ilvl: number;
	icon: string;
	league: string;
	sockets: Socket[];
	name: string;
	shaper: boolean;
	elder: boolean;
	baseType: string;
	fractured: boolean;
	synthesised: boolean;
	typeLine: string;
	identified: boolean;
	corrupted: boolean;
	lockedToCharacter: boolean;
	requirements: Requirement[];
	implicitMods: string[];
	explicitMods: string[];
	fracturedMods: string[];
	frameType: number;
	x: number;
	y: number;
	inventoryId: string;
	properties: Property[];
	flavourText: string[];
	craftedMods: string[];
	enchantMods: string[];
	utilityMods: string[];
	descrText: string;
	prophecyText: string;
	socket: number;
	stackSize?: number;
	maxStackSize?: number;
}

export interface StashTab {
	id: string;
	name: string;
	type: string;
	index?: number;
	metadata: {
		public?: boolean;
		folder?: boolean;
		colour?: string;
	};
}

export interface ExtendedStashTab {
	id: string;
	parent?: string;
	name: string;
	type: string;
	index?: number;
	metadata: {
		public?: boolean;
		folder?: boolean;
		colour?: string;
	};
	children: StashTab[];
	items?: Item[];
}
