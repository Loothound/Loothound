import React, { useState } from "react";
import "./App.css";
import { getClient, ResponseType } from "@tauri-apps/api/http";
import { Button, ButtonGroup } from "@chakra-ui/react";
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
import { Table, Thead, Tbody, Tr, Th, Td, chakra } from "@chakra-ui/react";
import { Line } from "react-chartjs-2";
import { faker } from "@faker-js/faker";

async function load_data(token: string) {
  const client = await getClient();
  const options = {
    headers: {
      Authorization: "Bearer " + token,
      "User-Agent":
        "OAuth loothound/0.1 (contact: paul.kosel@rub.de) StrictMode",
    },
    responseType: ResponseType.JSON,
  };
  const response = await client.get<{
    stash: StashTab;
  }>("https://api.pathofexile.com/stash/Crucible/483a28203d", options);
  console.log(token);
  console.log(response);
  return response.data.stash;
}

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
      <h1>Test</h1>
      <ButtonGroup>
        <Button
          onClick={async () => {
            const data = await load_data(token);
            setStashes(data);
          }}
        >
          Fetch
        </Button>
      </ButtonGroup>
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
