import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import sinon from "sinon"

describe("SalesConnection", () => {
  const salesData = {
    body: [{ _id: "5a958e8e7622dd49f4f4176d" }],
    headers: {
      "x-total-count": 1,
    },
  }
  const query = gql`
    {
      salesConnection(ids: ["5a958e8e7622dd49f4f4176d"]) {
        edges {
          node {
            internalID
          }
        }
      }
    }
  `
  it("returns a list of sales matching array of ids", async () => {
    const { salesConnection } = await runQuery(query, {
      userRoles: [],
      unauthenticatedLoaders: {
        salesLoaderWithHeaders: sinon
          .stub()
          .returns(Promise.resolve(salesData)),
      },
      authenticatedLoaders: {
        salesLoaderWithHeaders: sinon
          .stub()
          .returns(Promise.resolve(salesData)),
      },
    })
    expect(salesConnection.edges[0].node.internalID).toEqual(
      "5a958e8e7622dd49f4f4176d"
    )
  })

  it("uses authenticated loader if userRoles includes team", async () => {
    const { salesConnection } = await runQuery(query, {
      userRoles: ["team"],
      unauthenticatedLoaders: {
        salesLoaderWithHeaders: sinon.stub().returns(Promise.resolve()),
      },
      authenticatedLoaders: {
        salesLoaderWithHeaders: sinon
          .stub()
          .returns(Promise.resolve(salesData)),
      },
    })
    expect(salesConnection.edges[0].node.internalID).toEqual(
      "5a958e8e7622dd49f4f4176d"
    )
  })
})
