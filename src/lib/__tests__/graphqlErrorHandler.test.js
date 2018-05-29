import { shouldLogError } from "../graphqlErrorHandler"

describe("graphqlErrorHandler", () => {
  it("reports non-HTTP errors", () => {
    expect(shouldLogError({ statusCode: undefined })).toBeTruthy()
  })

  it("reports HTTP client errors that are not blacklisted", () => {
    ;[400, 418].forEach(statusCode => {
      expect(shouldLogError({ statusCode })).toBeTruthy()
    })
  })

  it("does not report blacklisted HTTP client errors", () => {
    ;[401, 403, 404].forEach(statusCode => {
      expect(shouldLogError({ statusCode })).toBeFalsy()
    })
  })

  it("does not report HTTP server errors", () => {
    ;[500, 511].forEach(statusCode => {
      expect(shouldLogError({ statusCode })).toBeFalsy()
    })
  })
})
