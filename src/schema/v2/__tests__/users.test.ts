import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("usersConnection", () => {
  it("uses the match loader when searching by term", async () => {
    const matchUsersLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ name: "Percy Z" }],
        headers: { "x-total-count": "1" },
      })
    )

    const query = gql`
      {
        usersConnection(term: "Percy Artsy Employee", first: 5) {
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `
    const { usersConnection } = await runAuthenticatedQuery(query, {
      matchUsersLoader,
    })

    expect(matchUsersLoader).toBeCalledWith({
      term: "Percy Artsy Employee",
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(usersConnection.totalCount).toBe(1)
    expect(usersConnection.edges[0].node.name).toEqual("Percy Z")
  })

  it("uses the users loader when not searching by term", async () => {
    const usersLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ name: "Percy Z" }],
        headers: { "x-total-count": "1" },
      })
    )

    const query = gql`
      {
        usersConnection(ids: ["percy-z"], first: 5) {
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `
    const { usersConnection } = await runAuthenticatedQuery(query, {
      usersLoader,
    })

    expect(usersLoader).toBeCalledWith({
      id: ["percy-z"],
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(usersConnection.totalCount).toBe(1)
    expect(usersConnection.edges[0].node.name).toEqual("Percy Z")
  })
})
