/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: <explanation:  is a control character> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanationa> */
import { emitKeypressEvents } from "node:readline";
import chalk from "chalk";

export interface MultiSelectOption<ValueType> {
  description?: string;
  disabled?: boolean;
  label: string;
  value: ValueType;
}

export interface MultiSelectConfig {
  clearOnSubmit?: boolean;
  columns?: number;
  minSelect?: number;
  pageSize?: number;
  title?: string;
}

export class MultiSelect<ValueType = string> {
  private options: MultiSelectOption<ValueType>[] = [];
  private config: MultiSelectConfig = {
    clearOnSubmit: true,
    columns: 1,
    minSelect: 0,
    pageSize: 7,
  };
  private selectedIndices = new Set<number>();
  private focusedIndex = 0;
  private scrollOffset = 0;

  constructor(config?: MultiSelectConfig) {
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

  public minSelect(count: number): this {
    this.config.minSelect = count;
    return this;
  }

  public add(
    label: string,
    value: ValueType,
    meta?: { desc?: string; disabled?: boolean; selected?: boolean },
  ): this {
    const idx = this.options.length;
    const newOpt: MultiSelectOption<ValueType> = { label, value };

    if (meta?.desc !== undefined) newOpt.description = meta.desc;
    if (meta?.disabled !== undefined) newOpt.disabled = meta.disabled;

    this.options.push(newOpt);

    if (meta?.selected) {
      this.selectedIndices.add(idx);
    }
    return this;
  }

  public async run(): Promise<ValueType[]> {
    if (this.options.length === 0) {
      throw new Error("MultiSelect: No options provided!");
    }

    const { stdin, stdout } = process;
    const columns = this.config.columns || 1;
    const totalDataRows = Math.ceil(this.options.length / columns);
    const viewportHeight = this.config.pageSize || 7;

    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    emitKeypressEvents(stdin as any);
    stdout.write("\x1B[?25l");

    let isFirstRender = true;
    let errorMessage = "";

    const render = () => {
      const currentRow = Math.floor(this.focusedIndex / columns);
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

      const totalRenderedLines = viewportHeight + 2;
      if (!isFirstRender) {
        stdout.write(`\x1B[${totalRenderedLines}A`);
      }

      const count = this.selectedIndices.size;
      const titleStr = this.config.title
        ? `${chalk.cyan("? ")} ${chalk.bold(this.config.title)}`
        : chalk.cyan("? Select options:");

      const selectionInfo =
        count > 0
          ? chalk.green(` (${count} selected)`)
          : chalk.dim(" (0 selected)");

      stdout.write(`${titleStr}${selectionInfo}\x1B[K\n`);

      const maxLabelLen = Math.max(...this.options.map((o) => o.label.length));
      const colWidth = maxLabelLen + 7;

      for (let i = 0; i < viewportHeight; i++) {
        const row = this.scrollOffset + i;
        let lineOutput = "";

        for (let col = 0; col < columns; col++) {
          const idx = row * columns + col;

          if (row < totalDataRows && idx < this.options.length) {
            const opt = this.options[idx];
            if (!opt) continue;

            const isFocused = idx === this.focusedIndex;
            const isSelected = this.selectedIndices.has(idx);

            const pointer = isFocused ? chalk.cyan("❯ ") : "  ";

            let iconStr = isSelected ? "●" : "○";
            if (opt.disabled) iconStr = "🔒";

            let icon = isSelected ? chalk.green(iconStr) : chalk.dim(iconStr);
            if (opt.disabled) icon = chalk.dim(iconStr);

            let styledLabel = opt.label;
            if (opt.disabled) styledLabel = chalk.gray(opt.label);
            else if (isFocused) styledLabel = chalk.cyan.bold(opt.label);
            else if (isSelected) styledLabel = chalk.green(opt.label);
            else styledLabel = chalk.white(opt.label);

            const visualContent = `${pointer}${icon} ${styledLabel}`;
            const rawStringCheck = `  ${iconStr} ${opt.label}`;
            const currentLen = rawStringCheck.length;
            const paddingNeeded = Math.max(1, colWidth - currentLen);
            const padding = " ".repeat(paddingNeeded);

            lineOutput += visualContent + padding;

            if (columns === 1 && opt.description && !opt.disabled) {
              lineOutput = `${lineOutput.trimEnd()} ${chalk.dim(`- ${opt.description}`)}`;
            }
          } else {
            lineOutput += " ".repeat(colWidth);
          }
        }

        let scrollBar = " ";
        if (totalDataRows > viewportHeight) {
          if (row === this.scrollOffset && this.scrollOffset > 0)
            scrollBar = "▲";
          else if (
            row === this.scrollOffset + viewportHeight - 1 &&
            this.scrollOffset + viewportHeight < totalDataRows
          )
            scrollBar = "▼";
          else scrollBar = "│";
        }

        stdout.write(`${lineOutput}${chalk.dim(scrollBar)}\x1B[K\n`);
      }

      if (errorMessage) {
        stdout.write(`${chalk.red(` ⚠ ${errorMessage}`)}\x1B[K\n`);
      } else {
        stdout.write(
          `${chalk.dim(" (Press <space> to select, <enter> to complete)")}\x1B[K\n`,
        );
      }

      isFirstRender = false;
    };

    render();

    return new Promise((resolve) => {
      const handleKey = (_: unknown, key: { name: string; ctrl: boolean }) => {
        if (errorMessage) {
          errorMessage = "";
          render();
          return;
        }

        if (key.ctrl && key.name === "c") {
          stdout.write("\x1B[?25h");
          stdout.write("\n");
          process.exit(0);
        }

        switch (key.name) {
          case "up":
            this.moveFocus(-columns);
            render();
            break;
          case "down":
            this.moveFocus(columns);
            render();
            break;
          case "left":
            this.moveFocus(-1);
            render();
            break;
          case "right":
            this.moveFocus(1);
            render();
            break;
          case "pageup":
            this.moveFocus(-(columns * viewportHeight));
            render();
            break;
          case "pagedown":
            this.moveFocus(columns * viewportHeight);
            render();
            break;
          case "space": {
            const opt = this.options[this.focusedIndex];
            if (!opt) break;
            if (!opt.disabled) {
              if (this.selectedIndices.has(this.focusedIndex)) {
                this.selectedIndices.delete(this.focusedIndex);
              } else {
                this.selectedIndices.add(this.focusedIndex);
              }
              render();
            }
            break;
          }
          case "return":
          case "enter": {
            if (
              this.config.minSelect &&
              this.selectedIndices.size < this.config.minSelect
            ) {
              errorMessage = `You must select at least ${this.config.minSelect} items.`;
              render();
              return;
            }

            stdout.write("\x1B[?25h");
            if (stdin.setRawMode) stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener("keypress", handleKey);

            if (this.config.clearOnSubmit) {
              const totalRenderedLines = viewportHeight + 2;
              stdout.write(`\x1B[${totalRenderedLines}A`);
              stdout.write(`\x1B[0J`);
            }

            const results = this.options
              .filter((_, idx) => this.selectedIndices.has(idx))
              .map((o) => o.value);

            const title = this.config.title || "Selected";
            const preview =
              results.length > 0
                ? chalk.green(results.join(", "))
                : chalk.dim("None");

            stdout.write(
              `${chalk.cyan("? ")} ${chalk.bold(title)} ${preview}\n`,
            );

            resolve(results);
            break;
          }
        }
      };

      stdin.on("keypress", handleKey);
    });
  }

  private moveFocus(step: number) {
    const len = this.options.length;
    let newIndex = this.focusedIndex;
    let attempts = 0;

    do {
      newIndex = newIndex + step;
      if (newIndex < 0) newIndex = len - 1;
      else if (newIndex >= len) newIndex = 0;
      attempts++;
    } while (this.options[newIndex]?.disabled && attempts < len);

    if (attempts < len) {
      this.focusedIndex = newIndex;
    }
  }
}
