import { Flex } from '@mantine/core';
import ItemTable from './components/ItemTable';
import { SampleStats } from './components/SampleStats';
import TopBar from './components/TopBar';
import { useState } from 'react';
import { Item } from './types/types';

function App() {
	const [items, setItems] = useState<Item[]>([]);
	const [total, setTotal] = useState<string>('0');

	return (
		<>
			<TopBar setItems={setItems} />
			<Flex justify={'center'} pt="5px" w="100%">
				<SampleStats total={total} />
			</Flex>
			<ItemTable items={items} setTotal={setTotal} />
		</>
	);
}

export default App;
