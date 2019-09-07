import { getCanonicalResourceDirectiveForField } from "lib/getCanonicalResourceDirectiveField"
import { isEqual } from "lodash"
import { flattenErrors, statusCodeForError } from "lib/graphqlErrorHandler"

export const canonicalResourceDirectiveExtension = (documentAST, result) => {
  const canonicalFieldPath = getCanonicalResourceDirectiveForField(documentAST)
  let canonicalExtensions = {}
  if (canonicalFieldPath.length && result.errors && result.errors.length) {
    const errors = result.errors.find(e => isEqual(e.path, canonicalFieldPath))

    flattenErrors(errors).some(err => {
      const httpStatusCode = statusCodeForError(err)
      if (httpStatusCode) {
        canonicalExtensions["canonicalResource"] = {
          httpStatusCode,
        }
        return true
      }
      return false
    })
  }

  return canonicalExtensions
}
