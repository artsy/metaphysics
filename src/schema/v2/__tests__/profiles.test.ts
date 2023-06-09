import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const PROFILES_FIXTURE = [
  {
    _id: "1",
    owner: { name: "cat gallery" },
  },
  {
    _id: "2",
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
        { node: { internalID: "1", name: "cat gallery" } },
        { node: { internalID: "2", name: "dog gallery" } },
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

  it("uses the match loader when searching by term", async () => {
    const matchProfilesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: PROFILES_FIXTURE,
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        profilesConnection(term: "foo", first: 5) {
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `
    const { profilesConnection } = await runAuthenticatedQuery(query, {
      matchProfilesLoader,
    })

    expect(matchProfilesLoader).toBeCalledWith({
      term: "foo",
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(profilesConnection.totalCount).toBe(2)
    expect(profilesConnection.edges[0].node.name).toEqual("cat gallery")
    expect(profilesConnection.edges[1].node.name).toEqual("dog gallery")
  })

  it("uses the features loader when not searching by term", async () => {
    const profilesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: PROFILES_FIXTURE,
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        profilesConnection(first: 5) {
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `
    const { profilesConnection } = await runAuthenticatedQuery(query, {
      profilesLoader,
    })

    expect(profilesLoader).toBeCalledWith({
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(profilesConnection.totalCount).toBe(2)
    expect(profilesConnection.edges[0].node.name).toEqual("cat gallery")
    expect(profilesConnection.edges[1].node.name).toEqual("dog gallery")
  })
})
