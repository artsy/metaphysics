import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("SaleAgreementsConnection", () => {
  it("return saleAgreements", async () => {
    const saleAgreementsLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [
          { content: "legal terms of sale" },
          { content: "another legal terms of sale" },
        ],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        saleAgreementsConnection(first: 5) {
          totalCount
          edges {
            node {
              content
            }
          }
        }
      }
    `
    const { saleAgreementsConnection } = await runAuthenticatedQuery(query, {
      saleAgreementsLoader,
    })

    expect(saleAgreementsLoader).toBeCalledWith({
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(saleAgreementsConnection.totalCount).toBe(2)
    expect(saleAgreementsConnection.edges[0].node.content).toEqual(
      "legal terms of sale"
    )
    expect(saleAgreementsConnection.edges[1].node.content).toEqual(
      "another legal terms of sale"
    )
  })
})
