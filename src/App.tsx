import { useState } from "react";
import { Button, Card, Elevation, Navbar, Alignment, Menu, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import "./App.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';
import CollapsibleContainer from "./components/collapsible_container"
import { OAuth2Client, generateCodeVerifier } from '@badgateway/oauth2-client'
import { WebviewWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { getClient, ResponseType  } from '@tauri-apps/api/http';
import { Cell, Column, Table } from "@blueprintjs/table";

let oauth_token = -1

async function login() {
  invoke('do_oauth')
}

const unlisten = listen('oauth_token', (evt) => {
  oauth_token = evt.payload
})

async function load_data() {
  if(oauth_token === -1) {
    return []
  }
  const client = await getClient()
  const options = {
    headers: {
      "Authorization": "Bearer " + oauth_token,
      "User-Agent": "OAuth loothound/0.1 (contact: my@procrastination.life) StrictMode"
    },
    responseType: ResponseType.JSON
  }
  const response = await client.get("https://api.pathofexile.com/character", options)
  return response.data.characters
}

function App() {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement
  );

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart.js Line Chart',
      },
    },
    scales: {
      y: {
        display: false
      },
      x: {
        display: false
      }
    }
  };

  const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Dataset 1',
        data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Dataset 2',
        data: labels.map(() => faker.number.int({ min: -1000, max: 1000 })),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const [characters, setCharacters] = useState([])

  const menu = (<>
    <Menu className="bp4-elevation-1">
      <MenuItem text="Profile 1" />
      <MenuItem text="Profile 2" />
      <MenuItem text="Profile 3" />
      <MenuItem text="Profile 4" />
    </Menu>
  </>);

  return (
    <>
      <Navbar>
          <Navbar.Group align={Alignment.RIGHT}>
              <Popover2 content={menu}>
                <Button text="Profile" rightIcon="caret-down"/>
              </Popover2>
              <Navbar.Divider />
              <Button text="Auth" onClick={login} />
              <Button text="Load" onClick={async() => {
                const data = await load_data();
                console.log(data);
                setCharacters(data);
              }} />
          </Navbar.Group>
      </Navbar>
      <div id="content">
        <div id="topCardContainer">
          <Card elevation={Elevation.TWO}>
            <Line options={options} data={data} />
          </Card>
          <Card elevation={Elevation.TWO}></Card>
          <Card elevation={Elevation.TWO}></Card>
        </div>
      </div>
      <Table numRows={characters.length}>
        <Column name="Name" cellRenderer={(i) => <Cell>{characters[i].name}</Cell>}/>
        <Column name="Class" cellRenderer={(i) => <Cell>{characters[i].class}</Cell>} />
        <Column name="League" cellRenderer={(i) => <Cell>{characters[i].league}</Cell>} />
        <Column name="Level" cellRenderer={(i) => <Cell>{characters[i].level}</Cell>} />
      </Table>
    </>
  );
}

export default App;
