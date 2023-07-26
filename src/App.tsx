import { Flex } from '@mantine/core';
import ItemTable from './components/ItemTable';
import { SampleStats } from './components/SampleStats';
import TopBar from './components/TopBar';
import { useState } from 'react';

function App() {
	const [items, setItems] = useState([]);
	const [total, setTotal] = useState(0);
	return (
		<>
			<TopBar
				setItems={(i) => {
					console.log(i);
					setItems(i);
				}}
			/>
			<Flex justify={'center'} pt="5px" w="100%">
				<SampleStats total={total} />
			</Flex>
			<ItemTable items={items} setTotal={setTotal} />
		</>
	);
}

export default App;
