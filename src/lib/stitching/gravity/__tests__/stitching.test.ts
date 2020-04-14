import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getGravityMergedSchema,
  getGravityStitchedSchema,
} from "./testingUtils"

it("extends the ViewingRoom type with an artworks field", async () => {
  const mergedSchema = await getGravityMergedSchema()
  const artworkConnectionFields = await getFieldsForTypeFromSchema(
    "ViewingRoom",
    mergedSchema
  )

  expect(artworkConnectionFields).toContain("artworks")
})

it("resolves the artworks field on ViewingRoom as a paginated list", async () => {
  const { resolvers } = await getGravityStitchedSchema()
  const artworksResolver = resolvers.ViewingRoom.artworks.resolve

  const artworks = await artworksResolver(
    {
      artworksConnection: {
        edges: [
          {
            node: {
              artworkID: "1",
            },
          },
          {
            node: {
              artworkID: "2",
            },
          },
          {
            node: {
              artworkID: "3",
            },
          },
        ],
      },
    },
    { first: 2 },
    {
      artworksLoader: () =>
        Promise.resolve([
          {
            id: "1",
            title: "Artwork 1",
          },
          {
            id: "2",
            title: "Artwork 2",
          },
          {
            id: "3",
            title: "Artwork 3",
          },
        ]),
    },
    {}
  )

  expect(artworks.edges.length).toBe(2)
  expect(artworks.pageInfo.startCursor).not.toBe(null)
  expect(artworks.pageInfo.endCursor).not.toBe(null)
  expect(artworks.pageInfo.hasNextPage).toBe(true)
  expect(artworks.pageInfo.hasPreviousPage).toBe(false)
})
