import { formatGravityError } from "../gravityErrorHandler"
import { HTTPError } from "../HTTPError"

describe("gravityErrorHandler", () => {
  describe("formatGravityError", () => {
    it("returns a parsed error if of an expected format", () => {
      const expectedErrorFormat = {
        message: `https://stagingapi.artsy.net/api/v1/me/credit_cards?provider=stripe&token=tok_chargeDeclinedExpiredCard - {"type":"payment_error","message":"Payment information could not be processed.","detail":"Your card has expired."}`,
        statusCode: 400,
      }
      expect(formatGravityError(expectedErrorFormat)).toEqual({
        detail: "Your card has expired.",
        message: "Payment information could not be processed.",
        type: "payment_error",
      })
    })

    it("returns a parsed error if in the error: format", () => {
      const expectedErrorFormat = {
        message: `https://stagingapi.artsy.net/api/v1/me/credit_cards?provider=stripe&token=tok_chargeDeclinedExpiredCard - {"error":"Card Not Found"}`,
        statusCode: 404,
      }
      expect(formatGravityError(expectedErrorFormat)).toEqual({
        detail: undefined,
        message: "Card Not Found",
        type: "error",
      })
    })

    it("returns a parsed error with a field error array", () => {
      const expectedErrorFormat = {
        message: `https://stagingapi.artsy.net/api/v1/me/credit_cards?provider=stripe&token=tok_chargeDeclinedExpiredCard - 400`,
        statusCode: 400,
        body: {
          type: "param_error",
          message: "Email foo@artsymail.com is not an @artsy address.",
          detail: { email: ["foo@artsymail.com is not an @artsy address"] },
        },
      }
      expect(formatGravityError(expectedErrorFormat)).toEqual({
        detail: undefined,
        fieldErrors: [
          {
            name: "email",
            message: "foo@artsymail.com is not an @artsy address",
          },
        ],
        message: "Email foo@artsymail.com is not an @artsy address.",
        type: "param_error",
        statusCode: 400,
      })
    })
    it("returns an unparsed error if the format is different", () => {
      const unexpectedErrorFormat = {
        message: `https://stagingapi.artsy.net/api/v1/me/credit_cards?provider=stripe&token=tok_chargeDeclinedExpiredCard - {"fooError"`,
        statusCode: 400,
      }
      expect(formatGravityError(unexpectedErrorFormat)).toEqual({
        message: '{"fooError"',
      })
    })
    it("returns null if the error is unrecognizable", () => {
      const unrecognizableError = {
        message:
          "getaddrinfo ENOTFOUND stagingapi.artsy.net stagingapi.artsy.net:443",
      }

      expect(formatGravityError(unrecognizableError)).toEqual(null)
    })

    it("does not log when the HTTPError body is already an object", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

      const error = new HTTPError("Gravity error", 400, {
        type: "param_error",
        message: "Title can't be blank.",
        detail: { title: ["can't be blank"] },
      })

      expect(formatGravityError(error)).toEqual({
        fieldErrors: [{ name: "title", message: "can't be blank" }],
        type: "param_error",
        message: "Title can't be blank.",
        statusCode: 400,
      })
      expect(consoleErrorSpy).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it("still logs and returns an error when the HTTPError body is an unparsable string", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

      const error = new HTTPError("Gravity error", 400, "not json")

      expect(formatGravityError(error)).toEqual({
        type: "error",
        message: "not json",
      })
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)

      consoleErrorSpy.mockRestore()
    })
  })
})
