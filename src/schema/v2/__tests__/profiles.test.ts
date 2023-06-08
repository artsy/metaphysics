import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const PROFILES_FIXTURE = [
  {
    _id: "2",
    owner: { name: "cat gallery" },
  },
  {
    _id: "3",
    owner: { name: "dog gallery" },
  },
]

describe("profilesConnection", () => {
  it("returns a list of profiles", async () => {
    const query = gql`
      {
        profilesConnection(first: 2) {
          totalCount
          edges {
            node {
              internalID
              name
            }
          }
        }
      }
    `

    const profilesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: PROFILES_FIXTURE,
        headers: {
          "x-total-count": "2",
        },
      })
    )

    const { profilesConnection } = await runAuthenticatedQuery(query, {
      profilesLoader,
    })

    expect(profilesConnection).toEqual({
      totalCount: 2,
      edges: [
        { node: { internalID: "2", name: "cat gallery" } },
        { node: { internalID: "3", name: "dog gallery" } },
      ],
    })

    expect(profilesLoader).toBeCalledWith({
      page: 1,
      size: 2,
      total_count: true,
    })
  })

  it("returns a list of profiles matching array of ids", async () => {
    const profilesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ _id: "example" }],
        headers: { "x-total-count": "1" },
      })
    )

    const query = gql`
      {
        profilesConnection(ids: ["example"], first: 5) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    `
    const { profilesConnection } = await runAuthenticatedQuery(query, {
      profilesLoader,
    })

    expect(profilesLoader).toBeCalledWith({
      id: ["example"],
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(profilesConnection.totalCount).toBe(1)
    expect(profilesConnection.edges[0].node.internalID).toEqual("example")
  })
})
