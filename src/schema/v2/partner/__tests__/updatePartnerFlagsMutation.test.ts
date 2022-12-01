import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerFlagsMutation", () => {
  it("updates an partner flags", async () => {
    const mutation = `
      mutation {
        updatePartnerFlags(input: { id: "25" }) {
          partner {
            internalID
          }
        }
      }
    `

    const context = {
      updatePartnerFlagsLoader: () =>
        Promise.resolve({
          _id: "foo",
        }),
    }

    try {
      const partner = await runAuthenticatedQuery(mutation, context)
      expect(partner).toEqual({
        updatePartnerFlags: { partner: { internalID: "foo" } },
      })
    } catch (error) {
      console.log(error)
    }
  })
})
