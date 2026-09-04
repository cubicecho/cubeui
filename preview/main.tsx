import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/preview/app";
import "./index.css";

// biome-ignore lint/style/noNonNullAssertion: the root element is in index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
