import { getPrincipalFieldDirectivePath } from "lib/getPrincipalFieldDirectivePath"
import { isEqual } from "lodash"
import { flattenErrors, statusCodeForError } from "lib/graphqlErrorHandler"

export const principalFieldDirectiveExtension = (documentAST, result) => {
  const path = getPrincipalFieldDirectivePath(documentAST)
  const extensions = {}
  if (path.length && result.errors && result.errors.length) {
    const errors = result.errors.find((e) => isEqual(e.path, path))
    if (!errors) return extensions

    flattenErrors(errors).some((err) => {
      const httpStatusCode = statusCodeForError(err)
      if (httpStatusCode) {
        extensions["principalField"] = {
          httpStatusCode,
        }
        return true
      }
      return false
    })
  }

  return extensions
}
