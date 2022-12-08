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
    createConsignmentInquiryLoader: () => Promise.resolve(consignmentInquiry),
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
            id
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

  it("requests price estimate and returns submitted params", async () => {
    const data = await runAuthenticatedQuery(query, loaders)
    expect(data).toEqual({
      createConsignmentInquiry: {
        consignmentInquiryOrError: {
          consignmentInquiry: {
            email: "user@art.com",
            id: 1,
            message: "This is my message to you",
            name: "User",
            userId: "1234gravity",
          },
        },
      },
    })
  })
})
