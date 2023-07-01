import { Flex } from '@mantine/core';
import ItemTable from './components/ItemTable';
import { SampleStats } from './components/SampleStats';
import TopBar from './components/TopBar';

function App() {
	return (
		<>
			<TopBar />
			<Flex justify={'center'} pt="5px" w="100%">
				<SampleStats />
			</Flex>
			<ItemTable items={[]} />
		</>
	);
}

export default App;
