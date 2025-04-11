import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerArtistDocumentMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerArtistDocument(
        input: {
          partnerId: "partner123"
          artistId: "artist123"
          documentId: "document123"
        }
      ) {
        documentOrError {
          __typename
          ... on DeletePartnerArtistDocumentSuccess {
            document {
              title
              publicURL
            }
            partner {
              name
            }
          }
        }
      }
    }
  `

  it("deletes a partner artist document", async () => {
    const context = {
      deletePartnerArtistDocumentLoader: () =>
        Promise.resolve({
          _id: "document123",
          title: "Press Release",
          uri: "documents/partner/artist/document123/press-release.pdf",
        }),
      partnerLoader: () => Promise.resolve({ name: "Test Partner" }),
    }

    const deletedDocument = await runAuthenticatedQuery(mutation, context)

    expect(deletedDocument).toEqual({
      deletePartnerArtistDocument: {
        documentOrError: {
          __typename: "DeletePartnerArtistDocumentSuccess",
          document: {
            title: "Press Release",
            publicURL:
              "https://api.artsy.test/api/v1/documents/partner/artist/document123/press-release.pdf",
          },
          partner: {
            name: "Test Partner",
          },
        },
      },
    })
  })
})
