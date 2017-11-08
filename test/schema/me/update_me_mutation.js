import { runAuthenticatedQuery } from "test/utils"
import gql from "test/gql"

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
          }
        ) {
          user {
            name
            phone
            location {
              city
              address
            }
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
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
