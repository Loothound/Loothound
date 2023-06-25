import { Flex } from '@mantine/core';
import { useState } from 'react';
import ItemTable from './components/ItemTable';
import { SampleStats } from './components/SampleStats';
import TopBar from './components/TopBar';
import { ExtendedStashTab } from './types/types';

function App() {
	const [stash, setStash] = useState<ExtendedStashTab | null>(null);

	return (
		<>
			<TopBar setStash={setStash} />
			<Flex justify={'center'} pt="5px" w="100%">
				<SampleStats />
			</Flex>
			<ItemTable items={stash?.items || []} />
		</>
	);
}

export default App;
