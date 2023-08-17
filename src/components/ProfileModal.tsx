import { Button, Flex, Modal, MultiSelect, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import {
	useAddProfile,
	useFetchStashes,
	useFetchLeagues,
	usePricingLeagues,
} from '../services/services';
import { League, StashTab } from '../types/types';
import { Dispatch, SetStateAction } from 'react';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	setSelectedProfile: Dispatch<SetStateAction<number | bigint | null>>;
};

const ProfileModal = ({ isOpen, onClose, setSelectedProfile }: Props) => {
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

	const { data: leagueData = [], isLoading: isLeaguesLoading } = useFetchLeagues();
	const { data: stashesData = [], isLoading: isStashesDataLoading } = useFetchStashes(
		form.values.leagueId,
		{
			enabled: !!form.values.leagueId,
		}
	);
	const { data: pricingLeaguesData = [], isLoading: isPricingLeaguesLoading } = usePricingLeagues();

	const addProfileMutation = useAddProfile();

	const handleFormSubmit = async (values: CreateProfilePayload) => {
		console.log(values);
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

	const makeLeagueOptions = ({ leagues = [] }: any) => {
		const options = leagues.map((league: League) => ({
			label: league.id,
			value: league.id,
		}));
		return options;
	};

	const makePricingLeagueOptions = (leagues: string[]) => {
		const options = leagues.map((s: string) => ({
			label: s,
			value: s,
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
								data={makePricingLeagueOptions(pricingLeaguesData)}
								disabled={isPricingLeaguesLoading}
								withAsterisk
								{...form.getInputProps('pricingLeague')}
							/>
							<Select
								label="Choose League"
								placeholder={isLeaguesLoading ? 'Loading...' : 'Choose league'}
								data={makeLeagueOptions(leagueData)}
								disabled={isLeaguesLoading}
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
