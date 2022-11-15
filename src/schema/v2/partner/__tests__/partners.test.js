import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("PartnersConnection", () => {
  it("returns a list of partners matching array of ids", async () => {
    const partnersLoader = ({ id }) => {
      if (id) {
        return Promise.resolve({
          body: id.map((id) => ({ _id: id })),
          headers: { "x-total-count": 1 },
        })
      }

      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        partnersConnection(ids: ["5a958e8e7622dd49f4f4176d"]) {
          edges {
            node {
              internalID
            }
          }
        }
      }
    `
    const { partnersConnection } = await runQuery(query, {
      partnersLoader,
    })

    expect(partnersConnection.edges[0].node.internalID).toEqual(
      "5a958e8e7622dd49f4f4176d"
    )
  })
})

describe.skip("Partners", () => {
  it("returns a list of partners matching array of ids", async () => {
    const partnersLoader = ({ id }) => {
      if (id) {
        return Promise.resolve(
          id.map((id) => ({
            _id: id,
            has_full_profile: true,
            profile_banner_display: true,
          }))
        )
      }
      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        partners(ids: ["5a958e8e7622dd49f4f4176d"]) {
          internalID
        }
      }
    `
    const { partners } = await runQuery(query, { partnersLoader })
    expect(partners[0].internalID).toEqual("5a958e8e7622dd49f4f4176d")
  })
})
