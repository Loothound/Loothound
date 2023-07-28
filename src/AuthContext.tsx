import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import React, { createContext, useContext, useEffect, useState } from 'react';

const OAuthContext = createContext('');

interface Payload {
	access_token: string;
	refresh_token: string;
	expires_in: number;
}

async function refresh() {
	const valid_until_str = localStorage.getItem('valid_until');
	if (valid_until_str === null) return;
	const valid_until = parseInt(valid_until_str);
	if (Date.now() - valid_until >= 0) {
		await invoke('plugin:oauth|attempt_refresh', {
			refreshToken: localStorage.getItem('refresh_token'),
		});
		console.log('refreshing');
	}
}

export function OAuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState('');

	useEffect(() => {
		setToken(localStorage.getItem('oauth_token') || '');
	}, []);

	useEffect(() => {
		const unlisten = listen('oauth_token', (evt) => {
			const payload: Payload = evt.payload as Payload;
			setToken(payload.access_token as string);
			localStorage.setItem('oauth_token', payload.access_token);
			localStorage.setItem('refresh_token', payload.refresh_token);
			localStorage.setItem('valid_until', (Date.now() + payload.expires_in * 1000).toString());
		});
		return () => {
			unlisten.then((f) => f());
		};
	}, [setToken]);

	useEffect(() => {
		const id = setInterval(refresh, 60000 * 60);
		refresh();

		return () => clearInterval(id);
	}, []);

	return <OAuthContext.Provider value={token}>{children}</OAuthContext.Provider>;
}

export default function useAuth() {
	return useContext(OAuthContext);
}
