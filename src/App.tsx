import { Box } from '@chakra-ui/react';
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
      <Box pt="5px" w="100%" justifyContent="center">
        <SampleStats />
      </Box>
      <ItemTable items={stash?.items || []} />
    </>
  );
}

export default App;
