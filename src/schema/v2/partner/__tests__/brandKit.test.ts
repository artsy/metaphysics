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

  describe("logo field", () => {
    const partnerData = {
      _id: "partner-internal-id",
      id: "catty-partner",
    }

    const logoQuery = gql`
      {
        partner(id: "catty-partner") {
          brandKit {
            logo {
              geminiToken
              geminiTokenUpdatedAt
              imageURL
              imageVersions
              originalWidth
              originalHeight
              aspectRatio
              isProcessing
              processingFailed
            }
          }
        }
      }
    `

    it("returns null when the brand kit has no logo (image: null)", async () => {
      const context = {
        partnerLoader: jest.fn().mockResolvedValue(partnerData),
        brandKitLoader: jest.fn().mockResolvedValue({
          id: "brand-kit-1",
          image: null,
        }),
      }

      const data = await runAuthenticatedQuery(logoQuery, context)
      expect(data).toEqual({ partner: { brandKit: { logo: null } } })
    })

    it("returns null when the image key is absent", async () => {
      const context = {
        partnerLoader: jest.fn().mockResolvedValue(partnerData),
        brandKitLoader: jest.fn().mockResolvedValue({
          id: "brand-kit-1",
        }),
      }

      const data = await runAuthenticatedQuery(logoQuery, context)
      expect(data).toEqual({ partner: { brandKit: { logo: null } } })
    })

    it("exposes processing-state fields while Gemini is still working", async () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const context = {
        partnerLoader: jest.fn().mockResolvedValue(partnerData),
        brandKitLoader: jest.fn().mockResolvedValue({
          id: "brand-kit-1",
          image: {
            id: "image-1",
            gemini_token: "tok-abc",
            gemini_token_updated_at: recentTime,
            image_url: null,
            image_urls: {},
            image_versions: [],
            original_width: null,
            original_height: null,
            aspect_ratio: null,
          },
        }),
      }

      const data = await runAuthenticatedQuery(logoQuery, context)
      expect(data.partner.brandKit.logo).toMatchObject({
        geminiToken: "tok-abc",
        geminiTokenUpdatedAt: recentTime,
        imageURL: null,
        imageVersions: [],
        originalWidth: null,
        originalHeight: null,
        isProcessing: true,
        processingFailed: false,
      })
    })

    it("exposes a fully processed logo with all fields populated", async () => {
      const recentTime = new Date(Date.now() - 1 * 60 * 1000).toISOString()
      const context = {
        partnerLoader: jest.fn().mockResolvedValue(partnerData),
        brandKitLoader: jest.fn().mockResolvedValue({
          id: "brand-kit-1",
          image: {
            id: "image-1",
            gemini_token: "tok-xyz",
            gemini_token_updated_at: recentTime,
            image_url: "https://d7hftxdivxxvm.cloudfront.net/abc/:version.jpg",
            image_urls: {
              square_brand_kit:
                "https://d7hftxdivxxvm.cloudfront.net/abc/square_brand_kit.jpg",
            },
            image_versions: ["square_brand_kit"],
            original_width: 1200,
            original_height: 800,
            aspect_ratio: 1.5,
          },
        }),
      }

      const data = await runAuthenticatedQuery(logoQuery, context)
      expect(data.partner.brandKit.logo).toMatchObject({
        geminiToken: "tok-xyz",
        geminiTokenUpdatedAt: recentTime,
        imageURL: "https://d7hftxdivxxvm.cloudfront.net/abc/:version.jpg",
        imageVersions: ["square_brand_kit"],
        originalWidth: 1200,
        originalHeight: 800,
        aspectRatio: 1.5,
        isProcessing: false,
        processingFailed: false,
      })
    })
  })
})
