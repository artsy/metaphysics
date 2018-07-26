import { shouldReportError } from "../graphqlErrorHandler"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"

describe("graphqlErrorHandler", () => {
  describe("shouldReportError", () => {
    it("reports non-HTTP errors", () => {
      expect(shouldReportError({ statusCode: undefined })).toBeTruthy()
    })

    it("reports HTTP client errors that are not blacklisted", () => {
      ;[400, 418].forEach(statusCode => {
        expect(shouldReportError({ statusCode })).toBeTruthy()
      })
    })

    it("does not report blacklisted HTTP client errors", () => {
      ;[401, 403, 404].forEach(statusCode => {
        expect(shouldReportError({ statusCode })).toBeFalsy()
      })
    })

    it("does not report HTTP server errors", () => {
      ;[500, 511].forEach(statusCode => {
        expect(shouldReportError({ statusCode })).toBeFalsy()
      })
    })

    it("does not report resolver timeout errors", () => {
      expect(shouldReportError(new GraphQLTimeoutError("oh noes"))).toBeFalsy()
    })
  })
})
