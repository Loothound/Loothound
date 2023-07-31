import { ActionIcon, Button, Flex, Paper, Select, Text, createStyles } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useGetProfiles, useGetSingleStash } from '../services/services';
import { Item } from '../types/types';
import ProfileModal from './ProfileModal';

interface TopBarProps {
	setItems: React.Dispatch<Item[]>;
}

const TopBar = ({ setItems }: TopBarProps) => {
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
								setShouldSearch(true);
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
