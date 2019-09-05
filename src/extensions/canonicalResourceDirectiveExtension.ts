import { getCanonicalResourceDirectiveForField } from "lib/getCanonicalResourceDirectiveField"
import { isEqual } from "lodash"
import { flattenErrors, statusCodeForError } from "lib/graphqlErrorHandler"

export const canonicalResourceDirectiveExtension = (documentAST, result) => {
  const canonicalFieldPath = getCanonicalResourceDirectiveForField(documentAST)
  let canonicalExtensions = {}
  if (canonicalFieldPath.length && result.errors && result.errors.length) {
    result.errors.forEach(e => {
      if (isEqual(e.path, canonicalFieldPath)) {
        const errors = flattenErrors(e)

        errors.forEach(err => {
          const httpStatusCode = statusCodeForError(err)

          if (httpStatusCode) {
            canonicalExtensions["canonicalResource"] = {
              httpStatusCode,
            }
            return
          }
        })
      }
    })
  }

  return canonicalExtensions
}
