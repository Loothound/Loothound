import { invoke } from '@tauri-apps/api/tauri';
import { StashTab } from '../types/types';
import api from './client';

export const fetchStashes = async () => {
	const { data } = await api.get<{ stashes: StashTab[] }>('stash/Crucible');
	for (const s of data.stashes) {
		invoke('plugin:sql|insert_stash', {
			stashId: s.id,
			stashName: s.name,
			stashType: s.type,
		});
	}
	return data;
};
