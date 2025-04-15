/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("matchPartner", () => {
  it("queries match/partner for the term 'Gallery'", async () => {
    const query = gql`
      {
        matchPartner(query: "Gallery") {
          name
        }
      }
    `

    const partner = { name: "John Gallery" }
    const context = {
      matchPartnerLoader: jest.fn().mockResolvedValue([partner]),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      matchPartner: [{ name: "John Gallery" }],
    })
  })
})
