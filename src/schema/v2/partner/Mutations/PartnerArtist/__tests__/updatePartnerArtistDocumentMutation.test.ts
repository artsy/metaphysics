import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerArtistDocumentMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerArtistDocument(
        input: {
          partnerId: "partner123"
          artistId: "artist123"
          documentId: "document123"
          title: "Updated Press Release"
        }
      ) {
        documentOrError {
          __typename
          ... on UpdatePartnerArtistDocumentSuccess {
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

  it("updates a partner artist document", async () => {
    const context = {
      updatePartnerArtistDocumentLoader: () =>
        Promise.resolve({
          _id: "document123",
          title: "Updated Press Release",
          uri: "documents/partner/artist/document123/updated-press-release.pdf",
        }),
      partnerLoader: () => Promise.resolve({ name: "Test Partner" }),
    }

    const updatedDocument = await runAuthenticatedQuery(mutation, context)

    expect(updatedDocument).toEqual({
      updatePartnerArtistDocument: {
        documentOrError: {
          __typename: "UpdatePartnerArtistDocumentSuccess",
          document: {
            title: "Updated Press Release",
            publicURL:
              "https://api.artsy.test/api/v1/documents/partner/artist/document123/updated-press-release.pdf",
          },
          partner: {
            name: "Test Partner",
          },
        },
      },
    })
  })
})
