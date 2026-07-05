/** biome-ignore-all lint/style/noNonNullAssertion: <explanationa> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanationa> */
/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: <explanationa> */

import { sep as pathSep } from "node:path";
import { emitKeypressEvents } from "node:readline";
import chalk from "chalk";

// Local utility to replace missing formatting.js
function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, "");
}

// 🔥 TYPE BARU: Mode
export type AutoCompleteMode = "command" | "history";

// 🔥 UPDATE: Suggester terima parameter mode
export type AutoCompleteSuggester = (
  token: string,
  fullInput: string,
  mode: AutoCompleteMode,
) => Promise<string[]> | string[];

export interface AutoCompleteConfig {
  initialValue?: string;
  limit?: number;
  separator?: string | RegExp;
  suggest: AutoCompleteSuggester;
  title: string;
}

export class AutoComplete {
  private config: AutoCompleteConfig;
  private input = "";
  private cursorPos = 0;

  // State Management
  private suggestions: string[] = [];
  private selectedIndex = 0;
  private scrollOffset = 0;
  private lastRenderHeight = 0;

  // Token Management
  private activeToken = "";
  private tokenStart = 0;
  private tokenEnd = 0;

  // 🔥 STATE BARU: Mode saat ini
  private mode: AutoCompleteMode = "command";

  constructor(config: AutoCompleteConfig) {
    this.config = {
      limit: 10,
      separator: " ",
      ...config,
    };
    this.input = config.initialValue || "";
    this.cursorPos = this.input.length;
  }

  private async refreshSuggestions() {
    // 1. Identify Token
    const sep = this.config.separator!;
    let start = 0;
    let end = this.input.length;

    for (let i = this.cursorPos - 1; i >= 0; i--) {
      if (this.input[i]?.match(sep)) {
        start = i + 1;
        break;
      }
    }
    for (let i = this.cursorPos; i < this.input.length; i++) {
      if (this.input[i]?.match(sep)) {
        end = i;
        break;
      }
    }

    this.tokenStart = start;
    this.tokenEnd = end;
    this.activeToken = this.input.slice(start, end);

    // 2. Fetch Suggestions with MODE
    try {
      const rawSuggestions = await this.config.suggest(
        this.activeToken,
        this.input,
        this.mode,
      );
      this.suggestions = rawSuggestions;

      if (this.selectedIndex >= this.suggestions.length) {
        this.selectedIndex = 0;
        this.scrollOffset = 0;
      }
    } catch {
      this.suggestions = [];
    }
  }

  public async run(): Promise<string> {
    const { stdin, stdout } = process;

    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    emitKeypressEvents(stdin as any);

    await this.refreshSuggestions();

    const render = () => {
      if (this.lastRenderHeight > 0) {
        stdout.write(`\x1B[${this.lastRenderHeight}B`);
        stdout.write(`\x1B[${this.lastRenderHeight}A`);
        stdout.write("\x1B[J");
      }

      stdout.write("\x1B[2K\r");
      const qMark = chalk.cyan("? ");
      const modeBadge =
        this.mode === "history"
          ? chalk.bgYellow.black(" HISTORY ")
          : chalk.bgBlue.white(" CMD ");
      const title = `${chalk.bold(this.config.title)} ${modeBadge}`;
      const pointer = chalk.dim("›");

      const before = this.input.slice(0, this.tokenStart);
      const token = this.input.slice(this.tokenStart, this.tokenEnd);
      const after = this.input.slice(this.tokenEnd);
      const coloredInput = `${before}${chalk.underline(token)}${after}`;

      stdout.write(`${qMark}${title} ${pointer} ${coloredInput}`);

      const limit = this.config.limit || 5;
      const total = this.suggestions.length;
      let linesToPrint: string[] = [];

      if (total > 0) {
        const visible = this.suggestions.slice(
          this.scrollOffset,
          this.scrollOffset + limit,
        );

        linesToPrint = visible.map((sug, idx) => {
          const realIndex = this.scrollOffset + idx;
          const isSelected = realIndex === this.selectedIndex;
          const matchLen = this.activeToken.length;
          let displaySug = sug;

          if (this.mode === "history") {
            displaySug = chalk.yellow(sug);
          } else if (
            sug.toLowerCase().startsWith(this.activeToken.toLowerCase()) &&
            matchLen > 0
          ) {
            displaySug =
              chalk.cyan(sug.slice(0, matchLen)) +
              chalk.dim(sug.slice(matchLen));
          } else {
            displaySug = chalk.dim(sug);
          }

          if (isSelected) {
            return `${chalk.cyan("❯")} ${chalk.bold.white(sug)}`;
          }
          return `  ${displaySug}`;
        });

        if (total > limit) {
          const progress = Math.round(
            (this.scrollOffset / (total - limit)) * 100,
          );
          linesToPrint.push(
            chalk.dim(
              `  [${progress}%] (${this.scrollOffset + 1}-${Math.min(this.scrollOffset + limit, total)}/${total})`,
            ),
          );
        }
      } else {
        if (this.mode === "history" && this.input.length > 0) {
          linesToPrint.push(chalk.dim("  (No history found)"));
        }
      }

      if (linesToPrint.length > 0) {
        stdout.write("\n");
        stdout.write(linesToPrint.join("\n"));
        this.lastRenderHeight = linesToPrint.length;
        stdout.write(`\x1B[${this.lastRenderHeight}A`);
      } else {
        this.lastRenderHeight = 0;
      }

      const rawTitleLen = stripAnsi(this.config.title).length;
      const badgeVisualLen = this.mode === "history" ? 9 : 5;
      const finalLen =
        2 + rawTitleLen + 1 + badgeVisualLen + 3 + this.cursorPos;
      stdout.write(`\x1B[${finalLen + 1}G`);
    };

    render();

    return new Promise((resolve) => {
      const handleKey = async (
        _: unknown,
        key: { name: string; ctrl: boolean; sequence: string },
      ) => {
        if (key.ctrl && key.name === "c") {
          // TODO: Implement ShellLoop.printBanner() in your framework
          Bun.gc(true);
          render();
        }

        if (key.ctrl && key.name === "z") {
          stdout.write("\n\x1B[J\x1B[?25h");
          process.exit(0);
        }

        if (key.ctrl && key.name === "r") {
          cleanup();
          // TODO: Implement restartShell() in your framework
          return;
        }

        switch (key.name) {
          case "return":
          case "enter": {
            if (this.suggestions.length > 0) {
              if (this.mode === "history") this.applySelection();
              await this.refreshSuggestions();
              render();
            }

            stdout.write("\x1B[J");
            stdout.write("\x1B[2K\r");
            stdout.write(
              `${chalk.cyan("? ")} ${chalk.bold(this.config.title)} ${chalk.green(this.input)}\n`,
            );

            cleanup();
            resolve(this.input);
            break;
          }

          case "tab":
            if (this.input.length === 0) {
              if (this.mode === "history") {
                this.mode = "command";
                await this.refreshSuggestions();
                render();
                break;
              } else {
                break;
              }
            }
            this.applySelection();
            await this.refreshSuggestions();
            render();
            break;

          case "up":
            if (this.suggestions.length === 0 && this.mode === "command") {
              this.mode = "history";
              await this.refreshSuggestions();
              render();
              break;
            }
            this.selectedIndex--;
            if (this.selectedIndex < 0) {
              this.selectedIndex = this.suggestions.length - 1;
              this.scrollOffset = Math.max(
                0,
                this.suggestions.length - (this.config.limit || 5),
              );
            } else if (this.selectedIndex < this.scrollOffset) {
              this.scrollOffset = this.selectedIndex;
            }
            render();
            break;

          case "down":
            if (this.suggestions.length === 0 && this.mode === "command") {
              this.mode = "history";
              await this.refreshSuggestions();
              render();
              break;
            } else {
              this.selectedIndex++;
              const limit = this.config.limit || 5;
              if (this.selectedIndex >= this.suggestions.length) {
                this.selectedIndex = 0;
                this.scrollOffset = 0;
              } else if (this.selectedIndex >= this.scrollOffset + limit) {
                this.scrollOffset = this.selectedIndex - limit + 1;
              }
              render();
            }
            break;

          case "right":
            if (this.suggestions.length > 0) {
              this.applySelection();
              await this.refreshSuggestions();
              render();
            } else if (this.cursorPos < this.input.length) {
              this.cursorPos++;
              await this.refreshSuggestions();
              render();
            }
            break;

          case "left":
            if (this.cursorPos > 0) {
              this.cursorPos--;
              await this.refreshSuggestions();
              render();
            }
            break;

          case "backspace":
            if (this.cursorPos > 0) {
              const isCtrl = key.ctrl || key.sequence === "\b";
              if (isCtrl) {
                this.deleteWordLeft();
              } else {
                this.input =
                  this.input.slice(0, this.cursorPos - 1) +
                  this.input.slice(this.cursorPos);
                this.cursorPos--;
              }
              await this.refreshSuggestions();
              render();
            }
            break;

          case "w":
            if (key.ctrl) {
              this.deleteWordLeft();
              await this.refreshSuggestions();
              render();
            } else if (key.sequence.length === 1) {
              this.input =
                this.input.slice(0, this.cursorPos) +
                key.sequence +
                this.input.slice(this.cursorPos);
              this.cursorPos++;
              await this.refreshSuggestions();
              render();
            }
            break;

          default:
            if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
              this.input =
                this.input.slice(0, this.cursorPos) +
                key.sequence +
                this.input.slice(this.cursorPos);
              this.cursorPos++;
              await this.refreshSuggestions();
              render();
            }
            break;
        }
      };

      const cleanup = () => {
        if (stdin.setRawMode) stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("keypress", handleKey);
        stdout.write("\x1B[?25h");
      };

      stdin.on("keypress", handleKey);
    });
  }

  private applySelection() {
    const sep = this.config.separator || " ";
    const selected = this.suggestions[this.selectedIndex];
    if (!selected) return;

    if (
      this.mode === "history" ||
      (selected.includes(" ") && selected.startsWith(this.input))
    ) {
      this.input = selected;
      this.cursorPos = this.input.length;
    } else {
      const before = this.input.slice(0, this.tokenStart);
      const after = this.input.slice(this.tokenEnd);
      let insertion = selected;
      if (
        typeof sep === "string" &&
        !insertion.endsWith(sep) &&
        !insertion.endsWith(pathSep) &&
        !insertion.endsWith(" ")
      ) {
        insertion += " ";
      }
      this.input = before + insertion + after;
      this.cursorPos = (before + insertion).length;
    }
  }

  private deleteWordLeft() {
    if (this.cursorPos <= 0) return;
    const textBefore = this.input.slice(0, this.cursorPos);
    const lastChar = textBefore[textBefore.length - 1] || "";
    const deletingSpaces = /\s/.test(lastChar);

    let deleteCount = 0;
    for (let i = textBefore.length - 1; i >= 0; i--) {
      const char = textBefore[i] || "";
      const isCharSpace = /\s/.test(char);
      if (deletingSpaces === isCharSpace) {
        deleteCount++;
      } else {
        break;
      }
    }

    this.input =
      this.input.slice(0, this.cursorPos - deleteCount) +
      this.input.slice(this.cursorPos);
    this.cursorPos -= deleteCount;
  }
}
