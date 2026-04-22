import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Partner brandKit field", () => {
  const query = gql`
    {
      partner(id: "catty-partner") {
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
    }
  `

  it("resolves the partner's brand kit", async () => {
    const partnerData = {
      _id: "partner-internal-id",
      id: "catty-partner",
    }

    const brandKitData = {
      id: "brand-kit-1",
      partner_id: "partner-internal-id",
      text_color: "#111111",
      background_color: "#FFFFFF",
      cta_color: "#0000FF",
      font_family: "Helvetica",
      font_weight: "bold",
      font_style: "normal",
    }

    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      brandKitLoader: jest.fn().mockResolvedValue(brandKitData),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(context.brandKitLoader).toHaveBeenCalledWith({
      partner_id: "partner-internal-id",
    })
    expect(data).toEqual({
      partner: {
        brandKit: {
          internalID: "brand-kit-1",
          partnerID: "partner-internal-id",
          textColor: "#111111",
          backgroundColor: "#FFFFFF",
          ctaColor: "#0000FF",
          fontFamily: "Helvetica",
          fontWeight: "bold",
          fontStyle: "normal",
        },
      },
    })
  })

  it("returns null when the partner has no brand kit", async () => {
    const partnerData = {
      _id: "partner-internal-id",
      id: "catty-partner",
    }

    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      brandKitLoader: jest.fn().mockResolvedValue({}),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      partner: {
        brandKit: null,
      },
    })
  })

  it("returns null when the brand kit loader rejects", async () => {
    const partnerData = {
      _id: "partner-internal-id",
      id: "catty-partner",
    }

    const context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      brandKitLoader: jest.fn().mockRejectedValue(new Error("boom")),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      partner: {
        brandKit: null,
      },
    })
  })
})
