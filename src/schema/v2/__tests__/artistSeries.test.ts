import { runQuery } from "schema/v2/test/utils"

describe("ArtistSeries type", () => {
  it("fetches an artist series by ID", async () => {
    const query = `
      {
        artistSeries(id: "pumpkins") {
          internalID
          slug
          title
          artists {
            internalID
            name
          }
          description
          descriptionFormatted
          published
          featured
          representativeArtworkID
          forSaleArtworksCount
        }
      }
    `

    const context = {
      artistSeriesLoader: () => {
        return Promise.resolve({
          _id: "pumpkins-id",
          id: "pumpkins",
          title: "Pumpkins",
          artist_ids: ["pumpkin-artist"],
          description: "A series of pumpkins",
          published: true,
          featured: true,
          representative_artwork_id: "pumpkin-artwork",
          for_sale_artworks_count: 1,
        })
      },
      artistsLoader: () => {
        return Promise.resolve({
          headers: {},
          body: [
            {
              _id: "pumpkin-artist",
              name: "Pumpkin Artist",
            },
          ],
        })
      },
    }

    const { artistSeries } = await runQuery(query, context)

    expect(artistSeries).toEqual({
      internalID: "pumpkins-id",
      slug: "pumpkins",
      title: "Pumpkins",
      artists: [{ internalID: "pumpkin-artist", name: "Pumpkin Artist" }],
      description: "A series of pumpkins",
      descriptionFormatted: "A series of pumpkins",
      published: true,
      featured: true,
      representativeArtworkID: "pumpkin-artwork",
      forSaleArtworksCount: 1,
    })
  })

  it("fetches a connection of artist series", async () => {
    const query = `
      {
        artistSeriesConnection(first: 10) {
          edges {
            node {
              internalID
              slug
              title
              artists {
                internalID
                name
              }
              description
              descriptionFormatted
              published
              featured
              representativeArtworkID
              forSaleArtworksCount
            }
          }
        }
      }
    `

    const context = {
      artistSeriesListLoader: () => {
        return Promise.resolve({
          body: [
            {
              _id: "pumpkins-id",
              id: "pumpkins",
              title: "Pumpkins",
              artist_ids: ["pumpkin-artist"],
              description: "A series of pumpkins",
              published: true,
              featured: true,
              representative_artwork_id: "pumpkin-artwork",
              for_sale_artworks_count: 1,
            },
          ],
          headers: { "x-total-count": 1 } as any,
        })
      },
      artistsLoader: () => {
        return Promise.resolve({
          headers: {},
          body: [
            {
              _id: "pumpkin-artist",
              name: "Pumpkin Artist",
            },
          ],
        })
      },
    }

    const { artistSeriesConnection } = await runQuery(query, context)

    expect(artistSeriesConnection).toEqual({
      edges: [
        {
          node: {
            internalID: "pumpkins-id",
            slug: "pumpkins",
            title: "Pumpkins",
            artists: [{ internalID: "pumpkin-artist", name: "Pumpkin Artist" }],
            description: "A series of pumpkins",
            descriptionFormatted: "A series of pumpkins",
            published: true,
            featured: true,
            representativeArtworkID: "pumpkin-artwork",
            forSaleArtworksCount: 1,
          },
        },
      ],
    })
  })
})
