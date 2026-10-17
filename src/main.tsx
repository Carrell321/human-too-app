import { createRoot } from "react-dom/client";
import { App } from "./App";
import { JourneyProvider } from "./state/journey";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <JourneyProvider>
    <App />
  </JourneyProvider>,
);
