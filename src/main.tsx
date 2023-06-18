import React from "react";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App";
import { OAuthProvider } from "./AuthContext";
import { DbContextProvider } from "./DbContext";
import Login from "./pages/Login";
import theme from "./theme";
import "./database/model";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/home",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <OAuthProvider>
        <DbContextProvider>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <RouterProvider router={router} />
        </DbContextProvider>
      </OAuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
