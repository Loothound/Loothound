import { Button, Flex, Modal, MultiSelect, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ProfileWithStashes } from '../bindings';
import { useEditProfile, useFetchStashes } from '../services/services';
import { StashTab } from '../types/types';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	profileData: ProfileWithStashes | undefined;
};

const EditProfileModal = ({ isOpen, onClose, profileData }: Props) => {
	const { data: stashesData = [], isLoading: isStashesDataLoading } = useFetchStashes();

	const editProfileMutation = useEditProfile();

	useEffect(() => {
		form.setValues({
			profileName: profileData?.profile.name || '',
			pricingLeague: profileData?.profile.pricing_league || '',
			leagueId: profileData?.profile.league_id || '',
			stashTabs: profileData?.stashes || [],
		});
	}, [profileData]);

	const form = useForm({
		initialValues: {
			profileName: profileData?.profile.name || '',
			pricingLeague: profileData?.profile.pricing_league || '',
			leagueId: profileData?.profile.league_id || '',
			stashTabs: profileData?.stashes || [],
		},

		validate: {
			profileName: (value) => (value ? null : 'Profile name is required'),
			pricingLeague: (value) => (value ? null : 'Pricing league is required'),
			leagueId: (value) => (value ? null : 'League is required'),
			stashTabs: (value) => (value.length ? null : 'You must choose at least a stash'),
		},
	});

	const handleFormSubmit = async (values: CreateProfilePayload) => {
		const remappedValues = {
			profile: {
				id: profileData?.profile.id as bigint,
				name: values.profileName,
				pricing_league: values.pricingLeague,
				league_id: values.leagueId,
			},
			stashes: values.stashTabs,
		};
		await editProfileMutation.mutateAsync(remappedValues);
		form.reset();
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
					<Modal.Title>Update a profile</Modal.Title>
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
									{ label: 'Crucible', value: '1' },
									{ label: 'Crucible HC', value: '2' },
								]}
								withAsterisk
								{...form.getInputProps('pricingLeague')}
							/>
							<Select
								label="Choose League"
								placeholder="Choose league"
								data={[
									{ label: 'Crucible', value: '1' },
									{ label: 'Crucible HC', value: '2' },
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
							<Button mt={16} type="submit" disabled={!form.isDirty()}>
								Update
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

export default EditProfileModal;
