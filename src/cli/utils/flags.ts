import { UsageError } from "./errors";

export interface Flags {
  file?: string;
  config?: string;
  out?: string;
  dir: string[];
  stdout: boolean;
  check: boolean;
  strict: boolean;
  system: boolean;
  help: boolean;
}

export function parseFlags(args: string[]): Flags {
  const f: Flags = { dir: [], stdout: false, check: false, strict: false, system: false, help: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    const next = () => {
      const v = args[++i];
      if (v === undefined) throw new UsageError(`Option ${a} needs a value`);
      return v;
    };
    switch (a) {
      case "--file": f.file = next(); break;
      case "--config": f.config = next(); break;
      case "--out": f.out = next(); break;
      case "--dir": f.dir.push(next()); break;
      case "--stdout": f.stdout = true; break;
      case "--check": f.check = true; break;
      case "--strict": f.strict = true; break;
      case "--system": f.system = true; break;
      case "-h":
      case "--help": f.help = true; break;
      default: throw new UsageError(`Unknown option: ${a}`);
    }
  }
  return f;
}