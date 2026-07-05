import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./router";

export function App({ url }: { url: string }) {
  const router = createAppRouter(url);
  return <RouterProvider router={router} />;
}
