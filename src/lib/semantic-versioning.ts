import { isArray } from "lodash"

export type SemanticVersionNumber = {
  major: number
  minor: number
  patch: number
}

export function getEigenVersionNumber(
  userAgent?: string | string[]
): SemanticVersionNumber | null {
  if (!userAgent) return null
  if (!userAgent.includes("Artsy-Mobile")) return null

  const agent = isArray(userAgent) ? userAgent[0] : userAgent
  const parts = agent.split("/")
  const version = parts.at(-1)

  if (!version) return null

  const [major, minor, patch] = version.split(".").map(Number)

  return { major, minor, patch }
}

export function isAtLeastVersion(
  version: SemanticVersionNumber,
  atLeast: SemanticVersionNumber
): boolean {
  const { major, minor, patch } = atLeast

  if (version.major > major) return true
  if (version.major < major) return false

  if (version.minor > minor) return true
  if (version.minor < minor) return false

  return version.patch >= patch
}
