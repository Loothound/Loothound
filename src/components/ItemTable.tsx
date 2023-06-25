import { Box, Table, createStyles } from '@mantine/core';
import { Line } from 'react-chartjs-2';
import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js';
import { Item } from '../types/types';

type Props = {
	items: Item[];
};

export const options = {
	events: [],
	responsive: true,
	borderWidth: 1.5,
	plugins: {
		legend: {
			display: false,
		},
		title: {
			display: false,
		},
	},
	scales: {
		x: {
			display: false,
		},
		y: {
			display: false,
		},
	},
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export const data = {
	labels,
	datasets: [
		{
			label: 'Dataset 1',
			data: labels.map(() => 1),
			borderColor: 'rgb(255, 99, 132)',
			backgroundColor: 'rgba(255, 99, 132, 0.5)',
			fill: false,
			pointRadius: 0,
			spanGaps: true,
			tension: 0.2,
		},
	],
};

const ItemTable = ({ items }: Props) => {
	const { classes } = useStyles();
	ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

	return (
		<Box className={classes.root}>
			<Table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>Amount</th>
						<th>Sparkline</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => {
						return (
							<tr key={item.id}>
								<td>{item.typeLine}</td>
								<td>{item.baseType}</td>
								<td>{item.stackSize}</td>
								<td>
									<div style={{ height: '50px' }}>
										<Line options={options} data={data} />
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
		</Box>
	);
};

const useStyles = createStyles((theme) => ({
	root: {
		padding: `.4rem calc(${theme.spacing.xl} * 1.5)`,
	},
}));

export default ItemTable;
