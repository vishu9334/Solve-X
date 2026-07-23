import { createRoot } from "react-dom/client";
import "./index.css";
// ⚡ Must be imported before anything else — kicks off token refresh immediately
import "./lib/initAuth.js";

import Providers from "./app/Provider.jsx";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/Router.jsx";

createRoot(document.getElementById("root")).render(
  <Providers>
    <RouterProvider router={router} />
  </Providers>
);