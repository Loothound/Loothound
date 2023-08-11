import { Group, Paper, SimpleGrid, Text, createStyles, rem } from '@mantine/core';
import {
	IconArrowDownRight,
	IconArrowUpRight,
	IconChartLine,
	IconClockHour3,
	IconCoin,
} from '@tabler/icons-react';

type Props = {
	total: number;
};

interface StatsGridData {
	title: string;
	icon: keyof typeof icons;
	value: string;
	diff: number;
}

const icons = {
	netWorth: IconCoin,
	income: IconChartLine,
	snapshot: IconClockHour3,
};

function getData(total: number): StatsGridData[] {
	console.log(total);
	return [
		{
			title: 'Net Worth',
			icon: 'netWorth',
			value: total.toFixed(2) + ' div',
			diff: 24,
		},
		{
			title: 'Income',
			icon: 'income',
			value: '420',
			diff: 24,
		},
		{
			title: 'Snapshot Count',
			icon: 'snapshot',
			value: '1',
			diff: 0,
		},
	];
}

export function SampleStats({ total }: Props) {
	const { classes } = useStyles();
	const stats = getData(total).map((stat) => {
		const Icon = icons[stat.icon];
		const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

		return (
			<Paper withBorder p="md" radius="md" key={stat.title}>
				<Group position="apart">
					<Text size="xs" className={classes.title}>
						{stat.title}
					</Text>
					<Icon className={classes.icon} size="24px" stroke={1.5} />
				</Group>

				<Group align="flex-end" spacing="xs" mt={36}>
					<Text className={classes.value}>{stat.value}</Text>
					<Text color={stat.diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} className={classes.diff}>
						<span>{stat.diff}%</span>
						<DiffIcon size="16px" stroke={1.5} />
					</Text>
				</Group>

				<Text fz="xs" c="dimmed" mt={7}>
					Compared to previous snapshot
				</Text>
			</Paper>
		);
	});
	return (
		<div className={classes.root}>
			<SimpleGrid className={classes.grid} cols={3}>
				{stats}
			</SimpleGrid>
		</div>
	);
}

const useStyles = createStyles((theme) => ({
	root: {
		padding: `0 calc(${theme.spacing.xl} * 1.5)`,
		display: 'flex',
		width: '100%',
	},

	value: {
		fontSize: rem(24),
		fontWeight: 700,
		lineHeight: 1,
	},

	grid: {
		width: '100%',
	},

	diff: {
		lineHeight: 1,
		display: 'flex',
		alignItems: 'center',
	},

	icon: {
		color: theme.colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[4],
	},

	title: {
		fontWeight: 700,
		textTransform: 'uppercase',
	},
}));
