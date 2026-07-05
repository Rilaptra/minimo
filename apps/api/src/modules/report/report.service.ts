// apps/api/src/modules/report/report.service.ts

import { contributions, houses } from "@minimo/db";
import { count, sql } from "drizzle-orm";
import { dbInstance } from "../../core/Database";

export class ReportService {
  async getSummary() {
    const totalHousesResult = await dbInstance
      .select({ count: count() })
      .from(houses)
      .get();

    const totalContributionsResult = await dbInstance
      .select({
        count: count(),
        total: sql<number>`sum(${contributions.amount})`,
      })
      .from(contributions)
      .get();

    return {
      totalHouses: totalHousesResult?.count ?? 0,
      totalContributions: totalContributionsResult?.count ?? 0,
      totalAmount: totalContributionsResult?.total ?? 0,
    };
  }
}
