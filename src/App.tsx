import React, { useState } from "react";
import "./App.css";
import {
  Button,
  ButtonGroup,
  Box,
  IconButton,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import useAuth from "./context";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  ColumnDef,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  chakra,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Card,
} from "@chakra-ui/react";
import { Line } from "react-chartjs-2";
import { faker } from "@faker-js/faker";
import mkRequest from "./client";
import { BellIcon, DeleteIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { SampleStats } from "./parts/samplestats";

interface Item {
  name: string;
}

interface StashTab {
  id: string;
  parent?: string;
  name: string;
  type: string;
  index?: number;
  metadata: {
    public?: boolean;
    folder?: boolean;
    colour?: string;
  };
  children: StashTab[];
  items?: Record<string, unknown>[];
}

export const options = {
  events: [],
  responsive: true,
  borderWidth: 1.5,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
};

const labels = ["January", "February", "March", "April", "May", "June", "July"];

export const data = {
  labels,
  datasets: [
    {
      label: "Dataset 1",
      data: labels.map(() => faker.datatype.number({ min: -1000, max: 1000 })),
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      fill: false,
      pointRadius: 0,
      spanGaps: true,
      tension: 0.2,
    },
  ],
};

function App() {
  const [stashes, setStashes] = useState<StashTab>({} as StashTab);
  const token = useAuth();

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <Flex h={14} alignItems={"center"} justifyContent={"space-between"}>
          <Box />
          <Flex
            h={14}
            alignItems={"center"}
            justifyContent={"center"}
            gap="5px"
          >
            <Menu>
              <MenuButton
                as={Button}
                variant="outline"
                rightIcon={<ChevronDownIcon />}
              >
                Profile
              </MenuButton>
              <MenuList>
                <MenuItem>Profile 1</MenuItem>
                <MenuItem>Profile 2</MenuItem>
                <MenuItem>Profile 3</MenuItem>
              </MenuList>
            </Menu>
            <Divider orientation="vertical" />
            <ButtonGroup isAttached variant="outline">
              <Button
                onClick={async () => {
                  const data = await mkRequest(
                    "stash/Crucible/483a28203d",
                    token
                  );
                  console.log(data);
                  setStashes(data.stash);
                }}
              >
                Take Snapshot
              </Button>
              <IconButton
                aria-label="Delete snapshots"
                colorScheme="red"
                icon={<DeleteIcon />}
              />
            </ButtonGroup>
            <Divider orientation="vertical" />
            <IconButton
              variant="outline"
              icon={<BellIcon />}
              aria-label="Show notifications"
            />
            <Divider orientation="vertical" />
            <IconButton
              variant="outline"
              icon={<BellIcon />}
              aria-label="Show notifications"
            />
          </Flex>
        </Flex>
      </Box>

      <Box pt="5px" w="100%" justifyContent="center">
        <SampleStats />
      </Box>
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Amount</Th>
            <Th>Sparkline</Th>
          </Tr>
        </Thead>
        <Tbody>
          {stashes.items ? (
            stashes.items?.map((item) => {
              return (
                <Tr key={item.id as string}>
                  <Td>{item.typeLine as string}</Td>
                  <Td>{item.baseType as string}</Td>
                  <Td>{item.stackSize as string}</Td>
                  <Td>
                    <div style={{ height: "50px" }}>
                      <Line options={options} data={data} />
                    </div>
                  </Td>
                </Tr>
              );
            })
          ) : (
            <></>
          )}
        </Tbody>
      </Table>
    </>
  );
}

export default App;
