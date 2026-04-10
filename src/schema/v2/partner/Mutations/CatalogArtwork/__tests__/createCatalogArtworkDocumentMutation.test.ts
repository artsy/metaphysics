import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateCatalogArtworkDocumentMutation", () => {
  const mutation = gql`
    mutation {
      createCatalogArtworkDocument(
        input: {
          catalogArtworkId: "catalog-artwork-123"
          s3Bucket: "artsy-uploads"
          s3Key: "catalog_artworks/catalog-artwork-123/document.pdf"
          filename: "document.pdf"
          title: "Provenance"
        }
      ) {
        documentOrError {
          __typename
          ... on CreateCatalogArtworkDocumentSuccess {
            document {
              internalID
              filename
              title
              url
            }
          }
          ... on CreateCatalogArtworkDocumentFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates a catalog artwork document", async () => {
    const context = {
      createCatalogArtworkDocumentLoader: jest.fn().mockResolvedValue({
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

    expect(context.createCatalogArtworkDocumentLoader).toHaveBeenCalledWith({
      catalog_artwork_id: "catalog-artwork-123",
      s3_bucket: "artsy-uploads",
      s3_key: "catalog_artworks/catalog-artwork-123/document.pdf",
      filename: "document.pdf",
      title: "Provenance",
    })

    expect(result).toEqual({
      createCatalogArtworkDocument: {
        documentOrError: {
          __typename: "CreateCatalogArtworkDocumentSuccess",
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
      createCatalogArtworkDocumentLoader: jest.fn().mockRejectedValue({
        body: { message: "Catalog artwork not found" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createCatalogArtworkDocument: {
        documentOrError: {
          __typename: "CreateCatalogArtworkDocumentFailure",
          mutationError: {
            message: "Catalog artwork not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        createCatalogArtworkDocumentLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
