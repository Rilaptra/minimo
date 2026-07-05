// apps/api/src/index.ts

import { AppServer } from "./core/App";
import { houseController } from "./modules/house/house.controller";
import { reportController } from "./modules/report/report.controller";

const server = new AppServer(3000);

server.registerStaticAssets();

server.registerModules([
  { name: "House", plugin: houseController },
  { name: "Report", plugin: reportController },
]);

server.registerSSR();

server.start();

// Graceful shutdown untuk HMR restart
process.on("SIGTERM", () => {
  console.log("[SYS] Received SIGTERM, shutting down...");
  process.exit(0);
});
