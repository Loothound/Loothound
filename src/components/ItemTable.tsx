import { Box, Flex, createStyles } from '@mantine/core';
import { invoke } from '@tauri-apps/api';
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

interface ItemRecord {
	name: string;
	type: string;
	amount: number;
	value: number;
	icon: string;
}

const PAGE_SIZE = 15;

const ItemTable = ({ items, setTotal }: Props) => {
	const { classes } = useStyles();
	const [records, setRecords] = useState<ItemRecord[]>([]);
	const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
		columnAccessor: 'value',
		direction: 'desc',
	});
	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		setIsLoading(true);
		const r = [];
		let total = 0;
		(async () => {
			for (const item of items) {
				const itemWithPrice: ItemWithPrice = { item: item, price: 0 };
				const name = item.name.length > 0 ? item.name : item.typeLine;
				itemWithPrice.price = await invoke('plugin:sql|check_price', { name: name });
				if (name === 'Chaos Orb') {
					itemWithPrice.price = 1;
				}
				const { item: itemObj, price } = itemWithPrice;
				r.push({
					gggId: itemObj.id,
					name: itemObj.name.length > 0 ? itemObj.name : itemObj.typeLine,
					type: itemObj.baseType,
					amount: itemObj.stackSize ? itemObj.stackSize : 1,
					value: Math.round(
						(itemObj.typeLine === 'Chaos Orb' ? 1 : price) *
							(itemObj.stackSize ? itemObj.stackSize : 1)
					),
					icon: itemObj.icon,
				});
				total += Math.round(price * (item.stackSize ? item.stackSize : 1));
			}
			const data = sortBy(r, sortStatus.columnAccessor);
			setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
			const divine = r.find((x) => x.name === 'Divine Orb');
			const divPrice = (divine?.value || 1) / (divine?.amount || 1);
			setTotal(total / (divPrice || 1));
			setIsLoading(false);
		})();
	}, [items]);

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
				idAccessor="gggId"
				fetching={isLoading}
				columns={[
					{
						accessor: 'icon',
						// Icon image thingy from PoE API seems to always be 47px², scaling it down a bit for the UI
						render: ({ icon }) => (
							<Flex justify={'center'}>
								<img src={icon} height="32px" />
							</Flex>
						),
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
				totalRecords={records.length}
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
