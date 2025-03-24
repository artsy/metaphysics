import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerShowDocumentMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerShowDocument(
        input: {
          partnerId: "partner123"
          showId: "show123"
          documentId: "document123"
        }
      ) {
        documentOrError {
          __typename
          ... on DeletePartnerShowDocumentSuccess {
            document {
              title
              publicURL
            }
          }
        }
      }
    }
  `

  it("deletes a partner show document", async () => {
    const context = {
      deletePartnerShowDocumentLoader: () =>
        Promise.resolve({
          _id: "document123",
          title: "Press Release",
          uri: "documents/partner/show/document123/press-release.pdf",
        }),
    }

    const deletedDocument = await runAuthenticatedQuery(mutation, context)

    expect(deletedDocument).toEqual({
      deletePartnerShowDocument: {
        documentOrError: {
          __typename: "DeletePartnerShowDocumentSuccess",
          document: {
            title: "Press Release",
            publicURL:
              "https://api.artsy.test/api/v1/documents/partner/show/document123/press-release.pdf",
          },
        },
      },
    })
  })
})
