import { ActionIcon, Button, Flex, Paper, Select, Text, createStyles } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useGetProfiles, useGetSingleStash } from '../services/services';
import ProfileModal from './ProfileModal';
import { fetch_stashes } from '../api/client';
import { Item } from '../types/types';
import { invoke } from '@tauri-apps/api';

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

	return (
		<>
			<Paper className={classes.root}>
				<Flex align={'center'} justify={'space-between'}>
					<Flex align={'center'} gap="xs">
						<Text fz="xl" fw="bold">
							LootHound
						</Text>
					</Flex>
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
							disabled={isStashDataFetching}
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
		padding: `.4rem calc(${theme.spacing.xl} * 1.5)`,
	},
}));

export default TopBar;
