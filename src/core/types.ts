export type Source = Record<string, string | undefined>;

export type Check<T = any> = (value: T) => string | null;

export interface FieldMeta {
  kind: "string" | "number" | "boolean" | "enum";
  description?: string;
  secret: boolean;
  optional: boolean;
  hasDefault: boolean;
  default?: unknown;
  enumValues?: readonly string[];
}