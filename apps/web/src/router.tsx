import { QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { Dashboard } from "./components/Dashboard";
import { RegisterHouse } from "./components/RegisterHouse";
import { SummaryCards } from "./components/SummaryCards";
import { Button } from "./components/ui/button";
import { queryClient } from "./lib/queryClient";

function RootComponent() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🏘️ Sistem Jimpitan Minimo
          </h1>
          <SummaryCards />
          <nav className="flex gap-2 mb-8 mt-6">
            <Button
              onClick={() => navigate({ to: "/" })}
              variant={location.pathname === "/" ? "default" : "outline"}
            >
              Dashboard
            </Button>
            <Button
              onClick={() => navigate({ to: "/register" })}
              variant={
                location.pathname === "/register" ? "default" : "outline"
              }
            >
              Daftar Rumah
            </Button>
          </nav>
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterHouse,
});

const routeTree = rootRoute.addChildren([dashboardRoute, registerRoute]);

export function createAppRouter(url?: string) {
  // Fix TS 2379: conditional spread agar tidak mengirim properti undefined
  const history =
    typeof window === "undefined" && url
      ? createMemoryHistory({ initialEntries: [url] })
      : undefined;

  const router = createRouter({
    routeTree,
    ...(history ? { history } : {}),
  });

  return router;
}
