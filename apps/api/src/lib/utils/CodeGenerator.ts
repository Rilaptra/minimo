// apps/api/src/lib/utils/codeGenerator.ts

/**
 * Configuration options for the Code Generator.
 */
export interface CodeGenOptions {
  /** Character set to use: 'numeric', 'alpha', 'alphanumeric'. Default: 'alphanumeric' */
  charset?: "numeric" | "alpha" | "alphanumeric";
  /** Total length of the random part of the code. Default: 6 */
  length?: number;
  /** Prefix for the code (e.g., "JMT", "USR") */
  prefix?: string;
  /** Separator between prefix and code. Default: "-" */
  separator?: string;
}

const CHARSETS = {
  numeric: "0123456789",
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  alphanumeric:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
};

/**
 * Utility object for generating flexible, custom codes.
 */
export const CodeGenerator = {
  /**
   * Generates a custom code based on provided options.
   * @param {CodeGenOptions} options - Configuration for the code generation.
   * @returns {string} The generated code.
   */
  generate(options: CodeGenOptions = {}): string {
    const {
      prefix = "",
      length = 6,
      charset = "alphanumeric",
      separator = "-",
    } = options;

    const chars = CHARSETS[charset];
    let randomPart = "";

    // Use crypto.getRandomValues for cryptographically secure randomness
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      randomPart += chars[(array[i] ?? 0) % chars.length];
    }

    if (prefix) {
      return `${prefix}${separator}${randomPart}`;
    }

    return randomPart;
  },

  /**
   * Generates a standard UUID v4.
   * @returns {string} A UUID string.
   */
  uuid(): string {
    return crypto.randomUUID();
  },
};

/* 
  Usage Examples:
  CodeGenerator.generate({ prefix: "JMT", charset: "numeric", length: 4 }) -> "JMT-8392"
  CodeGenerator.generate({ prefix: "INV", charset: "alphanumeric", length: 8 }) -> "INV-aB3x9Kq2"
*/
