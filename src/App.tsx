import { Flex } from '@mantine/core';
import ItemTable from './components/ItemTable';
import { SampleStats } from './components/SampleStats';
import TopBar from './components/TopBar';
import { useState, useEffect } from 'react';
import { Item } from './types/types';
import { invoke } from '@tauri-apps/api';

function App() {
	const [items, setItems] = useState<Item[]>([]);
	const [total, setTotal] = useState(0);
	const [selectedProfileId, setSelectedProfileId] = useState<number | bigint | null>(null);

	const MINUTE_MS = 60000;

	useEffect(() => {
		invoke('plugin:sql|has_recent_prices').then((x) => {
			console.log(x);
			if (!(x as boolean)) {
				invoke('plugin:sql|fetch_prices');
			}
		});

		const interval = setInterval(() => {
			invoke('plugin:sql|fetch_prices');
		}, MINUTE_MS * 60);

		return () => clearInterval(interval);
	}, []);

	return (
		<>
			<TopBar
				selectedProfileId={selectedProfileId}
				setSelectedProfileId={setSelectedProfileId}
				setItems={setItems}
			/>
			<Flex justify={'center'} pt="5px" w="100%">
				<SampleStats total={total} selectedProfileId={selectedProfileId} />
			</Flex>
			<ItemTable items={items} setTotal={setTotal} />
		</>
	);
}

export default App;
