import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { faker } from '@faker-js/faker';
import { Item } from '../types/types';

type Props = {
  items: Item[];
};

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

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export const data = {
  labels,
  datasets: [
    {
      label: 'Dataset 1',
      data: labels.map(() => faker.datatype.number({ min: -1000, max: 1000 })),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      fill: false,
      pointRadius: 0,
      spanGaps: true,
      tension: 0.2,
    },
  ],
};

const ItemTable = ({ items }: Props) => {
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
        {items.map((item) => {
          return (
            <Tr key={item.id}>
              <Td>{item.typeLine}</Td>
              <Td>{item.baseType}</Td>
              <Td>{item.stackSize}</Td>
              <Td>
                <div style={{ height: '50px' }}>
                  <Line options={options} data={data} />
                </div>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default ItemTable;
