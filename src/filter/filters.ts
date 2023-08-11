import { type Monoid } from './types';

export type Filter = StringFilter | NumberFilter | Record<string, never>;

export interface BaseFilter {
	type: string;
}

export interface StringFilter extends BaseFilter {
	value: string[];
}

export interface NumberFilter extends BaseFilter {
	op: 'gt' | 'lt' | 'eq' | 'lte' | 'gte';
	value: number;
}

export function fold<T>(foldable: T[], monoid: Monoid<T>): T {
	return foldable.reduce(monoid.concat, monoid.empty());
}

export function foldMap<T, M>(mapper: (t: T) => M, monoid: Monoid<M>, foldable: T[]): M {
	return fold(foldable.map(mapper), monoid);
}

const ListMonoid: Monoid<unknown[]> = {
	empty: () => [],
	concat: (first, second) => first.concat(second),
};

export const StringFilterMonoid: Monoid<StringFilter> = {
	empty: () => ({ value: [], type: 'string' }),
	concat: (first, second) => ({
		type: 'string',
		value: fold([first.value, second.value], ListMonoid) as string[],
	}),
};

export const SingleFilterMonoid: Monoid<Filter> = {
	empty: () => ({}),
	concat: (first, second) => {
		if (first.type == undefined) {
			return second;
		}
		if (first.type != second.type) {
			throw new Error('Doofus.');
		}
		let monoid!: Monoid<any> | never;
		switch (first.type) {
			case 'string':
				monoid = StringFilterMonoid;
				break;
		}
		return fold([first, second], monoid);
	},
};

export const FilterMonoid: Monoid<Record<string, Filter>> = {
	empty: () => ({}),
	concat: (first, second) => {
		const third: Record<string, Filter> = structuredClone(second);
		for (const key in first) {
			if (key in second) {
				third[key] = fold([first[key], second[key]], SingleFilterMonoid);
			} else {
				third[key] = first[key];
			}
		}
		return third;
	},
};

export const stringFilter = (value: string[]): StringFilter => {
	return {
		...StringFilterMonoid.empty(),
		value,
	};
};

export const combineFilters = (filters: Record<string, Filter>[]): Record<string, Filter> => {
	return fold(filters, FilterMonoid);
};
