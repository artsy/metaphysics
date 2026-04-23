import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    createBrandKit(input: {
      partnerId: "partner-1"
      textColor: "#FF0000"
      backgroundColor: "#00FF00"
      ctaColor: "#0000FF"
      fontFamily: "Helvetica"
      fontWeight: "bold"
      fontStyle: "normal"
    }) {
      brandKitOrError {
        ... on CreateBrandKitSuccess {
          brandKit {
            internalID
            partnerID
            textColor
            backgroundColor
            ctaColor
            fontFamily
            fontWeight
            fontStyle
          }
        }

        ... on CreateBrandKitFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("createBrandKit", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "brand-kit-1",
      partner_id: "partner-1",
      text_color: "#FF0000",
      background_color: "#00FF00",
      cta_color: "#0000FF",
      font_family: "Helvetica",
      font_weight: "bold",
      font_style: "normal",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        createBrandKitLoader: jest.fn().mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes snake_cased args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.createBrandKitLoader as jest.Mock).toHaveBeenCalledWith({
        partner_id: "partner-1",
        text_color: "#FF0000",
        background_color: "#00FF00",
        cta_color: "#0000FF",
        font_family: "Helvetica",
        font_weight: "bold",
        font_style: "normal",
      })
    })

    it("returns the created brand kit", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "createBrandKit": {
            "brandKitOrError": {
              "brandKit": {
                "backgroundColor": "#00FF00",
                "ctaColor": "#0000FF",
                "fontFamily": "Helvetica",
                "fontStyle": "normal",
                "fontWeight": "bold",
                "internalID": "brand-kit-1",
                "partnerID": "partner-1",
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
      message: "Partner already has a brand kit.",
      detail: {},
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context = {
      createBrandKitLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "createBrandKit": {
          "brandKitOrError": {
            "mutationError": {
              "message": "Partner already has a brand kit.",
            },
          },
        },
      }
    `)
  })
})
