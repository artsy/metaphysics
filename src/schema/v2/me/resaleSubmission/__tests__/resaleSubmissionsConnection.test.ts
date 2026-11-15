import { offsetToCursor } from "graphql-relay"
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const buildSubmission = (id: string) => ({
  id,
  user_id: "user-42",
  submitted_artwork_id: `artwork-for-${id}`,
  state: "accepted",
  channel: "marketplace",
  rejection_reasons: [],
  price_currency_code: "USD",
  price_listed_minor: null,
  recommended_price_min_minor: null,
  recommended_price_max_minor: null,
  packaging: null,
  packer: null,
  courier_handoff: null,
  missing_requirements: [],
  canceled_at: null,
  created_at: "2026-11-12T10:00:00.000Z",
  updated_at: "2026-11-12T10:00:00.000Z",
})

let context: Partial<ResolverContext>
let meResaleSubmissionsLoader: jest.Mock

const mockLoaderResponse = (ids: string[], totalCount: number) => {
  meResaleSubmissionsLoader.mockResolvedValue({
    body: ids.map(buildSubmission),
    headers: { "x-total-count": String(totalCount) },
  })
}

beforeEach(() => {
  meResaleSubmissionsLoader = jest.fn()
  mockLoaderResponse(["sub-1", "sub-2"], 3)

  context = {
    meLoader: jest.fn(() => Promise.resolve({ id: "user-42" })),
    meResaleSubmissionsLoader,
  }
})

describe("me.resaleSubmissionsConnection", () => {
  const queryWith = (connectionArgs: string) => gql`
    query {
      me {
        resaleSubmissionsConnection${connectionArgs} {
          totalCount
          pageInfo {
            hasNextPage
          }
          edges {
            node {
              internalID
              state
              submittedArtworkID
            }
          }
        }
      }
    }
  `

  it("returns submissions with a total count and next page info", async () => {
    const response = await runAuthenticatedQuery(
      queryWith("(first: 2)"),
      context
    )

    expect(response.me.resaleSubmissionsConnection).toEqual({
      totalCount: 3,
      pageInfo: { hasNextPage: true },
      edges: [
        {
          node: {
            internalID: "sub-1",
            state: "ACCEPTED",
            submittedArtworkID: "artwork-for-sub-1",
          },
        },
        {
          node: {
            internalID: "sub-2",
            state: "ACCEPTED",
            submittedArtworkID: "artwork-for-sub-2",
          },
        },
      ],
    })
  })

  it("asks Gravity for the first page with a total count", async () => {
    await runAuthenticatedQuery(queryWith("(first: 2)"), context)

    expect(meResaleSubmissionsLoader).toHaveBeenCalledWith({
      page: 1,
      size: 2,
      total_count: true,
    })
  })

  it("translates a cursor into the matching Gravity page", async () => {
    mockLoaderResponse(["sub-3"], 3)

    await runAuthenticatedQuery(
      queryWith(`(first: 2, after: "${offsetToCursor(1)}")`),
      context
    )

    expect(meResaleSubmissionsLoader).toHaveBeenCalledWith({
      page: 2,
      size: 2,
      total_count: true,
    })
  })

  it("passes the sort through to Gravity", async () => {
    await runAuthenticatedQuery(
      queryWith("(first: 2, sort: UPDATED_AT_DESC)"),
      context
    )

    expect(meResaleSubmissionsLoader).toHaveBeenCalledWith({
      page: 1,
      size: 2,
      sort: "-updated_at",
      total_count: true,
    })
  })

  it("does not send a sort unless one is given, so Gravity's default applies", async () => {
    await runAuthenticatedQuery(queryWith("(first: 2)"), context)

    const params = meResaleSubmissionsLoader.mock.calls[0][0]
    expect(params).not.toHaveProperty("sort")
  })

  it("falls back to Gravity's default page size when first is omitted", async () => {
    await runAuthenticatedQuery(queryWith(""), context)

    expect(meResaleSubmissionsLoader).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      total_count: true,
    })
  })

  it("returns an empty connection when there are no submissions", async () => {
    mockLoaderResponse([], 0)

    const response = await runAuthenticatedQuery(
      queryWith("(first: 2)"),
      context
    )

    expect(response.me.resaleSubmissionsConnection).toEqual({
      totalCount: 0,
      pageInfo: { hasNextPage: false },
      edges: [],
    })
  })

  it("resolves the nested artwork for each submission", async () => {
    context.meMyCollectionArtworksLoader = jest.fn(({ artworks }: any) =>
      Promise.resolve({
        body: artworks.map((id: string) => ({
          _id: id,
          title: `Title of ${id}`,
        })),
        headers: {},
      })
    )

    const artworkQuery = gql`
      query {
        me {
          resaleSubmissionsConnection(first: 2) {
            edges {
              node {
                submittedArtwork {
                  internalID
                  title
                }
              }
            }
          }
        }
      }
    `

    const response = await runAuthenticatedQuery(artworkQuery, context)

    expect(
      response.me.resaleSubmissionsConnection.edges.map(
        (edge) => edge.node.submittedArtwork
      )
    ).toEqual([
      { internalID: "artwork-for-sub-1", title: "Title of artwork-for-sub-1" },
      { internalID: "artwork-for-sub-2", title: "Title of artwork-for-sub-2" },
    ])
  })
})
