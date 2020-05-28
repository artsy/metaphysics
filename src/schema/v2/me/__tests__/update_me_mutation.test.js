/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("UpdateMeMutation", () => {
  it("updates the user profile and returns its new data payload", async () => {
    const mutation = gql`
      mutation {
        updateMyUserProfile(
          input: {
            collectorLevel: 1
            clientMutationId: "1232"
            phone: "1234890"
            location: { address: "123 my street" }
            priceRangeMin: -1
            priceRangeMax: 1000000000000
          }
        ) {
          user {
            name
            phone
            location {
              city
              address
            }
            priceRange
          }
        }
      }
    `

    const context = {
      updateMeLoader: () =>
        Promise.resolve({
          id: "106",
          name: "andy-warhol",
          phone: "1234890",
          location: {
            address: "123 my street",
          },
          price_range: "-1:1000000000000",
        }),
    }

    await runAuthenticatedQuery(mutation, context).then((data) => {
      expect(data).toMatchSnapshot()
    })
    expect.assertions(1)
  })
})
