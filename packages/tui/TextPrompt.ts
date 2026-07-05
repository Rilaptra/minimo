/** biome-ignore-all lint/suspicious/noExplicitAny: <explanationa> */
/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: <explanationa> */
import { emitKeypressEvents } from "node:readline";
import chalk from "chalk";

// Local utility to replace missing formatting.js
function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, "");
}

export interface TextPromptConfig {
  initialValue?: string;
  password?: boolean;
  placeholder?: string;
  title: string;
  validate?: (value: string) => string | boolean | Promise<string | boolean>;
}

export class TextPrompt {
  private config: TextPromptConfig;
  private value = "";
  private cursorPos = 0;
  private errorMsg = "";

  constructor(config: TextPromptConfig) {
    this.config = config;
    this.value = config.initialValue || "";
    this.cursorPos = this.value.length;
  }

  public async run(): Promise<string> {
    const { stdin, stdout } = process;

    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    emitKeypressEvents(stdin as any);

    let isSubmitting = false;

    const render = () => {
      stdout.write("\x1B[2K\r");
      stdout.write("\x1B[B\x1B[2K\x1B[A");

      const qMark = chalk.cyan("? ");
      const title = chalk.bold(this.config.title);

      let displayValue = this.value;
      if (this.config.password) {
        displayValue = "*".repeat(this.value.length);
      }

      let valueStr = chalk.green(displayValue);

      if (this.value.length === 0 && this.config.placeholder) {
        valueStr = chalk.dim(this.config.placeholder);
      }

      stdout.write(`${qMark}${title} › ${valueStr}`);

      if (this.errorMsg) {
        stdout.write(`\n${chalk.red(`✖ ${this.errorMsg}`)}`);
        stdout.write("\x1B[A");
      }

      const visualTitleLen = stripAnsi(this.config.title).length;
      const prefixLen = 2 + visualTitleLen + 3;
      const visualCursor = prefixLen + this.cursorPos;

      stdout.write(`\x1B[${visualCursor + 1}G`);
    };

    render();

    return new Promise((resolve) => {
      const cleanup = () => {
        if (stdin.setRawMode) stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("keypress", handleKey);
        stdout.write("\n\x1B[2K\x1B[A");
      };

      const handleKey = async (
        _: unknown,
        key: { name: string; ctrl: boolean; sequence: string },
      ) => {
        if (isSubmitting) return;

        if (this.errorMsg) {
          this.errorMsg = "";
          render();
        }

        if (key.ctrl && key.name === "c") {
          cleanup();
          stdout.write("\n");
          process.exit(0);
        }

        switch (key.name) {
          case "return":
          case "enter": {
            isSubmitting = true;
            if (this.config.validate) {
              const result = await this.config.validate(this.value);
              if (typeof result === "string") {
                this.errorMsg = result;
                isSubmitting = false;
                render();
                return;
              }
              if (result === false) {
                this.errorMsg = "Invalid input";
                isSubmitting = false;
                render();
                return;
              }
            }

            cleanup();
            stdout.write("\x1B[2K\r");

            const finalShow = this.config.password
              ? "*".repeat(this.value.length)
              : this.value;

            stdout.write(
              `${chalk.cyan("? ")} ${chalk.bold(this.config.title)} ${chalk.green(finalShow)}\n`,
            );
            resolve(this.value);
            break;
          }

          case "backspace":
            if (this.cursorPos > 0) {
              this.value =
                this.value.slice(0, this.cursorPos - 1) +
                this.value.slice(this.cursorPos);
              this.cursorPos--;
              render();
            }
            break;

          case "delete":
            if (this.cursorPos < this.value.length) {
              this.value =
                this.value.slice(0, this.cursorPos) +
                this.value.slice(this.cursorPos + 1);
              render();
            }
            break;

          case "left":
            if (this.cursorPos > 0) {
              this.cursorPos--;
              render();
            }
            break;

          case "right":
            if (this.cursorPos < this.value.length) {
              this.cursorPos++;
              render();
            }
            break;

          case "home":
            this.cursorPos = 0;
            render();
            break;

          case "end":
            this.cursorPos = this.value.length;
            render();
            break;

          default:
            if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
              this.value =
                this.value.slice(0, this.cursorPos) +
                key.sequence +
                this.value.slice(this.cursorPos);
              this.cursorPos++;
              render();
            }
            break;
        }
      };

      stdin.on("keypress", handleKey);
    });
  }
}
