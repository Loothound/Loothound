import { Box, createStyles } from '@mantine/core';
import { invoke } from '@tauri-apps/api';
import { randomBytes } from 'crypto';
import { sortBy } from 'lodash';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { Item } from '../types/types';

type Props = {
	items: Item[];
	setTotal: React.Dispatch<React.SetStateAction<number>>;
};

interface ItemWithPrice {
	item: Item;
	price: number;
}

const PAGE_SIZE = 15;

const ItemTable = ({ items, setTotal }: Props) => {
	const { classes } = useStyles();
	const [itemsWithPrice, setItemsWithPrice] = useState<ItemWithPrice[]>([]);
	const [records, setRecords] = useState<
		{
			name: string;
			type: string;
			amount: number;
			value: number;
			icon: string;
		}[]
	>([]);
	const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
		columnAccessor: 'name',
		direction: 'asc',
	});
	const [page, setPage] = useState(1);

	useEffect(() => {
		(async () => {
			const i = [];
			for (const item of items) {
				const itemWithPrice: ItemWithPrice = { item: item, price: 0 };
				const name = item.name.length > 0 ? item.name : item.typeLine;
				itemWithPrice.price = await invoke('plugin:sql|check_price', { name: name });
				if (name === 'Chaos Orb') {
					itemWithPrice.price = 1;
				}
				i.push(itemWithPrice);
			}
			setItemsWithPrice(i);
		})();
	}, [items]);

	useEffect(() => {
		const r = [];
		let total = 0;
		for (const i of itemsWithPrice) {
			const { item, price } = i;
			r.push({
				name: item.name.length > 0 ? item.name : item.typeLine,
				type: item.baseType,
				amount: item.stackSize ? item.stackSize : 1,
				value: Math.round(
					(item.typeLine === 'Chaos Orb' ? 1 : price) * (item.stackSize ? item.stackSize : 1)
				),
				icon: item.icon,
			});
			total += Math.round(price * (item.stackSize ? item.stackSize : 1));
		}
		setRecords(r);
		const divPrice = itemsWithPrice.find((x) => x.item.typeLine === 'Divine Orb')?.price;
		setTotal(total / (divPrice || 1));
	}, [itemsWithPrice]);

	useEffect(() => {
		const data = sortBy(records, sortStatus.columnAccessor);
		setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
	}, [sortStatus]);

	return (
		<Box className={classes.root}>
			<DataTable
				withBorder
				borderRadius="sm"
				mt="sm"
				withColumnBorders
				striped
				highlightOnHover
				records={records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
				minHeight={200}
				columns={[
					{
						accessor: 'icon',
						// Icon image thingy from PoE API seems to always be 47px², scaling it down a bit for the UI
						render: ({ icon }) => <img src={icon} height="40px"></img>,
						width: '60px',
					},
					{ accessor: 'name', sortable: true },
					{ accessor: 'type' },
					{ accessor: 'amount', sortable: true },
					{ accessor: 'value', sortable: true },
				]}
				sortStatus={sortStatus}
				onSortStatusChange={setSortStatus}
				page={page}
				onPageChange={setPage}
				recordsPerPage={PAGE_SIZE}
				totalRecords={itemsWithPrice.length}
			/>
		</Box>
	);
};

const useStyles = createStyles((theme) => ({
	root: {
		padding: `.4rem calc(${theme.spacing.xl} * 1.5)`,
	},
}));

export default ItemTable;
