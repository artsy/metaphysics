import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    updateBrandKit(input: {
      id: "brand-kit-1"
      textColor: "#FF0000"
      fontFamily: "Courier"
    }) {
      brandKitOrError {
        ... on UpdateBrandKitSuccess {
          brandKit {
            internalID
            textColor
            fontFamily
          }
        }

        ... on UpdateBrandKitFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("updateBrandKit", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "brand-kit-1",
      partner_id: "partner-1",
      text_color: "#FF0000",
      font_family: "Courier",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        updateBrandKitLoader: jest.fn().mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes id and snake_cased attrs to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.updateBrandKitLoader as jest.Mock).toHaveBeenCalledWith(
        "brand-kit-1",
        {
          text_color: "#FF0000",
          background_color: undefined,
          cta_color: undefined,
          font_family: "Courier",
          font_weight: undefined,
          font_style: undefined,
        }
      )
    })

    it("returns the updated brand kit", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "updateBrandKit": {
            "brandKitOrError": {
              "brandKit": {
                "fontFamily": "Courier",
                "internalID": "brand-kit-1",
                "textColor": "#FF0000",
              },
            },
          },
        }
      `)
    })
  })

  it("returns failure on Gravity error", async () => {
    const gravityResponseBody = {
      type: "param_error",
      message: "Text color must be a valid hex color (e.g. #FF0000).",
      detail: {},
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context = {
      updateBrandKitLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "updateBrandKit": {
          "brandKitOrError": {
            "mutationError": {
              "message": "Text color must be a valid hex color (e.g. #FF0000).",
            },
          },
        },
      }
    `)
  })
})
