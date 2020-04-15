import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getGravityMergedSchema,
  getGravityStitchedSchema,
} from "./testingUtils"

it("extends the ViewingRoom type with an artworksConnection field", async () => {
  const mergedSchema = await getGravityMergedSchema()
  const artworkConnectionFields = await getFieldsForTypeFromSchema(
    "ViewingRoom",
    mergedSchema
  )

  expect(artworkConnectionFields).toContain("artworksConnection")
})

it("resolves the artworks field on ViewingRoom as a paginated list", async () => {
  const { resolvers } = await getGravityStitchedSchema()
  const artworksResolver = resolvers.ViewingRoom.artworksConnection.resolve

  const artworks = await artworksResolver(
    { artworkIDs: ["1", "2", "3"] },
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
  expect(artworks.totalCount).toBe(3)
})
