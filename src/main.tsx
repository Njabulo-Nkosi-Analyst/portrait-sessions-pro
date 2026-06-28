import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getRouter } from "./router";
import "./styles.css";

console.log("main.tsx loaded");

const queryClient = new QueryClient();
const router = getRouter(queryClient);

console.log("router created", router);

const rootEl = document.getElementById("root");
console.log("root element", rootEl);

createRoot(rootEl!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);