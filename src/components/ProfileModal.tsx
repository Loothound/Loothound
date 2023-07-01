import { Button, Flex, Modal, MultiSelect, Select, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { StashTab } from '../types/types';
import { invoke } from '@tauri-apps/api/tauri';

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

	const handleChange = async (value: string[]) => {
		console.log(value);
		setValues(value);
	};

	const insertProfileTrx = async () => {
		// TODO: Lystina, please make this actually use the user-provided name lmao
		await invoke('plugin:sql|create_profile', { profileName: 'RustTest', stashTabs: values });
	};

	useEffect(() => {
		setIsStashListLoading(true);
		api
			.get<{ stashes: StashTab[] }>('stash/Crucible')
			.then(({ data: { stashes } }) => {
				const options = stashes.map((stash) => ({
					label: stash.name,
					value: stash.id,
				}));
				for (const s of stashes as StashTab[]) {
					invoke('plugin:sql|insert_stash', {
						stashId: s.id,
						stashName: s.name,
						stashType: s.type,
					});
				}
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
