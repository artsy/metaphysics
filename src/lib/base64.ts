export const base64 = (str: string) =>
  Buffer.from(str, "utf-8").toString("base64")
export const unBase64 = (str: string) =>
  Buffer.from(str, "base64").toString("utf-8")
