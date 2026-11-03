import type { Check, FieldMeta } from "./types";

type Ctor<F> = new (
  meta: FieldMeta,
  convert: (raw: string) => unknown,
  checks: Check[]
) => F;

export class Field<T> {
  /** Type-only marker so Infer<> works. Never read at runtime. */
  declare readonly _type: T;

  constructor(
    public readonly meta: FieldMeta,
    protected readonly convert: (raw: string) => unknown,
    protected readonly checks: Check[] = []
  ) {}

  /** Returns a NEW field (fields are immutable). */
  protected make(meta: Partial<FieldMeta>, extra: Check[] = []): this {
    const C = this.constructor as Ctor<this>;
    return new C({ ...this.meta, ...meta }, this.convert, [...this.checks, ...extra]);
  }

  describe(text: string): this {
    return this.make({ description: text });
  }

  /** Marks the value as sensitive: never printed, never written to .env.example. */
  secret(): this {
    return this.make({ secret: true });
  }

  /** Put .optional() and .default() LAST in the chain. */
  optional(): Field<T | undefined> {
    return this.make({ optional: true }) as unknown as Field<T | undefined>;
  }

  default(value: T): Field<T> {
    return this.make({ hasDefault: true, default: value }) as unknown as Field<T>;
  }

  /** Throws Error with a SHORT message that never contains the value. */
  parse(raw: string | undefined): T {
    if (raw === undefined || raw.trim() === "") {
      if (this.meta.hasDefault) return this.meta.default as T;
      if (this.meta.optional) return undefined as T;
      throw new Error("missing");
    }
    const value = this.convert(raw);
    for (const check of this.checks) {
      const message = check(value);
      if (message) throw new Error(message);
    }
    return value as T;
  }
}

export class StringField extends Field<string> {
  min(n: number) {
    return this.make({}, [(v: string) => (v.length < n ? `must be at least ${n} characters` : null)]);
  }
  max(n: number) {
    return this.make({}, [(v: string) => (v.length > n ? `must be at most ${n} characters` : null)]);
  }
  url() {
    return this.make({}, [
      (v: string) => {
        try {
          new URL(v);
          return null;
        } catch {
          return "must be a valid URL";
        }
      },
    ]);
  }
  email() {
    return this.make({}, [(v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "must be a valid email")]);
  }
  matches(re: RegExp, message = "has an invalid format") {
    return this.make({}, [(v: string) => (re.test(v) ? null : message)]);
  }
}

export class NumberField extends Field<number> {
  min(n: number) {
    return this.make({}, [(v: number) => (v < n ? `must be >= ${n}` : null)]);
  }
  max(n: number) {
    return this.make({}, [(v: number) => (v > n ? `must be <= ${n}` : null)]);
  }
  int() {
    return this.make({}, [(v: number) => (Number.isInteger(v) ? null : "must be an integer")]);
  }
  port() {
    return this.make({}, [
      (v: number) => (Number.isInteger(v) && v >= 1 && v <= 65535 ? null : "must be a port (1-65535)"),
    ]);
  }
}