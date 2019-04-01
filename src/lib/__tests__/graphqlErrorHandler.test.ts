import {
  formattedGraphQLError,
  shouldReportError,
} from "../graphqlErrorHandler"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"
import { HTTPError } from "lib/HTTPError"
import { GraphQLError } from "graphql"

describe("graphqlErrorHandler", () => {
  describe(shouldReportError, () => {
    it("reports when the error is null", () => {
      expect(shouldReportError(null)).toBeTruthy()
    })

    it("reports when the error is undefined", () => {
      expect(shouldReportError(undefined)).toBeTruthy()
    })

    it("reports non-HTTP errors", () => {
      expect(shouldReportError(new Error())).toBeTruthy()
    })

    it("denies general GraphQL syntax errors", () => {
      expect(
        shouldReportError(
          new GraphQLError("Syntax Error: Unexpected Name 'danger'")
        )
      ).toBeFalsy()
    })

    it("reports HTTP client errors that are not blacklisted", () => {
      ;[400, 418].forEach(statusCode => {
        expect(
          shouldReportError(new HTTPError("an error", statusCode))
        ).toBeTruthy()
      })
    })

    it("does not report blacklisted HTTP client errors", () => {
      ;[401, 403, 404].forEach(statusCode => {
        expect(
          shouldReportError(new HTTPError("an error", statusCode))
        ).toBeFalsy()
      })
    })

    it("does not report HTTP server errors", () => {
      ;[500, 511].forEach(statusCode => {
        expect(
          shouldReportError(new HTTPError("an error", statusCode))
        ).toBeFalsy()
      })
    })

    it("does not report resolver timeout errors", () => {
      expect(shouldReportError(new GraphQLTimeoutError("oh noes"))).toBeFalsy()
    })
  })

  describe(formattedGraphQLError, () => {
    describe("concerning upstream HTTP status codes", () => {
      it("does not include a HTTP status code for non HTTP errors", () => {
        expect(
          Object.keys(formattedGraphQLError(new GraphQLError("something")))
        ).not.toContain("extensions")
      })

      it("does include a HTTP status code for HTTP errors", () => {
        expect(
          formattedGraphQLError(
            new GraphQLError(
              "not found",
              undefined,
              undefined,
              undefined,
              undefined,
              new HTTPError("not found", 404)
            )
          ).extensions
        ).toEqual({ httpStatusCodes: [404] })
      })

      it("does include a HTTP status code for combined HTTP errors", () => {
        expect(
          formattedGraphQLError(
            new GraphQLError(
              "not found",
              undefined,
              undefined,
              undefined,
              undefined,
              ({
                errors: [
                  new GraphQLError(
                    "not found",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    new HTTPError("not found", 404)
                  ),
                  new GraphQLError(
                    "unauthorized",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    new HTTPError("unauthorized", 403)
                  ),
                ],
              } as any) as Error
            )
          ).extensions
        ).toEqual({ httpStatusCodes: [404, 403] })
      })
    })
  })
})
