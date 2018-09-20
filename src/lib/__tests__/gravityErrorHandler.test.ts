import { formatGravityError } from "../gravityErrorHandler"

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
  })
})
