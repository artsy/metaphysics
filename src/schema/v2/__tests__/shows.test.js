import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("Shows", () => {
  it("returns a list of shows matching array of ids", async () => {
    const showsWithHeadersLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ _id: "example" }],
        headers: { "x-total-count": "1" },
      })
    )

    const query = gql`
      {
        showsConnection(ids: ["example"], first: 5) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    `
    const { showsConnection } = await runQuery(query, {
      showsWithHeadersLoader,
    })

    expect(showsWithHeadersLoader).toBeCalledWith({
      id: ["example"],
      page: 1,
      size: 5,
      total_count: true,
      displayable: true,
    })

    expect(showsConnection.totalCount).toBe(1)
    expect(showsConnection.edges[0].node.internalID).toEqual("example")
  })

  it("passes the args correctly", async () => {
    const showsWithHeadersLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ _id: "example" }],
        headers: { "x-total-count": "1" },
      })
    )

    const query = gql`
      {
        showsConnection(
          first: 5
          hasLocation: false
          sort: START_AT_DESC
          displayable: true
          atAFair: false
          maxPerPartner: 2
        ) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    `

    const { showsConnection } = await runQuery(query, {
      showsWithHeadersLoader,
    })

    expect(showsWithHeadersLoader).toBeCalledWith({
      at_a_fair: false,
      displayable: true,
      has_location: false,
      page: 1,
      size: 5,
      sort: "-start_at",
      total_count: true,
      max_per_partner: 2,
    })

    expect(showsConnection.totalCount).toBe(1)
    expect(showsConnection.edges[0].node.internalID).toEqual("example")
  })
})
