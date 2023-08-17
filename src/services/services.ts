import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/tauri';
import { fetchStashes, fetchLeagues } from '../api/api';
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

enum QueryKeys {
	STASHES = 'stashes',
	PROFILES = 'profiles',
	SNAPSHOTS = 'snapshots',
	SNAPSHOT_ITEMS = 'snapshot_items',
	LEAGUES = 'leagues',
}

export const useFetchStashes = (leagueId: string, options: Record<string, any>) =>
	useQuery([QueryKeys.STASHES, leagueId], () => fetchStashes(leagueId), {
		staleTime: 120000,
		...options,
	});

export const useFetchLeagues = () =>
	useQuery([QueryKeys.LEAGUES], fetchLeagues, { staleTime: 120000 });

export const useAddProfile = () => {
	const queryClient = useQueryClient();

	return useMutation<Profile, unknown, CreateProfilePayload>(
		(values: CreateProfilePayload) => invoke('plugin:sql|create_profile', values),
		{
			onSuccess: () => queryClient.invalidateQueries([QueryKeys.PROFILES]),
		}
	);
};

export const useEditProfile = () => {
	const queryClient = useQueryClient();

	return useMutation(
		(values: ProfileWithStashes) => updateProfile(values.profile, values.stashes),
		{
			onSuccess: () => queryClient.invalidateQueries([QueryKeys.PROFILES]),
		}
	);
};

export const useGetProfiles = () => useQuery([QueryKeys.PROFILES], getProfiles);

export const useAddSnapshot = () => {
	const queryClient = useQueryClient();

	return useMutation<Snapshot, unknown, number | bigint | null>(
		(profileId) => invoke('plugin:sql|new_snapshot', { profileId }),
		{
			onSuccess: (data: Snapshot) =>
				queryClient.invalidateQueries([QueryKeys.SNAPSHOTS, data.profile_id]),
		}
	);
};

export const useGetSnapshots = (profileId: number, options?: Record<string, any>) =>
	useQuery([QueryKeys.SNAPSHOTS, profileId], () => listSnapshots(profileId), options);

export const useGetSnapshotItems = (snapshot: Snapshot, options: Record<string, any>) =>
	useQuery([QueryKeys.SNAPSHOT_ITEMS, snapshot], () => fetchSnapshotItems(snapshot), options);
