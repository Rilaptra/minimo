// apps/api/src/modules/house/house.service.ts

import { houses } from "@minimo/db";
import { dbInstance } from "../../core/Database";
import { CodeGenerator } from "../../lib/utils/CodeGenerator";

export class HouseService {
  async getAllHouses() {
    return await dbInstance.select().from(houses);
  }

  async createHouse(data: { ownerName: string; address: string }) {
    // Generate code automatically using our utility!
    const code = CodeGenerator.generate({
      prefix: "JMT",
      charset: "numeric",
      length: 4,
    });

    const newHouse = { ...data, code };
    await dbInstance.insert(houses).values(newHouse);

    return newHouse;
  }
}
