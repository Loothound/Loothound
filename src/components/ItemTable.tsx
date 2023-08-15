import { Box, Flex, createStyles } from '@mantine/core';
import { sortBy } from 'lodash';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { Snapshot, basicallyThisUseEffect } from '../api/db';

type Props = {
	snapshot: Snapshot;
	setTotal: React.Dispatch<React.SetStateAction<number>>;
	isSnapshotLoading: boolean;
	setIsSnapshotLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

interface ItemRecord {
	gggId: string;
	name: string;
	amount: number;
	value: number;
	icon: string;
}

const PAGE_SIZE = 14;

const ItemTable = ({ snapshot, setTotal, isSnapshotLoading }: Props) => {
	const { classes } = useStyles();
	const [records, setRecords] = useState<ItemRecord[]>([]);
	const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
		columnAccessor: 'value',
		direction: 'desc',
	});
	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!('id' in snapshot)) {
			console.log('this ran');
			return;
		}
		(async () => {
			console.log('this ran 2');
			setIsLoading(true);
			const res = await basicallyThisUseEffect(snapshot);
			const r: ItemRecord[] = [];
			for (const item_data of res.items) {
				const item = item_data.item;
				const value = item_data.price;
				const amount = item.stackSize ? Number(item.stackSize) : 1;
				r.push({
					gggId: item.id as string,
					name: item.name ? `${item.name} ${item.typeLine}` : item.typeLine,
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
		console.log(sortBy(records, sortStatus.columnAccessor));
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
				fetching={isLoading || isSnapshotLoading}
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
					{
						accessor: 'name',
						sortable: true,
					},
					{ accessor: 'amount', sortable: true },
					{
						accessor: 'value',
						sortable: true,
						render: ({ value }) =>
							value.toLocaleString(undefined, {
								maximumFractionDigits: 2,
								minimumFractionDigits: 2,
							}),
					},
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
