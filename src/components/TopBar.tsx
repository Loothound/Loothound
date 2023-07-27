import { ActionIcon, Box, Button, Flex, Paper, Select, createStyles } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import ProfileModal from './ProfileModal';
import { getProfiles } from '../api/db';
import api from '../api/client';
import { ExtendedStashTab } from '../types/types';
import { ProfileWithStashes } from '../api/db';

const TopBar = ({ setItems }) => {
	const { classes } = useStyles();
	const [opened, { open, close }] = useDisclosure(false);
	const [profiles, setProfiles] = useState<ProfileWithStashes[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
	const [isProfilesLoading, setisProfilesLoading] = useState(false);

	useEffect(() => {
		setisProfilesLoading(true);
		getProfiles()
			.then((data) => setProfiles(data))
			.finally(() => setisProfilesLoading(false));
	}, []);

	return (
		<>
			<Paper className={classes.root}>
				<Flex align={'center'} justify={'space-between'}>
					<Box />
					<Flex align={'center'} justify={'center'} gap="12px">
						<Select
							value={selectedProfile}
							onChange={setSelectedProfile}
							placeholder={profiles.length < 1 ? 'No profiles found' : 'Pick a profile'}
							data={profiles.map((profile) => ({
								label: profile.profile.name,
								value: String(profile.profile.id),
							}))}
							disabled={profiles.length < 1 || isProfilesLoading}
						/>
						<Button
							onClick={async () => {
								const {
									data: { stash },
								} = await api.get<{
									stash: ExtendedStashTab;
								}>(
									`stash/Crucible/${
										profiles.find((x) => x.profile.id.toString() === selectedProfile)?.stashes[0]
									}`
								);
								setItems(stash.items);
							}}
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
