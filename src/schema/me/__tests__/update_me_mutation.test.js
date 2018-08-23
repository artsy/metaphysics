/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"

describe("UpdateMeMutation", () => {
  it("updates the user profile and returns its new data payload", () => {
    const mutation = gql`
      mutation {
        updateMyUserProfile(
          input: {
            collector_level: 1
            clientMutationId: "1232"
            phone: "1234890"
            location: { address: "123 my street" }
            price_range_min: -1
            price_range_max: 1000000000000
          }
        ) {
          user {
            name
            phone
            location {
              city
              address
            }
            price_range
          }
        }
      }
    `

    const rootValue = {
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

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
