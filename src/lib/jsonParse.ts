/**
 * Safely parses a JSON string, returning undefined if parsing fails
 * or if the input is not a string.
 */
export function safeJsonParse<T>(jsonString: any): T | undefined {
  if (typeof jsonString != "string") {
    return undefined
  }
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error("Error parsing JSON:", error)
    return undefined
  }
}
