import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerShowDocumentMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerShowDocument(
        input: {
          partnerId: "partner123"
          showId: "show123"
          documentId: "document123"
          title: "Updated Press Release"
        }
      ) {
        documentOrError {
          __typename
          ... on UpdatePartnerShowDocumentSuccess {
            document {
              title
              publicURL
            }
          }
        }
      }
    }
  `

  it("updates a partner show document", async () => {
    const context = {
      updatePartnerShowDocumentLoader: () =>
        Promise.resolve({
          _id: "document123",
          title: "Updated Press Release",
          uri: "documents/partner/show/document123/updated-press-release.pdf",
        }),
    }

    const updatedDocument = await runAuthenticatedQuery(mutation, context)

    expect(updatedDocument).toEqual({
      updatePartnerShowDocument: {
        documentOrError: {
          __typename: "UpdatePartnerShowDocumentSuccess",
          document: {
            title: "Updated Press Release",
            publicURL:
              "https://api.artsy.test/api/v1/documents/partner/show/document123/updated-press-release.pdf",
          },
        },
      },
    })
  })
})
