import axios from 'axios';
import axiosTauriApiAdapter from 'axios-tauri-api-adapter';
import { RateLimiter } from 'limiter';
import { ExtendedStashTab } from '../types/types';

const client = axios.create({
	adapter: axiosTauriApiAdapter,
	baseURL: 'https://api.pathofexile.com/',
});

client.interceptors.request.use((config) => {
	const token = localStorage.getItem('oauth_token');
	config.headers['Authorization'] = 'Bearer ' + token;
	config.headers['User-Agent'] = 'OAuth loothound/0.1 (contact: paul.kosel@rub.de) StrictMode';

	return config;
});

client.interceptors.response.use(
	(response) => {
		console.log(response);
		return response;
	},
	(error) => {
		console.log(error);
		if (error.response.status === 401) {
			localStorage.removeItem('oauth_token');
			window.location.href = '/';
		}
		return error;
	}
);

const limiters: Record<string, RateLimiter[]> = {};

export async function fetch_stash(id: string): Promise<ExtendedStashTab> {
	return (await fetch_stashes([id]))[0];
}

export async function fetch_stashes(ids: string[]): Promise<ExtendedStashTab[]> {
	const policy = 'stash-request-limit';

	const tabs: ExtendedStashTab[] = [];

	async function fetch(id: string): Promise<ExtendedStashTab> {
		for (const l of limiters[policy]) {
			console.log('awaiting limiters');
			await l.removeTokens(1);
			console.log('limiters free');
			console.log('');
		}
		const {
			data: { stash },
		} = await client.get<{
			stash: ExtendedStashTab;
		}>(`stash/Crucible/${id}`);
		return stash;
	}

	if (!(policy in limiters)) {
		// first stash tab to be fetched so we have to send one request and extract some info on the rate limits
		const first = ids.pop();
		const {
			headers,
			data: { stash },
		} = await client.get<{ stash: ExtendedStashTab }>(`stash/Crucible/${first}`);
		tabs.push(stash);
		const rateLimitString: string = headers['x-rate-limit-account'];
		const limits = rateLimitString.split(',').map((x) => {
			const y = x.split(':');
			return y.map((z) => parseInt(z));
		});
		const rateLimiters = [];
		for (const l of limits) {
			const rl = new RateLimiter({ tokensPerInterval: l[0], interval: l[1] * 1000 });
			await rl.removeTokens(1);
			rateLimiters.push(rl);
		}
		limiters[policy] = rateLimiters;
	}

	for (const id of ids) {
		const data = await fetch(id);
		tabs.push(data);
	}

	return tabs;
}

export default client;
