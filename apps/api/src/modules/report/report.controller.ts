// apps/api/src/modules/report/report.controller.ts
import Elysia from "elysia";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { ReportService } from "./report.service";

const service = new ReportService();

export const reportController = new Elysia().get("/api/reports", async () => {
  const data = await service.getSummary();
  return ApiResponse.success(data, "Reports fetched successfully");
});
