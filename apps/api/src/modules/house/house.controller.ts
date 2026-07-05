// apps/api/src/modules/house/house.controller.ts
import Elysia, { t } from "elysia";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { HouseService } from "./house.service";

const service = new HouseService();

export const houseController = new Elysia()
  .get("/api/houses", async () => {
    const data = await service.getAllHouses();
    return ApiResponse.success(data, "Houses fetched successfully");
  })
  .post(
    "/api/houses",
    async ({ body }) => {
      try {
        const newHouse = await service.createHouse(body);
        return ApiResponse.success(newHouse, "House created successfully");
      } catch {
        return ApiResponse.error("Failed to create house", 500);
      }
    },
    {
      // Elysia automatic validation!
      body: t.Object({
        ownerName: t.String({
          minLength: 3,
          error: "Owner name must be at least 3 characters",
        }),
        address: t.String({
          minLength: 5,
          error: "Address must be at least 5 characters",
        }),
      }),
    },
  );
