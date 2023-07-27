import { invoke } from '@tauri-apps/api';
import { Stash, Profile, ProfileWithStashes } from '../bindings';

export * from '../bindings';

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
