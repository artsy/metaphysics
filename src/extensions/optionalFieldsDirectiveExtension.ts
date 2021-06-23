import { getOptionalFieldsDirectivePaths } from "lib/getOptionalFieldsDirectivePaths"
import { isEqual } from "lodash"
import { flattenErrors, statusCodeForError } from "lib/graphqlErrorHandler"

export const optionalFieldsDirectiveExtension = (documentAST, result) => {
  const paths = getOptionalFieldsDirectivePaths(documentAST)
  const extensions = {}
  const optionalFields: any[] = []

  if (paths.length && result.errors && result.errors.length) {
    const optionalErrors = result.errors.filter(
      (e) => paths.filter((path) => isEqual(e.path, path)).length
    )

    if (!optionalErrors) return extensions

    optionalErrors.forEach((errors) => {
      flattenErrors(errors).some((err) => {
        const httpStatusCode = statusCodeForError(err)

        optionalFields.push({ httpStatusCode: httpStatusCode || 500 })

        // if (httpStatusCode) {
        //   optionalFields.push({ httpStatusCode })
        //   return true
        // }
        // return false
      })
    })
  }

  if (optionalFields.length) {
    extensions["optionalFields"] = optionalFields
  }

  return extensions
}
