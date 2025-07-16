/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateConsignmentInquiryMutation", () => {
  const consignmentInquiry = {
    id: 1,
    gravity_user_id: "1234gravity",
    email: "user@art.com",
    name: "User",
    message: "This is my message to you",
    phone_number: "+49123456",
  }
  const loaders = {
    createConsignmentInquiryLoader: () => {
      throw new Error("Artwork submissions are not accepted at this time.")
    },
  }

  const query = `
  mutation {
    createConsignmentInquiry(input: 
      {
        email: "user@art.com",
        name: "User",
        message: "This is my message to you",
        userId: "1234gravity"
      }
    ) {
      consignmentInquiryOrError {
        ... on ConsignmentInquiryMutationSuccess {
          consignmentInquiry {
            internalID
            name
            email
            message
            userId
          }
        }
        ... on ConsignmentInquiryMutationFailure {
          mutationError {
            error
          }
        }
      }
    }
  }
  `

  it("throws error since Convection is disabled", async () => {
    await expect(runAuthenticatedQuery(query, loaders)).rejects.toThrow(
      "Artwork submissions are not accepted at this time."
    )
  })
})
