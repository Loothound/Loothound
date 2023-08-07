import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import { OAuthProvider } from './AuthContext';
import Login from './pages/Login';
import theme from './theme';

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

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
				<OAuthProvider>
					<RouterProvider router={router} />
				</OAuthProvider>
			</MantineProvider>
		</QueryClientProvider>
	</React.StrictMode>
);
