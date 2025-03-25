import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerShowDocumentMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerShowDocument(
        input: {
          partnerId: "partner123"
          showId: "show123"
          remoteDocumentUrl: "https://example.com/document.pdf"
          title: "Press Release"
        }
      ) {
        documentOrError {
          __typename
          ... on CreatePartnerShowDocumentSuccess {
            document {
              title
              publicURL
            }
          }
        }
      }
    }
  `

  it("creates a partner show document", async () => {
    const context = {
      createPartnerShowDocumentLoader: () =>
        Promise.resolve({
          _id: "document123",
          title: "Press Release",
          uri: "documents/partner/show/document123/press-release.pdf",
        }),
    }

    const createdDocument = await runAuthenticatedQuery(mutation, context)

    expect(createdDocument).toEqual({
      createPartnerShowDocument: {
        documentOrError: {
          __typename: "CreatePartnerShowDocumentSuccess",
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
