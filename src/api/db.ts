import { invoke } from '@tauri-apps/api';
import { Stash, Profile, ProfileWithStashes, Snapshot, Item, UseEffectResponse } from '../bindings';

export * from '../bindings';

export type PricingRevision = number;

export async function getStashes(): Promise<Stash[]> {
	return await invoke('plugin:sql|get_stashes');
}

export async function insertStash(
	stashId: string,
	stashName: string,
	stashType: string
): Promise<Stash> {
	return await invoke('plugin:sql|insert_stash', { stashId, stashName, stashType });
}

export async function createProfile(profileName: string, stashTabs: string[]): Promise<Profile> {
	return await invoke('plugin:sql|create_profile', { profileName, stashTabs });
}

export async function getProfiles(): Promise<ProfileWithStashes[]> {
	return await invoke('plugin:sql|get_profiles');
}

export async function newSnapshot(profileId: number): Promise<Snapshot> {
	return await invoke('plugin:sql|new_snapshot', { profileId });
}

export async function addItemsToSnapshot(
	snapshot: Snapshot,
	items: Item[],
	stashId: string
): Promise<number> {
	return await invoke('plugin:sql|add_items_to_snapshot', { snapshot, items, stashId });
}

export async function snapshotSetValue(snapshot: Snapshot, value: number) {
	await invoke('plugin:sql|snapshot_set_value', { snapshot, value });
}

export async function fetchPrices(): Promise<PricingRevision> {
	return await invoke('plugin:sql|fetch_prices');
}

export async function listSnapshots(profileId: number): Promise<Snapshot[]> {
	return await invoke('plugin:sql|list_snapshots', { profileId });
}

export async function deleteSnapshot(snapshotId: number) {
	return await invoke('plugin:sql|delete_snapshot', { snapshotId });
}

export async function fetchSnapshotItems(snapshot: Snapshot) {
	return await invoke('plugin:sql|snapshot_fetch_items', { snapshot });
}

export async function updateProfile(
	profile: Profile,
	stashTabs: string[]
): Promise<ProfileWithStashes> {
	return await invoke('plugin:sql|update_profile', { profile, stashTabs });
}

export async function oopsie() {
	return await invoke('plugin:sql|oopsie');
}

export async function basicallyThisUseEffect(snapshot: Snapshot): Promise<UseEffectResponse> {
	return await invoke('plugin:sql|basically_this_use_effect', { snapshot });
}

export async function getPricingLeagues(): Promise<string[]> {
	return await invoke('plugin:sql|get_pricing_leagues');
}
