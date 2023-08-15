import { Button, Flex, Modal, MultiSelect, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAddProfile, useFetchStashes } from '../services/services';
import { StashTab } from '../types/types';
import { Dispatch, SetStateAction } from 'react';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	setSelectedProfile: Dispatch<SetStateAction<number | bigint | null>>;
};

const ProfileModal = ({ isOpen, onClose, setSelectedProfile }: Props) => {
	const { data: stashesData = [], isLoading: isStashesDataLoading } = useFetchStashes();

	const addProfileMutation = useAddProfile();

	const form = useForm({
		initialValues: {
			profileName: '',
			pricingLeague: '',
			leagueId: '',
			stashTabs: [],
		},

		validate: {
			profileName: (value) => (value ? null : 'Profile name is required'),
			pricingLeague: (value) => (value ? null : 'Pricing league is required'),
			leagueId: (value) => (value ? null : 'League is required'),
			stashTabs: (value) => (value.length ? null : 'You must choose at least a stash'),
		},
	});

	const handleFormSubmit = async (values: CreateProfilePayload) => {
		const profileMutation = await addProfileMutation.mutateAsync(values);
		form.reset();
		setSelectedProfile(profileMutation.id);
		onClose();
	};

	const makeOptions = ({ stashes = [] }: any) => {
		const options = stashes.map((stash: StashTab) => ({
			label: stash.name,
			value: stash.id,
		}));
		return options;
	};

	return (
		<Modal.Root opened={isOpen} onClose={onClose} size="md" centered>
			<Modal.Overlay />
			<Modal.Content sx={{ overflow: 'unset' }}>
				<Modal.Header>
					<Modal.Title>Create a profile</Modal.Title>
					<Modal.CloseButton />
				</Modal.Header>
				<Modal.Body>
					<form onSubmit={form.onSubmit((values) => handleFormSubmit(values))}>
						<Flex direction="column" gap={12}>
							<TextInput
								placeholder="Profile name"
								label="Profile name"
								withAsterisk
								{...form.getInputProps('profileName')}
							/>
							<Select
								label="Choose Pricing League"
								placeholder="Choose league"
								data={[
									{ label: 'Crucible', value: 'crucible' },
									{ label: 'Crucible HC', value: 'cruciblehc' },
								]}
								withAsterisk
								{...form.getInputProps('pricingLeague')}
							/>
							<Select
								label="Choose League"
								placeholder="Choose league"
								data={[
									{ label: 'Crucible', value: 'crucible' },
									{ label: 'Crucible HC', value: 'cruciblehc' },
								]}
								withAsterisk
								{...form.getInputProps('leagueId')}
							/>
							<MultiSelect
								data={makeOptions(stashesData)}
								label="Selected stashes"
								dropdownPosition="bottom"
								disabled={isStashesDataLoading}
								placeholder={isStashesDataLoading ? 'Loading...' : 'Pick from your stashes'}
								withAsterisk
								{...form.getInputProps('stashTabs')}
							/>
						</Flex>
						<Flex justify={'end'} gap={12}>
							<Button variant="outline" mt={16} onClick={onClose}>
								Cancel
							</Button>
							<Button mt={16} type="submit">
								Create
							</Button>
						</Flex>
					</form>
				</Modal.Body>
			</Modal.Content>
		</Modal.Root>
	);
};

export type CreateProfilePayload = {
	profileName: string;
	pricingLeague: string;
	leagueId: string;
	stashTabs: string[];
};

export default ProfileModal;
