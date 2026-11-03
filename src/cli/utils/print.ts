const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

export const red = paint(31);
export const green = paint(32);
export const yellow = paint(33);
export const dim = paint(2);
export const bold = paint(1);

export const ok = (m: string) => console.log(`${green("✔")} ${m}`);
export const fail = (m: string) => console.error(`${red("✖")} ${m}`);
export const warn = (m: string) => console.log(`${yellow("⚠")} ${m}`);
export const info = (m: string) => console.log(m);