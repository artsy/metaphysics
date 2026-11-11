import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { buildResaleSubmission } from "lib/loaders/loaders_with_authentication/resaleSubmissionStubs"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import {
  AUCTION_ARTWORK_ID,
  MARKETPLACE_ARTWORK_ID,
  meLoader,
  stubLoaders,
} from "./fixtures"

const query = gql`
  {
    me {
      resaleSubmissionsConnection(first: 2) {
        totalCount
        pageInfo {
          hasNextPage
        }
        edges {
          node {
            internalID
            channel
          }
        }
      }
    }
  }
`

describe("me.resaleSubmissionsConnection", () => {
  it("is empty with the stub", async () => {
    const { me } = await runAuthenticatedQuery(query, {
      meLoader,
      ...stubLoaders(),
    } as any)

    expect(me.resaleSubmissionsConnection).toEqual({
      totalCount: 0,
      pageInfo: { hasNextPage: false },
      edges: [],
    })
  })

  it("pages the submissions the loader returns", async () => {
    const resaleSubmissionsLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          buildResaleSubmission(MARKETPLACE_ARTWORK_ID, "user-42"),
          buildResaleSubmission(AUCTION_ARTWORK_ID, "user-42"),
        ],
        headers: { "x-total-count": "3" },
      })
    )

    const { me } = await runAuthenticatedQuery(query, {
      meLoader,
      resaleSubmissionsLoader,
    } as any)

    expect(resaleSubmissionsLoader).toHaveBeenCalledWith({
      page: 1,
      size: 2,
      offset: 0,
      total_count: true,
    })
    expect(me.resaleSubmissionsConnection).toEqual({
      totalCount: 3,
      pageInfo: { hasNextPage: true },
      edges: [
        {
          node: {
            internalID: `stub-${MARKETPLACE_ARTWORK_ID}`,
            channel: "MARKETPLACE",
          },
        },
        {
          node: {
            internalID: `stub-${AUCTION_ARTWORK_ID}`,
            channel: "AUCTION",
          },
        },
      ],
    })
  })

  it("is empty when Gravity returns 404", async () => {
    const resaleSubmissionsLoader = jest.fn(() =>
      Promise.reject(new HTTPError("Not Found", 404))
    )

    const { me } = await runAuthenticatedQuery(query, {
      meLoader,
      resaleSubmissionsLoader,
    } as any)

    expect(me.resaleSubmissionsConnection.edges).toEqual([])
  })

  it("is null when signed out", async () => {
    const { me } = await runQuery(
      gql`
        {
          me {
            resaleSubmissionsConnection(first: 2) {
              totalCount
            }
          }
        }
      `,
      { meLoader }
    )

    expect(me.resaleSubmissionsConnection).toBeNull()
  })
})
