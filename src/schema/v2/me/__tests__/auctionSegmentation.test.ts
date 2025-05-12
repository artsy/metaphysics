import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("me.auctionSegmentation", () => {
  describe("when the data is present in Vortex", () => {
    it("returns the user's auction segmentation from Vortex", async () => {
      const query = gql`
        {
          me {
            auctionSegmentation
          }
        }
      `

      const auctionUserSegmentationLoader = jest.fn().mockResolvedValue({
        data: [
          {
            user_id: "abc123",
            auction_segmentation: "adjacent",
          },
        ],
      })

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        auctionUserSegmentationLoader,
      }

      const response = await runAuthenticatedQuery(query, context)

      expect(response).toEqual({
        me: {
          auctionSegmentation: "ADJACENT",
        },
      })
    })
  })

  describe("when the data is not present in Vortex", () => {
    it("returns null", async () => {
      const query = gql`
        {
          me {
            auctionSegmentation
          }
        }
      `

      const auctionUserSegmentationLoader = jest.fn().mockResolvedValue({
        data: [],
      })

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        auctionUserSegmentationLoader,
      }

      const response = await runAuthenticatedQuery(query, context)

      expect(response).toEqual({
        me: {
          auctionSegmentation: null,
        },
      })
    })
  })
})
