import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeleteCatalogArtworkDocumentMutation", () => {
  const mutation = gql`
    mutation {
      deleteCatalogArtworkDocument(
        input: {
          catalogArtworkId: "catalog-artwork-123"
          documentId: "document-abc"
        }
      ) {
        documentOrError {
          __typename
          ... on DeleteCatalogArtworkDocumentSuccess {
            document {
              internalID
              filename
              title
              url
            }
          }
          ... on DeleteCatalogArtworkDocumentFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("deletes a catalog artwork document", async () => {
    const context = {
      deleteCatalogArtworkDocumentLoader: jest.fn().mockResolvedValue({
        id: "document-abc",
        catalog_artwork_id: "catalog-artwork-123",
        filename: "document.pdf",
        title: "Provenance",
        url:
          "https://s3.amazonaws.com/artsy-uploads/catalog_artworks/catalog-artwork-123/document.pdf",
        file_size: 204800,
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-01T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.deleteCatalogArtworkDocumentLoader).toHaveBeenCalledWith(
      { id: "document-abc" },
      { catalog_artwork_id: "catalog-artwork-123" }
    )

    expect(result).toEqual({
      deleteCatalogArtworkDocument: {
        documentOrError: {
          __typename: "DeleteCatalogArtworkDocumentSuccess",
          document: {
            internalID: "document-abc",
            filename: "document.pdf",
            title: "Provenance",
            url:
              "https://s3.amazonaws.com/artsy-uploads/catalog_artworks/catalog-artwork-123/document.pdf",
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      deleteCatalogArtworkDocumentLoader: jest.fn().mockRejectedValue({
        body: { message: "Document not found" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      deleteCatalogArtworkDocument: {
        documentOrError: {
          __typename: "DeleteCatalogArtworkDocumentFailure",
          mutationError: {
            message: "Document not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        deleteCatalogArtworkDocumentLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
