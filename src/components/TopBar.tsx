import {
	ActionIcon,
	Button,
	Divider,
	Flex,
	Paper,
	Select,
	Title,
	createStyles,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconPlus, IconSettings, IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api';
import { useEffect } from 'react';
import { fetch_stashes } from '../api/client';
import { Snapshot } from '../bindings';
import { useGetProfiles, useGetSnapshots } from '../services/services';
import { Item } from '../types/types';
import EditProfileModal from './EditProfileModal';
import ProfileModal from './ProfileModal';

type Props = {
	setSnapshot: React.Dispatch<React.SetStateAction<Snapshot>>;
	selectedProfileId: number | bigint | null;
	setSelectedProfileId: React.Dispatch<React.SetStateAction<number | bigint | null>>;
	setIsSnapshotLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const TopBar = ({
	setSnapshot,
	selectedProfileId,
	setSelectedProfileId,
	setIsSnapshotLoading,
}: Props) => {
	const queryClient = useQueryClient();
	const { classes } = useStyles();

	const [isAddProfileModalOpen, { open: openAddProfileModal, close: closeAddProfileModal }] =
		useDisclosure(false);
	const [isEditProfileModalOpen, { open: openEditProfileModal, close: closeEditProfileModal }] =
		useDisclosure(false);

	const { data: profilesData = [], isLoading: isProfilesLoading } = useGetProfiles();
	const { data: snapshotData } = useGetSnapshots(Number(selectedProfileId), {
		enabled: !!selectedProfileId,
	});

	console.log(snapshotData);

	const latestSnapshot = snapshotData?.[snapshotData?.length - 1];

	useEffect(() => {
		if (latestSnapshot != undefined) {
			setSnapshot(latestSnapshot);
		} else {
			setSnapshot({} as unknown as Snapshot);
		}
	}, [selectedProfileId, latestSnapshot]);

	const handleSnapshotButton = async () => {
		setIsSnapshotLoading(true);
		const snapshot: Snapshot = await invoke('plugin:sql|new_snapshot', {
			profileId: selectedProfileId,
		});

		queryClient.invalidateQueries(['snapshots', selectedProfileId]);

		const s = await fetch_stashes(
			profilesData.find((x) => x.profile.id === selectedProfileId)?.stashes as string[]
		);

		const extraItems: Item[] = [];

		let total = 0;

		for (const stashtab of s) {
			if (stashtab.type == 'MapStash') {
				for (const child of stashtab.children) {
					if (!child.metadata.map) return;
					const item: any = {
						verified: false,
						w: 1,
						h: 1,
						icon: child.metadata?.map?.image,
						name: child.metadata?.map?.name,
						typeLine: child.metadata?.map?.name,
						baseType: child.metadata?.map?.name,
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
				setIsSnapshotLoading(false);
			} else {
				total = await invoke('plugin:sql|add_items_to_snapshot', {
					snapshot: snapshot,
					items: stashtab.items,
					stashId: stashtab.id,
				});
				setIsSnapshotLoading(false);
			}
		}
		snapshot.value = total;
		setSnapshot(snapshot);
	};

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
					<Flex align={'center'} justify={'center'} gap="4px">
						{selectedProfileId ? (
							<ActionIcon
								onClick={openEditProfileModal}
								size="lg"
								variant="subtle"
								aria-label="Show notifications"
							>
								<IconSettings size="16px" />
							</ActionIcon>
						) : (
							<></>
						)}
						<Select
							value={String(selectedProfileId)}
							onChange={(value) => setSelectedProfileId(Number(value))}
							placeholder={profilesData.length < 1 ? 'No profiles found' : 'Pick a profile'}
							data={profilesData.map(({ profile }) => ({
								label: profile.name,
								value: String(profile.id),
							}))}
							disabled={profilesData.length < 1 || isProfilesLoading}
							type="text"
						/>
						<ActionIcon
							onClick={openAddProfileModal}
							size="lg"
							variant="subtle"
							aria-label="Show notifications"
						>
							<IconPlus size="16px" />
						</ActionIcon>
						<ActionIcon aria-label="Delete snapshots" variant="subtle" size="lg" color="red">
							<IconTrash size="16px" />
						</ActionIcon>
						<Divider orientation="vertical" />
						<Button onClick={handleSnapshotButton} disabled={!selectedProfileId}>
							Take Snapshot
						</Button>
						<Divider orientation="vertical" />
						<ActionIcon size="lg" variant="outline" aria-label="Show notifications">
							<IconBell size="16px" />
						</ActionIcon>
						<ProfileModal
							isOpen={isAddProfileModalOpen}
							onClose={closeAddProfileModal}
							setSelectedProfile={setSelectedProfileId}
						/>
						<EditProfileModal
							isOpen={isEditProfileModalOpen}
							onClose={closeEditProfileModal}
							profileData={profilesData.find((x) => x.profile.id === selectedProfileId)}
						/>
					</Flex>
				</Flex>
			</Paper>
		</>
	);
};

const useStyles = createStyles((theme) => ({
	root: {
		padding: `0 calc(${theme.spacing.md} * 1.5)`,
		position: 'sticky',
		top: 0,
		width: '100%',
		background: 'black',
		marginBottom: '12px',
		zIndex: 9999,
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
