import {
  formattedGraphQLError,
  shouldReportError,
} from "../graphqlErrorHandler"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"
import { HTTPError } from "lib/HTTPError"
import { GraphQLError } from "graphql"
import {
  getResponseInitByRespectingErrors,
  isOriginalGraphQLError,
  // Not exported via graphql-yoga's package.json `exports` map; this is the
  // exact logic Yoga uses to pick the response status (PHIRE-3303).
} from "../../../node_modules/graphql-yoga/cjs/error"
import config from "config"

type ServerError = {
  message: string
  response: Response
  name: string
  result: any
  statusCode: number
}

// `GraphQLError#toJSON()` only serializes message/locations/path/extensions.
const serialized = (error: GraphQLError) => JSON.parse(JSON.stringify(error))

describe("graphqlErrorHandler", () => {
  describe("shouldReportError", () => {
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

    it("reports HTTP client errors that are not allowlisted", () => {
      ;[400, 418].forEach((statusCode) => {
        expect(
          shouldReportError(new HTTPError("an error", statusCode))
        ).toBeTruthy()
      })
    })

    it("does not report allowlisted HTTP client errors", () => {
      ;[401, 403, 404].forEach((statusCode) => {
        expect(
          shouldReportError(new HTTPError("an error", statusCode))
        ).toBeFalsy()
      })
    })

    it("does not report HTTP server errors", () => {
      ;[500, 511].forEach((statusCode) => {
        expect(
          shouldReportError(new HTTPError("an error", statusCode))
        ).toBeFalsy()
      })
    })

    it("does not report resolver timeout errors", () => {
      expect(shouldReportError(new GraphQLTimeoutError("oh noes"))).toBeFalsy()
    })
  })

  describe("formattedGraphQLError", () => {
    it("returns the same GraphQLError instance rather than a plain object", () => {
      const error = new GraphQLError("something")
      const formatted = formattedGraphQLError(error)
      expect(formatted).toBeInstanceOf(GraphQLError)
      expect(formatted).toBe(error)
    })

    it("keeps a plain client-input error classified as an original GraphQLError", () => {
      // e.g. bad variables / parse errors: no `originalError`, so this is
      // an "expected" error as far as Yoga is concerned.
      const error = new GraphQLError("Variable X was not provided")
      const formatted = formattedGraphQLError(error)
      expect(isOriginalGraphQLError(formatted)).toBe(true)
    })

    it("keeps an unexpected bug wrapped in a GraphQLError classified as not-original", () => {
      const bug = new Error("TypeError: cannot read property of undefined")
      const error = new GraphQLError(
        bug.message,
        undefined,
        undefined,
        undefined,
        undefined,
        bug
      )
      const formatted = formattedGraphQLError(error)
      expect(isOriginalGraphQLError(formatted)).toBe(false)
    })

    describe("stack traces", () => {
      it("are not present in production", () => {
        config.PRODUCTION_ENV = true
        const formatted = formattedGraphQLError(new GraphQLError("something"))
        expect(serialized(formatted).extensions?.stack).toBeUndefined()
        config.PRODUCTION_ENV = false
      })

      it("are present in a non-production environment", () => {
        const formatted = formattedGraphQLError(new GraphQLError("something"))
        expect(serialized(formatted).extensions?.stack).toBeDefined()
      })

      it("never leak the raw error's internal message unexpectedly", () => {
        config.PRODUCTION_ENV = true
        const bug = new Error("super secret internal detail")
        const error = new GraphQLError(
          "Something went wrong",
          undefined,
          undefined,
          undefined,
          undefined,
          bug
        )
        const clientResponse = serialized(formattedGraphQLError(error))
        expect(JSON.stringify(clientResponse)).not.toContain(
          "super secret internal detail"
        )
        config.PRODUCTION_ENV = false
      })
    })

    describe("concerning upstream HTTP status codes", () => {
      it("does not include a HTTP status code for non HTTP errors", () => {
        const formatted = formattedGraphQLError(new GraphQLError("something"))
        expect(serialized(formatted).extensions?.http).toBeUndefined()
        expect(
          serialized(formatted).extensions?.httpStatusCodes
        ).toBeUndefined()
      })

      it("does include a HTTP status code when a response is present", () => {
        const originalError: ServerError = {
          message: "underlying",
          response: { status: 404 } as Response,
          name: "ServerError",
          result: [],
          statusCode: 200,
        }
        const error = new GraphQLError(
          "not found",
          undefined,
          undefined,
          undefined,
          undefined,
          originalError
        )
        const formatted = formattedGraphQLError(error)
        expect(formatted.extensions).toMatchObject({
          httpStatusCodes: [404],
          http: { status: 404 },
        })
      })

      it("does include a HTTP status code for HTTP errors, in the key Yoga reads", () => {
        const error = new GraphQLError(
          "not found",
          undefined,
          undefined,
          undefined,
          undefined,
          new HTTPError("not found", 404)
        )
        const formatted = formattedGraphQLError(error)
        expect(formatted.extensions).toMatchObject({
          httpStatusCodes: [404],
          http: { status: 404 },
        })

        // The exact mechanism Yoga uses (`getResponseInitByRespectingErrors`)
        // to pick an HTTP status for the response.
        const { status } = getResponseInitByRespectingErrors({
          errors: [formatted],
        } as any)
        expect(status).toEqual(404)
      })

      it("does include a HTTP status code for combined HTTP errors", () => {
        const error = new GraphQLError(
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
        const formatted = formattedGraphQLError(error)
        expect(formatted.extensions).toMatchObject({
          httpStatusCodes: [404, 403],
          http: { status: 404 },
        })
      })

      it("propagates HTTP status codes when sent from a stitched backend", () => {
        const originalError = new GraphQLError("extensions: { code: 404")

        const error = new GraphQLError(
          "not found",
          undefined,
          undefined,
          undefined,
          undefined,
          originalError
        )
        const formatted = formattedGraphQLError(error)
        expect(formatted.extensions).toMatchObject({
          httpStatusCodes: [404],
          http: { status: 404 },
        })
      })

      it("doesn't propagate status codes when none match", () => {
        const originalError = new GraphQLError(
          "something is configured wrong (404)"
        )

        const error = new GraphQLError(
          "Unexpected error",
          undefined,
          undefined,
          undefined,
          undefined,
          originalError
        )
        const formatted = formattedGraphQLError(error)
        expect(serialized(formatted).extensions?.http).toBeUndefined()
        expect(
          serialized(formatted).extensions?.httpStatusCodes
        ).toBeUndefined()
      })

      it("still defaults an unclassified/unexpected error to a 500 response", () => {
        const bug = new Error("boom")
        const error = new GraphQLError(
          bug.message,
          undefined,
          undefined,
          undefined,
          undefined,
          bug
        )
        const formatted = formattedGraphQLError(error)

        // No `data` key yet (pre-execution / execution-fatal failure) is
        // what makes Yoga force a 500 for a genuinely unexpected error.
        const { status } = getResponseInitByRespectingErrors({
          errors: [formatted],
        } as any)
        expect(status).toEqual(500)
      })
    })
  })
})
