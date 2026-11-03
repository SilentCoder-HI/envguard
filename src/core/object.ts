import type { Field } from "./field";
import type { Source } from "./types";

export type Shape = Record<string, Field<any>>;
export type Infer<S extends Shape> = { [K in keyof S]: S[K]["_type"] };

export type Result<S extends Shape> =
  | { success: true; data: Infer<S> }
  | { success: false; errors: Record<string, string> };

export class EnvError extends Error {
  constructor(public readonly errors: Record<string, string>) {
    const width = Math.max(...Object.keys(errors).map((k) => k.length));
    super(
      "Invalid environment variables:\n" +
        Object.entries(errors)
          .map(([k, m]) => `  ${k.padEnd(width)}  ${m}`)
          .join("\n")
    );
    this.name = "EnvError";
  }
}

const defaultSource = (): Source =>
  typeof process !== "undefined" && process.env ? (process.env as Source) : {};

export function object<S extends Shape>(shape: S) {
  const safeParse = (source: Source = defaultSource()): Result<S> => {
    const data: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    for (const key of Object.keys(shape)) {
      try {
        data[key] = shape[key]!.parse(source[key]);
      } catch (e) {
        errors[key] = e instanceof Error ? e.message : "invalid";
      }
    }
    return Object.keys(errors).length
      ? { success: false, errors }
      : { success: true, data: data as Infer<S> };
  };

  /** Throws EnvError. Use in libraries and tests. */
  const parse = (source: Source = defaultSource()): Infer<S> => {
    const result = safeParse(source);
    if (!result.success) throw new EnvError(result.errors);
    return result.data;
  };

  /** Prints a clean message and exits with code 1. Use in app entry points. */
  const parseOrExit = (source: Source = defaultSource()): Infer<S> => {
    const result = safeParse(source);
    if (!result.success) {
      console.error(new EnvError(result.errors).message);
      process.exit(1);
    }
    return result.data;
  };

  return { shape, safeParse, parse, parseOrExit };
}