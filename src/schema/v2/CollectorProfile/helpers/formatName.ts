type nameFormat = "default" | "public"

const formatName = (name: string, format: nameFormat): string => {
  switch (format) {
    case "public":
      return formatPublicName(name)
    case "default":
    default:
      return name
  }
}

export const formatPublicName = (name: string): string => {
  if (!name || typeof name !== "string") {
    throw new Error("Invalid name.")
  }

  const nameParts = name.split(" ")

  if (nameParts.length === 1) {
    return nameParts[0]
  }

  if (nameParts.length > 1) {
    const firstName = nameParts[0]
    const lastName = nameParts.pop()
    const lastNameInitial = lastName ? lastName.charAt(0) : ""

    return `${firstName} ${lastNameInitial}.`.trim()
  }

  return name
}

export default formatName
