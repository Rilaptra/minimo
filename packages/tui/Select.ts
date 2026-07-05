/** biome-ignore-all lint/suspicious/noExplicitAny: <explanationa> */
import { emitKeypressEvents } from "node:readline";
import chalk from "chalk";

export type ColorResolver = (text: string) => string;

export interface SelectOption<ValueType> {
  color?: ColorResolver;
  description?: string;
  disabled?: boolean;
  icon?: string;
  label: string;
  value: ValueType;
}

export interface SelectConfig {
  clearOnSubmit?: boolean;
  columns?: number;
  pageSize?: number;
  title?: string;
}

export class Select<ValueType = string> {
  private options: SelectOption<ValueType>[] = [];
  private config: SelectConfig = {
    clearOnSubmit: true,
    columns: 1,
    pageSize: 7,
  };
  private selectedIndex = 0;
  private scrollOffset = 0;

  constructor(config?: SelectConfig) {
    if (config) this.config = { ...this.config, ...config };
  }

  public title(text: string): this {
    this.config.title = text;
    return this;
  }

  public columns(count: number): this {
    this.config.columns = count;
    return this;
  }

  public pageSize(count: number): this {
    this.config.pageSize = count;
    return this;
  }

  public add(
    label: string,
    value: ValueType,
    meta?: {
      desc?: string;
      icon?: string;
      color?: ColorResolver;
      disabled?: boolean;
    },
  ): this {
    const newOpt: SelectOption<ValueType> = { label, value };

    if (meta?.desc !== undefined) newOpt.description = meta.desc;
    if (meta?.icon !== undefined) newOpt.icon = meta.icon;
    if (meta?.color !== undefined) newOpt.color = meta.color;
    if (meta?.disabled !== undefined) newOpt.disabled = meta.disabled;

    this.options.push(newOpt);
    return this;
  }

  public separator(label = "──────────────"): this {
    this.options.push({
      color: chalk.dim,
      disabled: true,
      label,
      value: null as unknown as ValueType,
    });
    return this;
  }

  public async run(): Promise<ValueType> {
    if (this.options.length === 0) {
      throw new Error("Select: No options provided!");
    }

    this.ensureValidSelection();

    const { stdin, stdout } = process;
    const columns = this.config.columns || 1;
    const totalDataRows = Math.ceil(this.options.length / columns);
    const viewportHeight = this.config.pageSize || 7;

    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    emitKeypressEvents(stdin as any);
    stdout.write("\x1B[?25l");

    let isFirstRender = true;

    const render = () => {
      const currentRow = Math.floor(this.selectedIndex / columns);

      if (currentRow < this.scrollOffset) {
        this.scrollOffset = currentRow;
      } else if (currentRow >= this.scrollOffset + viewportHeight) {
        this.scrollOffset = currentRow - viewportHeight + 1;
      }

      this.scrollOffset = Math.max(
        0,
        Math.min(this.scrollOffset, totalDataRows - viewportHeight),
      );
      if (totalDataRows <= viewportHeight) this.scrollOffset = 0;

      const heightToClear = viewportHeight + 2;
      if (!isFirstRender) {
        stdout.write(`\x1B[${heightToClear}A`);
      }

      const titleStr = this.config.title
        ? `${chalk.cyan("? ")} ${chalk.bold(this.config.title)}`
        : chalk.cyan("? Select an option:");

      const progressStr =
        totalDataRows > viewportHeight
          ? chalk.dim(
              ` (${this.scrollOffset + 1}-${Math.min(
                this.scrollOffset + viewportHeight,
                totalDataRows,
              )}/${totalDataRows})`,
            )
          : "";

      stdout.write(`${titleStr}${progressStr}\x1B[K\n`);

      const maxLabelLen = Math.max(...this.options.map((o) => o.label.length));
      const colWidth = maxLabelLen + 6;

      for (let i = 0; i < viewportHeight; i++) {
        const row = this.scrollOffset + i;
        let lineOutput = "";

        if (row < totalDataRows) {
          for (let col = 0; col < columns; col++) {
            const idx = row * columns + col;

            if (idx < this.options.length) {
              const opt = this.options[idx];
              if (!opt) continue;

              const isSelected = idx === this.selectedIndex;

              const fallbackIcon = opt.disabled
                ? opt.label.includes("─")
                  ? ""
                  : "🔒"
                : isSelected
                  ? "●"
                  : "○";
              const finalIcon = opt.icon || fallbackIcon;

              const colorFn = opt.disabled
                ? chalk.gray
                : opt.color || (isSelected ? chalk.cyan.bold : chalk.white);

              const pointer = isSelected ? chalk.cyan("❯") : " ";
              const styledLabel = colorFn(opt.label);

              let content = `${pointer} ${finalIcon} ${styledLabel}`;

              if (columns === 1 && opt.description && !opt.disabled) {
                content += chalk.dim(` - ${opt.description}`);
              }

              if (columns > 1) {
                const rawLen = 2 + 2 + opt.label.length;
                const padding = " ".repeat(Math.max(1, colWidth - rawLen));
                content += padding;
              }

              lineOutput += content;
            }
          }
        } else {
          lineOutput = chalk.dim(" ");
        }

        stdout.write(` ${lineOutput}\x1B[K\n`);
      }

      stdout.write(`${chalk.dim("─".repeat(10))}\x1B[K\n`);

      isFirstRender = false;
    };

    render();

    return new Promise((resolve) => {
      const cleanup = () => {
        stdout.write("\x1B[?25h");
        if (stdin.setRawMode) stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("keypress", handleKey);
      };

      const handleKey = (_: unknown, key: { name: string; ctrl: boolean }) => {
        if (key.ctrl && key.name === "c") {
          cleanup();
          stdout.write("\n");
          process.exit(0);
        }

        const prevIndex = this.selectedIndex;

        switch (key.name) {
          case "up":
            this.moveSelection(-columns);
            break;
          case "down":
            this.moveSelection(columns);
            break;
          case "left":
            this.moveSelection(-1);
            break;
          case "right":
            this.moveSelection(1);
            break;
          case "pageup":
            this.moveSelection(-(columns * viewportHeight));
            break;
          case "pagedown":
            this.moveSelection(columns * viewportHeight);
            break;
          case "return":
          case "enter": {
            const selected = this.options[this.selectedIndex];
            if (!selected || selected.disabled) return;

            cleanup();

            if (this.config.clearOnSubmit) {
              const heightToClear = viewportHeight + 2;
              stdout.write(`\x1B[${heightToClear}A`);
              stdout.write(`\x1B[0J`);
            }

            const icon = selected.icon || "✔";
            const finalLog = `${chalk.cyan("? ")} ${chalk.bold(
              this.config.title || "Select",
            )} ${chalk.green(`${icon} ${selected.label}`)}\n`;
            stdout.write(finalLog);

            resolve(selected.value);
            return;
          }
        }

        if (prevIndex !== this.selectedIndex) render();
      };

      stdin.on("keypress", handleKey);
    });
  }

  private moveSelection(step: number) {
    const len = this.options.length;
    let newIndex = this.selectedIndex;
    let attempts = 0;

    do {
      newIndex = newIndex + step;
      if (newIndex < 0) {
        newIndex = len - 1;
      } else if (newIndex >= len) {
        newIndex = 0;
      }
      attempts++;
    } while (this.options[newIndex]?.disabled && attempts < len);

    if (attempts < len) {
      this.selectedIndex = newIndex;
    }
  }

  private ensureValidSelection() {
    if (this.options[this.selectedIndex]?.disabled) {
      this.moveSelection(1);
    }
  }
}
