import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';
import { fetchStashes } from '../api/api';
import {
	Profile,
	ProfileWithStashes,
	Snapshot,
	fetchSnapshotItems,
	getProfiles,
	listSnapshots,
	updateProfile,
} from '../api/db';
import { CreateProfilePayload } from '../components/ProfileModal';

export const useFetchStashes = () => useQuery(['stashes'], fetchStashes, { staleTime: 120000 });

export const useAddProfile = () => {
	const queryClient = useQueryClient();

	return useMutation<Profile, unknown, CreateProfilePayload>(
		(values: CreateProfilePayload) => invoke('plugin:sql|create_profile', values),
		{
			onSuccess: () => queryClient.invalidateQueries(['profiles']),
		}
	);
};

export const useEditProfile = () => {
	const queryClient = useQueryClient();

	return useMutation(
		(values: ProfileWithStashes) => updateProfile(values.profile, values.stashes),
		{
			onSuccess: () => queryClient.invalidateQueries(['profiles']),
		}
	);
};

export const useGetProfiles = () => useQuery(['profiles'], getProfiles);

export const useAddSnapshot = () => {
	const queryClient = useQueryClient();

	return useMutation((profileId) => invoke('plugin:sql|new_snapshot', { profileId }), {
		onSuccess: (data: Snapshot) => queryClient.invalidateQueries(['snapshots', data.profile_id]),
	});
};

export const useGetSnapshots = (profileId: number, options?: Record<string, any>) =>
	useQuery(['snapshots', profileId], () => listSnapshots(profileId), options);

export const useGetSnapshotItems = (snapshot: Snapshot, options: Record<string, any>) =>
	useQuery(['snapshotItems', snapshot], () => fetchSnapshotItems(snapshot), options);
