type NameFormatType = "default" | "public"

const formatName = (name: string, format: NameFormatType): string => {
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
  } else if (nameParts.length > 1) {
    const firstName = nameParts[0]
    const lastName = nameParts.pop()
    const lastNameInitial = lastName ? lastName.charAt(0) : ""

    return `${firstName} ${lastNameInitial}.`.trim()
  } else {
    return name
  }
}

export default formatName
