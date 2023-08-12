import { ActionIcon, Button, Flex, Paper, Select, Title, createStyles } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconPlus, IconTrash } from '@tabler/icons-react';
import { invoke } from '@tauri-apps/api';
import { useEffect, useState } from 'react';
import { fetch_stashes } from '../api/client';
import {
	useGetProfiles,
	useGetSingleStash,
	useGetSnapshotItems,
	useGetSnapshots,
} from '../services/services';
import { Item } from '../types/types';
import ProfileModal from './ProfileModal';
import { Snapshot } from '../bindings';

type Props = {
	setItems: React.Dispatch<React.SetStateAction<Item[]>>;
};

const TopBar = ({ setItems }: Props) => {
	const { classes } = useStyles();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
	const [shouldSearch, setShouldSearch] = useState(false);

	const { data: profilesData = [], isLoading: isProfilesLoading } = useGetProfiles();

	const selectedProfileStashes = profilesData.find(
		(x) => x.profile.id.toString() === selectedProfile
	)?.stashes[0];

	const { data: stashData, isFetching: isStashDataFetching } = useGetSingleStash(
		selectedProfileStashes || '',
		{
			enabled: shouldSearch && !!selectedProfileStashes,
			onSuccess: () => {
				setShouldSearch(false);
				setItems(stashData?.items || []);
			},
		}
	);

	const { data: snapshotData, isFetching: isSnapshotDataFetching } = useGetSnapshots(
		Number(selectedProfile),
		{
			enabled: !!selectedProfile,
		}
	);

	const latestSnapshot = snapshotData?.[0];

	const { data: snapshotItemsData, isFetching: isSnapshotItemDataFetching } = useGetSnapshotItems(
		latestSnapshot as Snapshot,
		{ enabled: !!latestSnapshot }
	);

	useEffect(() => {
		setItems(snapshotItemsData as Item[]);
	}, [selectedProfile]);

	return (
		<>
			<Paper className={classes.root}>
				<Flex align={'center'} justify={'space-between'}>
					<Flex align={'center'} gap="xs" className={classes.logoContainer}>
						<img src="/logo.svg" height={44} width={44} />
						<Title order={1} size="h2" color="white">
							LootHound
						</Title>
					</Flex>
					<div className={classes.logoDecoration} />
					<Flex align={'center'} justify={'center'} gap="12px">
						<Select
							value={selectedProfile}
							onChange={setSelectedProfile}
							placeholder={profilesData.length < 1 ? 'No profiles found' : 'Pick a profile'}
							data={profilesData.map(({ profile }) => ({
								label: profile.name,
								value: String(profile.id),
							}))}
							disabled={profilesData.length < 1 || isProfilesLoading}
						/>
						<Button
							onClick={async () => {
								const snapshot = await invoke('plugin:sql|new_snapshot', {
									profileId: parseInt(selectedProfile as string),
								});

								const s = await fetch_stashes(
									profilesData.find((x) => x.profile.id.toString() === selectedProfile)
										?.stashes as string[]
								);

								const extraItems = [];

								for (const stashtab of s) {
									if (stashtab.type == 'MapStash') {
										for (const child of stashtab.children) {
											const item = {
												verified: false,
												w: 1,
												h: 1,
												icon: child.metadata.map.image,
												name: child.metadata.map.name,
												typeLine: child.metadata.map.name,
												baseType: child.metadata.map.name,
												identified: true,
												frameType: 0,
											};
											await invoke('plugin:sql|add_items_to_snapshot', {
												snapshot: snapshot,
												items: [item],
												stashId: stashtab.id,
											});
											extraItems.push(item);
										}
									} else {
										await invoke('plugin:sql|add_items_to_snapshot', {
											snapshot: snapshot,
											items: stashtab.items,
											stashId: stashtab.id,
										});
									}
								}

								const i = s.filter((x) => 'items' in x).flatMap((x) => x.items) as Item[];
								setItems(i.concat(extraItems));
							}}
							disabled={isStashDataFetching || isSnapshotDataFetching || isSnapshotItemDataFetching}
						>
							Take Snapshot
						</Button>
						<ActionIcon onClick={open} size="lg" variant="outline" aria-label="Show notifications">
							<IconPlus size="16px" />
						</ActionIcon>
						<ActionIcon aria-label="Delete snapshots" variant="outline" size="lg" color="red">
							<IconTrash size="16px" />
						</ActionIcon>
						<ActionIcon size="lg" variant="outline" aria-label="Show notifications">
							<IconBell size="16px" />
						</ActionIcon>
						<ProfileModal isOpen={opened} onClose={close} />
					</Flex>
				</Flex>
			</Paper>
		</>
	);
};

const useStyles = createStyles((theme) => ({
	root: {
		padding: `0 calc(${theme.spacing.md} * 1.5)`,
		position: 'relative',
		background: 'black',
		marginBottom: '12px',
	},
	logoContainer: {
		padding: '12px',
		zIndex: 200,
	},
	logoDecoration: {
		position: 'absolute',
		background: theme.fn.linearGradient(45, theme.colors.red[9], theme.colors.red[7]),
		transform: 'skew(-45deg) translateX(-30%)',
		borderRadius: '4px',
		width: '30%',
		height: '100%',
	},
}));

export default TopBar;
