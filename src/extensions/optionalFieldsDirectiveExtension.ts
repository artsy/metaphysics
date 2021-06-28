import { getOptionalFieldsDirectivePaths } from "lib/getOptionalFieldsDirectivePaths"
import { isEqual } from "lodash"
import { flattenErrors, statusCodeForError } from "lib/graphqlErrorHandler"

export const optionalFieldsDirectiveExtension = (documentAST, result) => {
  const paths = getOptionalFieldsDirectivePaths(documentAST)
  const extensions = {}
  const optionalFields: any[] = []

  if (paths.length && result.errors && result.errors.length) {
    const optionalErrors = result.errors.filter(
      (error) =>
        paths.filter((path) => isEqual(error.path?.slice(0, path.length), path))
          .length
    )

    if (!optionalErrors) return extensions

    optionalErrors.forEach((errors) => {
      flattenErrors(errors).some((error) => {
        // We always add the error even if it doesn't has a status code.
        const httpStatusCode = statusCodeForError(error) || 500

        optionalFields.push({ httpStatusCode, path: error.path })
      })
    })
  }

  if (optionalFields.length) {
    extensions["optionalFields"] = optionalFields
  }

  return extensions
}
