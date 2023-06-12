import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <OAuthProvider>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <RouterProvider router={router} />
      </OAuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
