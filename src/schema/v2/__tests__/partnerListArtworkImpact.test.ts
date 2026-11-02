import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("PartnerList.artworkImpact", () => {
  const query = gql`
    {
      partner(id: "gallery-1") {
        partnerList(id: "list-abc") {
          artworkImpact(artworkIDs: ["artwork-1", "artwork-2"]) {
            distributionStatus
            privateCount
            unlistedCount
            affectedCount
          }
        }
      }
    }
  `

  it("passes artworkIDs to Gravity as artwork_ids", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({ id: "list-abc" }),
      partnerListArtworkImpactLoader: jest.fn().mockResolvedValue({
        distribution_status: "published",
        private_count: 1,
        unlisted_count: 2,
        affected_count: 3,
      }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(context.partnerListArtworkImpactLoader).toHaveBeenCalledWith(
      "list-abc",
      {
        artwork_ids: ["artwork-1", "artwork-2"],
      }
    )
    expect(result.partner.partnerList.artworkImpact).toEqual({
      distributionStatus: "PUBLISHED",
      privateCount: 1,
      unlistedCount: 2,
      affectedCount: 3,
    })
  })

  it("falls back to NONE when Gravity omits distribution_status", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({ id: "list-abc" }),
      partnerListArtworkImpactLoader: jest.fn().mockResolvedValue({
        private_count: 0,
        unlisted_count: 0,
        affected_count: 0,
      }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(result.partner.partnerList.artworkImpact.distributionStatus).toEqual(
      "NONE"
    )
  })

  it("returns zero counts without calling Gravity when artworkIDs is empty", async () => {
    const emptyQuery = gql`
      {
        partner(id: "gallery-1") {
          partnerList(id: "list-abc") {
            artworkImpact(artworkIDs: []) {
              distributionStatus
              privateCount
              unlistedCount
              affectedCount
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        distribution_status: "draft",
      }),
      partnerListArtworkImpactLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(emptyQuery, context)

    expect(context.partnerListArtworkImpactLoader).not.toHaveBeenCalled()
    expect(result.partner.partnerList.artworkImpact).toEqual({
      distributionStatus: "DRAFT",
      privateCount: 0,
      unlistedCount: 0,
      affectedCount: 0,
    })
  })

  it("does not resolve for a list reached through partnerListsConnection (N+1 guard)", async () => {
    const connectionQuery = gql`
      {
        partner(id: "gallery-1") {
          partnerListsConnection(first: 1) {
            edges {
              node {
                internalID
                artworkImpact(artworkIDs: ["artwork-1"]) {
                  affectedCount
                }
              }
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListsLoader: jest.fn().mockResolvedValue({
        body: [{ id: "list-abc" }],
        headers: { "x-total-count": "1" },
      }),
      partnerListArtworkImpactLoader: jest
        .fn()
        .mockRejectedValue(new Error("should not be called")),
    }

    const result = await runAuthenticatedQuery(connectionQuery, context)

    expect(context.partnerListArtworkImpactLoader).not.toHaveBeenCalled()
    expect(
      result.partner.partnerListsConnection.edges[0].node.artworkImpact
    ).toBeNull()
  })

  it("returns null when unauthenticated", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({ id: "list-abc" }),
    }

    const result = await runQuery(query, context as any)

    expect(result.partner.partnerList.artworkImpact).toBeNull()
  })
})
