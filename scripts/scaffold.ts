// scripts/scaffold.ts
import { TextPrompt } from "../packages/tui/TextPrompt";
import { Confirm } from "../packages/tui/Confirm";
import { MultiSelect } from "../packages/tui/MultiSelect";
import chalk from "chalk";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/**
 * Interactive CLI Scaffolding Tool.
 * Uses TUI components to guide the user in generating new feature modules.
 */
async function main() {
  console.log(
    chalk.bgBlue.white.bold(" 🛠️  Minimo Framework Scaffolding Tool \n"),
  );

  // 1. Prompt for module name
  const moduleName = await new TextPrompt({
    title: "Enter module name (e.g., Product, User)",
    placeholder: "House",
    validate: (val) => val.length > 2 || "Name must be at least 3 characters",
  }).run();

  // 2. Select API methods to generate
  const methods = await new MultiSelect<string>()
    .title("Select API methods to generate")
    .add("GET (List)", "GET_LIST", { selected: true })
    .add("GET (Detail)", "GET_DETAIL", { selected: true })
    .add("POST (Create)", "POST", { selected: true })
    .add("PUT (Update)", "PUT")
    .add("DELETE (Remove)", "DELETE")
    .run();

  // 3. Confirm action
  const isConfirmed = await new Confirm({
    title: `Generate module for ${moduleName}?`,
    initialValue: true,
  }).run();

  if (!isConfirmed) {
    console.log(chalk.red("✖ Operation cancelled."));
    process.exit(0);
  }

  // 4. Generate files
  const modulePath = join(
    process.cwd(),
    "apps/api/src/modules",
    moduleName.toLowerCase(),
  );
  await mkdir(modulePath, { recursive: true });

  const controllerContent = `// Generated Controller for ${moduleName}
import Elysia from "elysia";
// Add your service imports here

export const ${moduleName.toLowerCase()}Controller = new Elysia()
 ${methods.includes("GET_LIST") ? `  .get("/api/${moduleName.toLowerCase()}", () => "List ${moduleName}")\n` : ""}
 ${methods.includes("POST") ? `  .post("/api/${moduleName.toLowerCase()}", () => "Create ${moduleName}")\n` : ""}
`;

  await writeFile(
    join(modulePath, `${moduleName.toLowerCase()}.controller.ts`),
    controllerContent,
  );

  console.log(chalk.green(`\n✔ Successfully generated module: ${moduleName}!`));
  console.log(chalk.dim(`  Location: ${modulePath}`));
}

main().catch(console.error);
