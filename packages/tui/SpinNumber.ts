/** biome-ignore-all lint/style/noNonNullAssertion: <explanation: step is always defined> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanationa> */
import { emitKeypressEvents } from "node:readline";
import chalk from "chalk";

export interface SpinConfig {
  initial?: number;
  max?: number;
  min?: number;
  step?: number;
  title: string;
  unit?: string;
}

export class SpinNumber {
  private config: SpinConfig;
  private value: number;
  private buffer = "";
  private isEditing = false;

  constructor(config: SpinConfig) {
    this.config = { step: 1, ...config };
    this.value = config.initial ?? config.min ?? 0;
  }

  private commitBuffer() {
    if (!this.isEditing || this.buffer === "" || this.buffer === "-") {
      this.isEditing = false;
      this.buffer = "";
      return;
    }

    let parsed = Number.parseFloat(this.buffer);
    if (Number.isNaN(parsed)) {
      parsed = this.value;
    }

    this.value = this.clamp(parsed);
    this.isEditing = false;
    this.buffer = "";
  }

  private clamp(val: number): number {
    let final = val;
    if (this.config.min !== undefined && final < this.config.min) {
      final = this.config.min;
    }
    if (this.config.max !== undefined && final > this.config.max) {
      final = this.config.max;
    }
    return final;
  }

  public async run(): Promise<number> {
    const { stdin, stdout } = process;
    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    emitKeypressEvents(stdin as any);
    stdout.write("\x1B[?25l");

    const render = () => {
      stdout.write("\x1B[2K\r");

      const qMark = chalk.cyan("? ");
      const title = chalk.bold(this.config.title);
      const unitStr = this.config.unit ? chalk.dim(` ${this.config.unit}`) : "";

      let valueDisplay = "";
      if (this.isEditing) {
        valueDisplay = chalk.dim(`${this.value}`);
      } else {
        valueDisplay = chalk.green.bold(`${this.value}`);
      }

      const canDec =
        this.config.min === undefined || this.value > this.config.min;
      const canInc =
        this.config.max === undefined || this.value < this.config.max;

      let leftArr = "";
      let rightArr = "";

      if (this.isEditing) {
        leftArr = canDec ? chalk.cyan.dim("❮") : chalk.gray.dim("❮");
        rightArr = canInc ? chalk.cyan.dim("❯") : chalk.gray.dim("❯");
      } else {
        leftArr = canDec ? chalk.cyan("❮") : chalk.gray("❮");
        rightArr = canInc ? chalk.cyan("❯") : chalk.gray("❯");
      }

      const inputDisplay = this.isEditing
        ? chalk.yellow(`  ${this.buffer}`)
        : "";

      stdout.write(
        `${qMark}${title}  ${leftArr} ${valueDisplay}${unitStr} ${rightArr}${inputDisplay}`,
      );
    };

    render();

    return new Promise((resolve) => {
      const handleKey = (
        _: unknown,
        key: { name: string; ctrl: boolean; shift: boolean; sequence: string },
      ) => {
        if (key.ctrl && key.name === "c") {
          stdout.write("\n\x1B[?25h");
          process.exit(0);
        }

        const step = key.shift ? this.config.step! * 10 : this.config.step!;

        if (["up", "down", "left", "right"].includes(key.name)) {
          if (this.isEditing) {
            this.commitBuffer();
          }

          if (key.name === "left" || key.name === "down") {
            const nextVal = this.value - step;
            this.value = this.clamp(nextVal);
          } else {
            const nextVal = this.value + step;
            this.value = this.clamp(nextVal);
          }
          render();
          return;
        }

        if (key.name === "return" || key.name === "enter") {
          this.commitBuffer();

          if (stdin.setRawMode) stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("keypress", handleKey);

          stdout.write("\n\x1B[?25h");
          stdout.write(`\x1B[A\x1B[2K\r`);
          const unit = this.config.unit || "";
          stdout.write(
            `${chalk.cyan("? ")} ${chalk.bold(this.config.title)} ${chalk.green(this.value + unit)}\n`,
          );

          resolve(this.value);
          return;
        }

        if (/^[\d.-]$/.test(key.sequence)) {
          if (!this.isEditing) {
            this.isEditing = true;
            this.buffer = "";
          }

          if (key.sequence === "-" && this.buffer.length > 0) return;
          if (key.sequence === "." && this.buffer.includes(".")) return;

          this.buffer += key.sequence;
          render();
          return;
        }

        if (key.name === "backspace") {
          if (this.isEditing) {
            this.buffer = this.buffer.slice(0, -1);
            if (this.buffer.length === 0) {
              this.isEditing = false;
            }
            render();
          }
          return;
        }
      };

      stdin.on("keypress", handleKey);
    });
  }
}
