import { Field, NumberField, StringField } from "./field";
import type { FieldMeta } from "./types";

const base = (kind: FieldMeta["kind"]): FieldMeta => ({
  kind,
  secret: false,
  optional: false,
  hasDefault: false,
});

export const string = () => new StringField(base("string"), (raw) => raw);

export const number = () =>
  new NumberField(base("number"), (raw) => {
    const n = Number(raw.trim());
    if (Number.isNaN(n)) throw new Error("must be a number");
    return n;
  });

const TRUE = ["true", "1", "yes", "on"];
const FALSE = ["false", "0", "no", "off"];

export const boolean = () =>
  new Field<boolean>(base("boolean"), (raw) => {
    const v = raw.trim().toLowerCase();
    if (TRUE.includes(v)) return true;
    if (FALSE.includes(v)) return false;
    throw new Error("must be true/false (or 1/0, yes/no, on/off)");
  });

export function enumOf<const V extends readonly string[]>(values: V) {
  return new Field<V[number]>({ ...base("enum"), enumValues: values }, (raw) => {
    if (!values.includes(raw)) throw new Error(`must be one of: ${values.join(", ")}`);
    return raw;
  });
}