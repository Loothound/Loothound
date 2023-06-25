import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import App from './App';
import { OAuthProvider } from './AuthContext';
import { DbContextProvider } from './DbContext';
import Login from './pages/Login';
import theme from './theme';
import './database/model';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Login />,
	},
	{
		path: '/home',
		element: <App />,
	},
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
			<OAuthProvider>
				<DbContextProvider>
					<RouterProvider router={router} />
				</DbContextProvider>
			</OAuthProvider>
		</MantineProvider>
	</React.StrictMode>
);
