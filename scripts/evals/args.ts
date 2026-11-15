// Command-line flags shared by the eval scripts: `--name value` (repeatable)
// and bare `--flag`.

export const argv = process.argv.slice(2)

export const values = (name: string) =>
  argv.flatMap((arg, i) => (arg === name && argv[i + 1] ? [argv[i + 1]] : []))

export const value = (name: string): string | undefined => values(name)[0]

export const flag = (name: string) => argv.includes(name)
