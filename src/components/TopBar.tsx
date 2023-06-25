import { ActionIcon, Box, Button, Flex, Paper, Select, createStyles } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconPlus, IconTrash } from '@tabler/icons-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import useDb from '../DbContext';
import { ExtendedStashTab } from '../types/types';
import ProfileModal from './ProfileModal';

const TopBar = () => {
	const { classes } = useStyles();
	const [opened, { open, close }] = useDisclosure(false);
	const [profiles, setProfiles] = useState<ProfileData[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
	const [isProfilesLoading, setisProfilesLoading] = useState(false);
	const db = useDb();

	useEffect(() => {
		setisProfilesLoading(true);
		db.selectFrom('profiles')
			.selectAll()
			.execute()
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
							data={profiles.map((profile) => ({ label: profile.name, value: String(profile.id) }))}
							disabled={profiles.length < 1 || isProfilesLoading}
						/>
						<Button
						// disabled={isStashListLoading || !selectedStashId}
						// onClick={async () => {
						// 	const {
						// 		data: { stash },
						// 	} = await api.get<{
						// 		stash: ExtendedStashTab;
						// 	}>(`stash/Crucible/${selectedStashId}`);
						// 	console.log(stash);
						// 	setStash(stash);
						// }}
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

interface ProfileData {
	id: number;
	name: string;
	league_id: string;
	pricing_league: string;
}
