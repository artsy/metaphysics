export type SemanticVersionNumber = {
  major: number
  minor: number
  patch: number
}

export function getEigenVersionNumber(
  userAgent: string
): SemanticVersionNumber | null {
  console.log(
    "[INFINITE_DISCO] getEigenVersionNumber",
    JSON.stringify({ userAgent })
  )

  if (!userAgent) return null
  if (!userAgent.includes("Artsy-Mobile")) return null

  const parts = userAgent.split("/")
  const version = parts.at(-1)
  console.log(
    "[INFINITE_DISCO] getEigenVersionNumber",
    JSON.stringify({ version })
  )

  if (!version) return null

  const [major, minor, patch] = version.split(".").map(Number)

  console.log(
    "[INFINITE_DISCO] getEigenVersionNumber",
    JSON.stringify({ major, minor, patch })
  )
  return { major, minor, patch }
}

export function isAtLeastVersion(
  version: SemanticVersionNumber,
  atLeast: SemanticVersionNumber
): boolean {
  console.log(
    "[INFINITE_DISCO] isAtLeastVersion",
    JSON.stringify({
      version,
      atLeast,
    })
  )

  const { major, minor, patch } = atLeast

  if (version.major > major) return true
  if (version.major < major) return false

  if (version.minor > minor) return true
  if (version.minor < minor) return false

  return version.patch >= patch
}
