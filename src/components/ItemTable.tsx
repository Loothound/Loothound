import { Box, Flex, createStyles } from '@mantine/core';
import { sortBy } from 'lodash';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { basicallyThisUseEffect, Snapshot } from '../api/db';
import { Item } from '../types/types';

type Props = {
	snapshot: Snapshot;
	setTotal: React.Dispatch<React.SetStateAction<number>>;
};

interface ItemRecord {
	name: string;
	type: string;
	amount: number;
	value: number;
	icon: string;
}

const PAGE_SIZE = 14;

const ItemTable = ({ snapshot, setTotal }: Props) => {
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
		if (!('id' in snapshot)) {
			setIsLoading(false);
			return;
		}
		(async () => {
			const res = await basicallyThisUseEffect(snapshot);
			const r: ItemRecord[] = [];
			for (const item_data of res.items) {
				const item = item_data.item;
				const value = item_data.price;
				const amount = item.stackSize ? Number(item.stackSize) : 1;
				r.push({
					name: item.name,
					type: item.typeLine,
					amount: amount,
					value: value,
					icon: item.icon,
				});
			}
			const data = sortBy(r, sortStatus.columnAccessor);
			setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
			setTotal(res.total_div);
			setIsLoading(false);
		})();
	}, [snapshot]);

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
