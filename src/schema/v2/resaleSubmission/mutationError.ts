import { formatGravityError } from "lib/gravityErrorHandler"

// For errors raised in Metaphysics, shaped so the mutations' failure branch matches them.
export const mutationError = (message: string) => ({
  _type: "GravityMutationError",
  type: "error",
  message,
})

// Any thrown error, as a failure with a message, so it never escapes the union.
export const toMutationError = (error: any) => {
  const formatted = formatGravityError(error)
  const message = formatted?.message || error?.message || String(error)

  return formatted
    ? { ...formatted, message, _type: "GravityMutationError" }
    : mutationError(message)
}
