import { shouldReportParentError } from "../graphqlErrorHandler"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"
import { HTTPError } from "lib/HTTPError"

describe("graphqlErrorHandler", () => {
  describe(shouldReportParentError, () => {
    it("reports when the error is null", () => {
      expect(shouldReportParentError(null)).toBeTruthy()
    })

    it("reports when the error is undefined", () => {
      expect(shouldReportParentError(undefined)).toBeTruthy()
    })

    it("reports non-HTTP errors", () => {
      expect(shouldReportParentError(new Error())).toBeTruthy()
    })

    it("reports HTTP client errors that are not blacklisted", () => {
      ;[400, 418].forEach(statusCode => {
        expect(
          shouldReportParentError(new HTTPError("an error", statusCode))
        ).toBeTruthy()
      })
    })

    it("does not report blacklisted HTTP client errors", () => {
      ;[401, 403, 404].forEach(statusCode => {
        expect(
          shouldReportParentError(new HTTPError("an error", statusCode))
        ).toBeFalsy()
      })
    })

    it("does not report HTTP server errors", () => {
      ;[500, 511].forEach(statusCode => {
        expect(
          shouldReportParentError(new HTTPError("an error", statusCode))
        ).toBeFalsy()
      })
    })

    it("does not report resolver timeout errors", () => {
      expect(
        shouldReportParentError(new GraphQLTimeoutError("oh noes"))
      ).toBeFalsy()
    })
  })
})
