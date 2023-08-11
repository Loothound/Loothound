export type Semigroup<T> = {
	concat: (first: T, second: T) => T;
};

export type Monoid<T> = Semigroup<T> & {
	empty: () => T;
};
