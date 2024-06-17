import { flattenErrors, statusCodeForError } from "lib/graphqlErrorHandler"

// Log in `extensions` if this request was by an email provider and resulted
// in a 429 rate limit error from a downstream request made using `fetch`.
export const emailProviderRateLimitExtension = (_documentAST, result) => {
  const extensions = {}

  if (result.errors && result.errors.length) {
    result.errors.some((err) => {
      flattenErrors(err).some((e) => {
        const httpStatusCode = statusCodeForError(e)
        if (httpStatusCode === 429) {
          extensions["emailProviderLimited"] = true
          return true
        }
        return false
      })
    })
  }

  return extensions
}
