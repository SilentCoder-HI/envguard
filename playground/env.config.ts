import { env } from "./../src/index.ts";
import { envFile } from "./../src/cli.ts";


export const envSchema= env.object({
  Port: env.number(),
  Host: env.string(),
})