import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("fairsConnection", () => {
  const query = gql`
    {
      fairsConnection(first: 5) {
        totalCount
        edges {
          node {
            name
          }
        }
      }
    }
  `

  const queryWithTerm = gql`
    {
      fairsConnection(first: 5, term: "art") {
        totalCount
        edges {
          node {
            name
          }
        }
      }
    }
  `

  const fairsLoader = jest.fn(() =>
    Promise.resolve({
      body: [{ name: "Example Fair" }],
      headers: { "x-total-count": "1" },
    })
  )

  const matchFairsLoader = jest.fn(() =>
    Promise.resolve({
      body: [{ name: "Art Basel" }],
      headers: { "x-total-count": "1" },
    })
  )

  afterEach(() => {
    fairsLoader.mockClear()
    matchFairsLoader.mockClear()
  })

  it("returns a connection", async () => {
    const { fairsConnection } = await runQuery(query, {
      unauthenticatedLoaders: { fairsLoader },
    })

    expect(fairsConnection.totalCount).toBe(1)
    expect(fairsConnection.edges).toEqual([{ node: { name: "Example Fair" } }])
  })

  it("passes args to gravity", async () => {
    await runQuery(query, {
      unauthenticatedLoaders: { fairsLoader },
    })

    expect(fairsLoader).toBeCalledTimes(1)
    expect(fairsLoader).toBeCalledWith({ page: 1, size: 5, total_count: true })
  })

  it("uses matchFairsLoader when term is provided and user is authenticated", async () => {
    const { fairsConnection } = await runQuery(queryWithTerm, {
      unauthenticatedLoaders: { fairsLoader },
      authenticatedLoaders: { matchFairsLoader },
    })

    expect(fairsConnection.totalCount).toBe(1)
    expect(fairsConnection.edges).toEqual([{ node: { name: "Art Basel" } }])
    expect(matchFairsLoader).toBeCalledTimes(1)
    expect(matchFairsLoader).toBeCalledWith({
      term: "art",
      page: 1,
      size: 5,
      total_count: true,
    })
    expect(fairsLoader).not.toBeCalled()
  })

  it("throws error when term is provided but user is not authenticated", async () => {
    await expect(
      runQuery(queryWithTerm, {
        unauthenticatedLoaders: { fairsLoader },
      })
    ).rejects.toThrow(
      "You need to pass a X-Access-Token header to perform this action"
    )
  })
})
