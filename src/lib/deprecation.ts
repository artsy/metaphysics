export function deprecate(
  options: { inVersion: 2 } & (
    | { preferUsageOf: string; reason?: undefined }
    | { reason: string; preferUsageOf?: undefined })
) {
  const reason = options.reason || `Prefer to use \`${options.preferUsageOf}\`.`
  return `${reason} [Will be removed in v${options.inVersion}]`
}

export function shouldBeRemoved(options: {
  deprecationReason: string | null | undefined
  inVersion: number
  typeName: string
  fieldName: string
}) {
  const reason = options.deprecationReason
  if (reason) {
    const match = reason.match(/\[Will be removed in v(\d+)\]$/)
    if (match) {
      const removeFromVersion = parseInt(match[1], 10)
      return removeFromVersion >= options.inVersion
    } else {
      throw new Error(
        `Use the \`deprecate\` function to define a deprecation. [${
          options.typeName
        }.${options.fieldName}]`
      )
    }
  } else {
    return false
  }
}
