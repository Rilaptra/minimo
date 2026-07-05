import { contributions, db, houses } from "@minimo/db";
import { App } from "@minimo/web";
import { count, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server.browser";

// Import dari file yang akan di-generate otomatis saat build
import { clientJs, stylesCss } from "./embedded-assets";

type HouseInput = {
  code: string;
  ownerName: string;
  address: string;
};

const app = new Elysia()
  // Sajikan file statis dari memori
  .get(
    "/public/client.js",
    () =>
      new Response(clientJs, {
        headers: { "Content-Type": "application/javascript" },
      }),
  )
  .get(
    "/public/styles.css",
    () => new Response(stylesCss, { headers: { "Content-Type": "text/css" } }),
  )

  .get("/api/houses", async () => {
    return await db.select().from(houses);
  })
  .post("/api/houses", async ({ body }) => {
    const { code, ownerName, address } = body as HouseInput;
    await db.insert(houses).values({ code, ownerName, address });
    return { success: true };
  })
  .get("/api/reports", async () => {
    const totalHousesResult = await db
      .select({ count: count() })
      .from(houses)
      .get();
    const totalContributionsResult = await db
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
  })
  .get("/api/scan/:code", async ({ params }) => {
    const house = await db
      .select()
      .from(houses)
      .where(eq(houses.code, params.code))
      .get();
    if (!house) return new Response("Rumah tidak ditemukan", { status: 404 });
    await db
      .insert(contributions)
      .values({ houseId: house.id, amount: 1000, status: "collected" });
    return new Response(
      `<h1>Setoran dari ${house.ownerName} berhasil dicatat!</h1><a href="/">Kembali</a>`,
      { headers: { "Content-Type": "text/html" } },
    );
  })
  .get("/*", async ({ request }) => {
    const stream = await renderToReadableStream(
      createElement(App, { url: request.url }),
    );
    const content = await Bun.readableStreamToText(stream);

    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Minimo Jimpitan</title>
        <link rel="stylesheet" href="/public/styles.css" />
      </head>
      <body>
        <div id="root">${content}</div>
        <script type="module" src="/public/client.js"></script>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  })
  .listen(3000);

export type AppRegistry = typeof app;
console.log(`[SYS] API & SSR Server aktif pada port ${app.server?.port}`);
