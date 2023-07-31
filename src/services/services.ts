import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';
import { fetchStashes } from '../api/api';
import { fetchMultipleStashes } from '../api/client';
import { getProfiles } from '../api/db';
import { CreateProfilePayload } from '../components/ProfileModal';

export const useFetchStashes = () => useQuery(['stashes'], fetchStashes);

export const useAddProfile = () => {
	const queryClient = useQueryClient();

	return useMutation(
		(values: CreateProfilePayload) => invoke('plugin:sql|create_profile', values),
		{
			onSuccess: () => queryClient.invalidateQueries(['profiles']),
		}
	);
};

export const useGetStashes = (stashes: string[], options: Record<string, any>) =>
	useQuery(['stash'], () => fetchMultipleStashes(stashes), options);

export const useGetProfiles = () => useQuery(['profiles'], getProfiles);
