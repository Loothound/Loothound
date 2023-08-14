import { Flex } from '@mantine/core';
import ItemTable from './components/ItemTable';
import { SampleStats } from './components/SampleStats';
import TopBar from './components/TopBar';
import { useState, useEffect } from 'react';
import { Snapshot } from './bindings';
import { invoke } from '@tauri-apps/api';

function App() {
	const [snapshot, setSnapshot] = useState<Snapshot>({} as unknown as Snapshot);
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
				setSnapshot={setSnapshot}
			/>
			<Flex justify={'center'} pt="5px" w="100%">
				<SampleStats total={total} selectedProfileId={selectedProfileId} />
			</Flex>
			<ItemTable snapshot={snapshot} setTotal={setTotal} />
		</>
	);
}

export default App;
