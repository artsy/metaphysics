import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerArtistDocumentMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerArtistDocument(
        input: {
          partnerId: "partner123"
          artistId: "artist123"
          remoteDocumentUrl: "https://example.com/document.pdf"
          title: "Press Release"
        }
      ) {
        documentOrError {
          __typename
          ... on CreatePartnerArtistDocumentSuccess {
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

  it("creates a partner artist document", async () => {
    const context = {
      createPartnerArtistDocumentLoader: () =>
        Promise.resolve({
          _id: "document123",
          title: "Press Release",
          uri: "documents/partner/artist/document123/press-release.pdf",
        }),
      partnerLoader: () => Promise.resolve({ name: "Test Partner" }),
    }

    const createdDocument = await runAuthenticatedQuery(mutation, context)

    expect(createdDocument).toEqual({
      createPartnerArtistDocument: {
        documentOrError: {
          __typename: "CreatePartnerArtistDocumentSuccess",
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
