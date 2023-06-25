import { Box, Button, Flex, Modal, MultiSelect, Select, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import useDb from '../DbContext';
import api from '../api/client';
import { StashTab } from '../types/types';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

interface Option {
	label: string;
	value: string;
}

const ProfileModal = ({ isOpen, onClose }: Props) => {
	const [values, setValues] = useState<string[]>([]);
	const [stashList, setStashList] = useState<Option[]>([]);
	const [isStashListLoading, setIsStashListLoading] = useState(false);
	const db = useDb();

	const handleChange = async (value: string[]) => {
		console.log(value);
		setValues(value);
	};

	const insertProfileTrx = async () => {
		db.transaction().execute(async (trx) => {
			const profile = await trx
				.insertInto('profiles')
				.values({ name: 'testProfile', league_id: '1', pricing_league: '1' })
				.returningAll()
				.executeTakeFirstOrThrow();

			for (const stashId of values) {
				const assoc = await trx
					.insertInto('profile_stash_assoc')
					.values({ profile_id: profile.id, stash_id: stashId })
					.returningAll()
					.executeTakeFirst();
				console.log(profile, assoc);
			}
		});
	};

	useEffect(() => {
		setIsStashListLoading(true);
		api
			.get<{ stashes: StashTab[] }>('stash/Crucible')
			.then(({ data: { stashes } }) => {
				const options = stashes.map((stash) => ({ label: stash.name, value: stash.id }));
				setStashList(options || []);
			})
			.finally(() => setIsStashListLoading(false));
	}, []);

	return (
		<Modal.Root opened={isOpen} onClose={onClose} size="md" centered>
			<Modal.Overlay />
			<Modal.Content sx={{ overflow: 'unset' }}>
				<Modal.Header>
					<Modal.Title>Create a profile</Modal.Title>
					<Modal.CloseButton />
				</Modal.Header>
				<Modal.Body>
					<Flex direction="column" gap={12}>
						<TextInput placeholder="Profile name" label="Profile name" withAsterisk />
						<Select
							label="Choose Pricing League"
							placeholder="Choose league"
							data={[
								{ label: 'Crucible', value: 'crucible' },
								{ label: 'Crucible HC', value: 'cruciblehc' },
							]}
							withAsterisk
						/>
						<Select
							label="Choose League"
							placeholder="Choose league"
							data={[
								{ label: 'Crucible', value: 'crucible' },
								{ label: 'Crucible HC', value: 'cruciblehc' },
							]}
							withAsterisk
						/>
						<MultiSelect
							data={stashList}
							label="Selected stashes"
							dropdownPosition="bottom"
							value={values}
							onChange={handleChange}
							disabled={isStashListLoading}
							placeholder={isStashListLoading ? 'Loading...' : 'Pick from your stashes'}
							withAsterisk
						/>
					</Flex>
					<Flex justify={'end'} gap={12}>
						<Button variant="outline" mt={16} onClick={onClose}>
							Cancel
						</Button>
						<Button mt={16} onClick={() => insertProfileTrx()}>
							Create
						</Button>
					</Flex>
				</Modal.Body>
			</Modal.Content>
		</Modal.Root>
	);
};

export default ProfileModal;
