import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';
import { fetchStashes, getSingleStash } from '../api/api';
import { Snapshot, getProfiles, listSnapshots } from '../api/db';
import { CreateProfilePayload } from '../components/ProfileModal';
import { profile } from 'console';

export const useFetchStashes = () => useQuery(['stashes'], fetchStashes, { staleTime: 120000 });

export const useAddProfile = () => {
	const queryClient = useQueryClient();

	return useMutation(
		(values: CreateProfilePayload) => invoke('plugin:sql|create_profile', values),
		{
			onSuccess: () => queryClient.invalidateQueries(['profiles']),
		}
	);
};

export const useGetSingleStash = (stashId: string, options: Record<string, any>) =>
	useQuery(['stash'], () => fetch_stash(stashId), options);

export const useGetProfiles = () => useQuery(['profiles'], getProfiles);

export const useAddSnapshot = () => {
	const queryClient = useQueryClient();

	return useMutation((profileId) => invoke('plugin:sql|new_snapshot', { profileId }), {
		onSuccess: (data: Snapshot) => queryClient.invalidateQueries(['snapshots', data.profile_id]),
	});
};

export const useGetSnapshots = (profileId: number, options?: Record<string, any>) =>
	useQuery(['snapshots', profileId], () => listSnapshots(profileId), options);
