import { string, number, boolean, enumOf } from "./core/builders";
import { object } from "./core/object";
import { parseEnv } from "./core/dotenv";
import { buildExample } from "./core/example";

export const env = { string, number, boolean, enum: enumOf, object };

export { buildExample } from "./core/example";

export { EnvError } from "./core/object";
export { parseEnv } from "./core/dotenv";
export { Field, StringField, NumberField } from "./core/field";
export type { Infer, Shape, Result } from "./core/object";
export type { FieldMeta, Source } from "./core/types";