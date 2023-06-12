import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  ChakraProvider,
  extendTheme,
  type ThemeConfig,
} from "@chakra-ui/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/login";
import { OauthProvider } from "./context";
import axios from "axios";

axios.defaults.baseURL = "https://api.pathofexile.com";

const themeConfig: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};
const theme = extendTheme({ themeConfig });

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Login />
      </>
    ),
  },
  {
    path: "/home",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <OauthProvider>
        <RouterProvider router={router} />
      </OauthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
