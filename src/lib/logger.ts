/* Simple colored logger for server-side debug */

const color = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
};

function time() {
  const d = new Date();
  return d.toISOString();
}

export const log = {
  info: (label: string, payload?: any) => {
    console.log(`${color.cyan}[INFO]${color.reset} ${color.dim}${time()}${color.reset} ${label}`, payload ?? "");
  },
  warn: (label: string, payload?: any) => {
    console.warn(`${color.yellow}[WARN]${color.reset} ${color.dim}${time()}${color.reset} ${label}`, payload ?? "");
  },
  error: (label: string, payload?: any) => {
    console.error(`${color.red}[ERROR]${color.reset} ${color.dim}${time()}${color.reset} ${label}`, payload ?? "");
  },
  success: (label: string, payload?: any) => {
    console.log(`${color.green}[OK]${color.reset} ${color.dim}${time()}${color.reset} ${label}`, payload ?? "");
  },
  debug: (label: string, payload?: any) => {
    console.log(`${color.magenta}[DEBUG]${color.reset} ${color.dim}${time()}${color.reset} ${label}`, payload ?? "");
  },
};
