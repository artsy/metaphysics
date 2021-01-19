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
  const fairsLoader = jest.fn(() =>
    Promise.resolve({
      body: [{ name: "Example Fair" }],
      headers: { "x-total-count": "1" },
    })
  )

  afterEach(() => {
    fairsLoader.mockClear()
  })

  it("returns a connection", async () => {
    const { fairsConnection } = await runQuery(query, { fairsLoader })

    expect(fairsConnection.totalCount).toBe(1)
    expect(fairsConnection.edges).toEqual([{ node: { name: "Example Fair" } }])
  })

  it("passes args to gravity", async () => {
    await runQuery(query, { fairsLoader })

    expect(fairsLoader).toBeCalledTimes(1)
    expect(fairsLoader).toBeCalledWith({ page: 1, size: 5, total_count: true })
  })
})
