import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("SubmitInquiryRequestMutation", () => {
  const userByIDLoader = jest.fn(() => {
    return Promise.resolve({
      id: "rob-ross",
      name: "Rob Ross",
      email: "rob@ross.com",
    })
  })

  const authenticatedArtistLoader = jest.fn(() => {
    return Promise.resolve({
      id: "bob-ross",
      name: "Bob Ross",
      birthday: "1929",
    })
  })

  describe("when question is present", () => {
    it("calls gravity loader with questions and address", async () => {
      const mutation = gql`
        mutation {
          submitInquiryRequestMutation(
            input: {
              inquireableID: "artwork-id"
              inquireableType: "Artwork"
              questions: [
                { questionID: "price_and_availability" }
                {
                  questionID: "shipping_quote"
                  details: "{ \\"address\\": \\"112 Main st Brooklyn NY 11211\\"}"
                }
              ]
            }
          ) {
            inquiryRequest {
              inquireable {
                __typename
                ... on Artwork {
                  title
                  artists {
                    name
                    birthday
                  }
                }
              }
              inquirer {
                name
                email
              }
              shippingLocation {
                address
                city
                country
              }
              questions
            }
          }
        }
      `

      const submitArtworkInquiryRequestLoader = jest.fn(() => {
        return Promise.resolve({
          inquireable_type: "Artwork",
          inquireable: {
            id: "bob-ross",
            title: "Happy little accident",
            artists: [{ id: "bob-ross" }],
          },
          inquirer: {
            id: "rob-ross",
          },
          inquiry_questions: ["price_and_availability", "shipping_quote"],
          inquiry_shipping_location: {
            address: "112 Main st Brooklyn NY 11211",
          },
        })
      })

      const context = {
        submitArtworkInquiryRequestLoader,
        userByIDLoader,
        authenticatedArtistLoader,
      }

      expect.assertions(4)
      const { submitInquiryRequestMutation } = await runAuthenticatedQuery(
        mutation,
        context
      )
      expect(submitArtworkInquiryRequestLoader).toHaveBeenCalledWith({
        artwork: "artwork-id",
        inquiry_questions: ["price_and_availability", "shipping_quote"],
        inquiry_shipping_location: {
          address: "112 Main st Brooklyn NY 11211",
        },
      })
      expect(userByIDLoader).toHaveBeenCalledWith("rob-ross")
      expect(authenticatedArtistLoader).toHaveBeenCalledWith("bob-ross")
      expect(submitInquiryRequestMutation).toMatchSnapshot()
    })
  })
  describe("when only message is present", () => {
    it("calls gravity loader with only message", async () => {
      const mutation = gql`
        mutation {
          submitInquiryRequestMutation(
            input: {
              inquireableID: "artwork-id"
              inquireableType: "Artwork"
              message: "do you have sunset paintings?"
            }
          ) {
            inquiryRequest {
              inquireable {
                __typename
                ... on Artwork {
                  title
                  artists {
                    name
                    birthday
                  }
                }
              }
              inquirer {
                name
                email
              }
              shippingLocation {
                address
                city
                country
              }
              questions
            }
          }
        }
      `

      const submitArtworkInquiryRequestLoader = jest.fn(() => {
        return Promise.resolve({
          inquireable_type: "Artwork",
          inquireable: {
            id: "bob-ross",
            title: "Happy little accident",
            artists: [{ id: "bob-ross" }],
          },
          inquirer: {
            id: "rob-ross",
          },
        })
      })

      const context = {
        submitArtworkInquiryRequestLoader,
        userByIDLoader,
        authenticatedArtistLoader,
      }

      expect.assertions(4)
      const { submitInquiryRequestMutation } = await runAuthenticatedQuery(
        mutation,
        context
      )
      expect(submitArtworkInquiryRequestLoader).toHaveBeenCalledWith({
        artwork: "artwork-id",
        message: "do you have sunset paintings?",
      })
      expect(userByIDLoader).toHaveBeenCalledWith("rob-ross")
      expect(authenticatedArtistLoader).toHaveBeenCalledWith("bob-ross")
      expect(submitInquiryRequestMutation).toMatchSnapshot()
    })
  })
})
