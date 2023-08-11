import { invoke } from '@tauri-apps/api/tauri';
import { ExtendedStashTab, StashTab } from '../types/types';
import api from './client';

export const fetchStashes = async () => {
	const { data } = await api.get<{ stashes: StashTab[] }>('stash/Crucible');
	const tab_array: StashTab[] = [];
	for (const s of data.stashes) {
		if (s.metadata.folder) {
			for (const child of s.children as StashTab[]) {
				tab_array.push(child);
				invoke('plugin:sql|insert_stash', {
					stashId: child.id,
					stashName: child.name,
					stashType: child.type,
				});
			}
		} else {
			tab_array.push(s);
			invoke('plugin:sql|insert_stash', {
				stashId: s.id,
				stashName: s.name,
				stashType: s.type,
			});
		}
	}

	return { stashes: tab_array };
};

export const getSingleStash = async (stashId: string) => {
	const {
		data: { stash },
	} = await api.get<{
		stash: ExtendedStashTab;
	}>(`stash/Crucible/${stashId}`);

	return stash;
};
