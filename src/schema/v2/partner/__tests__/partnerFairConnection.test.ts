import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("PartnerFairConnection", () => {
  let context
  let partnerData
  let fairsResponse

  beforeEach(() => {
    partnerData = {
      _id: "partner-id",
      id: "test-partner",
      slug: "test-partner",
      name: "Test Partner",
      type: "Gallery",
    }

    fairsResponse = {
      body: [
        {
          _id: "fair-1",
          id: "fair-1",
          name: "Art Fair 1",
          slug: "art-fair-1",
        },
        {
          _id: "fair-2",
          id: "fair-2",
          name: "Art Fair 2",
          slug: "art-fair-2",
        },
      ],
      headers: {
        "x-total-count": "2",
      },
    }

    context = {
      partnerLoader: jest.fn().mockResolvedValue(partnerData),
      matchFairsLoader: jest.fn().mockResolvedValue(fairsResponse),
    }
  })

  it("returns partner fair connection with required term parameter", async () => {
    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "art") {
            totalCount
            edges {
              node {
                id
                name
                slug
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        partnerFairConnection: {
          totalCount: 2,
          edges: [
            {
              node: {
                id: "fair-1",
                name: "Art Fair 1",
                slug: "art-fair-1",
              },
            },
            {
              node: {
                id: "fair-2",
                name: "Art Fair 2",
                slug: "art-fair-2",
              },
            },
          ],
        },
      },
    })

    expect(context.matchFairsLoader).toHaveBeenCalledWith({
      size: 5,
      offset: 0,
      total_count: true,
      term: "art",
      exclude_ids: undefined,
    })
  })

  it("supports pagination parameters", async () => {
    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "art", page: 2, size: 10) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(context.matchFairsLoader).toHaveBeenCalledWith({
      size: 10,
      offset: 10,
      total_count: true,
      term: "art",
      exclude_ids: undefined,
    })
  })

  it("supports excludeIDs parameter", async () => {
    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "art", excludeIDs: ["fair-1", "fair-3"]) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(context.matchFairsLoader).toHaveBeenCalledWith({
      size: 5,
      offset: 0,
      total_count: true,
      term: "art",
      exclude_ids: ["fair-1", "fair-3"],
    })
  })

  it("returns null when matchFairsLoader is not available", async () => {
    context.matchFairsLoader = null

    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "art") {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        partnerFairConnection: null,
      },
    })
  })

  it("handles empty results", async () => {
    context.matchFairsLoader.mockResolvedValue({
      body: [],
      headers: {
        "x-total-count": "0",
      },
    })

    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "nonexistent") {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        partnerFairConnection: {
          totalCount: 0,
          edges: [],
        },
      },
    })
  })

  it("requires term parameter", async () => {
    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection {
            totalCount
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(result.errors).toBeDefined()
    expect(result.errors[0].message).toContain("term")
  })

  it("handles loader errors gracefully", async () => {
    context.matchFairsLoader.mockRejectedValue(new Error("API Error"))

    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "art") {
            totalCount
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(result.errors).toBeDefined()
    expect(result.errors[0].message).toContain("API Error")
  })

  it("parses total count from headers correctly", async () => {
    context.matchFairsLoader.mockResolvedValue({
      body: [],
      headers: {
        "x-total-count": "42",
      },
    })

    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "art") {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data.partner.partnerFairConnection.totalCount).toBe(42)
  })

  it("defaults total count to 0 when header is missing", async () => {
    context.matchFairsLoader.mockResolvedValue({
      body: [],
      headers: {},
    })

    const query = gql`
      {
        partner(id: "test-partner") {
          partnerFairConnection(term: "art") {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data.partner.partnerFairConnection.totalCount).toBe(0)
  })
})
