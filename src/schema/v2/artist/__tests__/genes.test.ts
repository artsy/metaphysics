import { runQuery } from "schema/v2/test/utils"

describe("Artist genes", () => {
  const artist = { id: "andy-warhol", _id: "4d8b92b34eb68a1b2c0003f4" }
  const artistLoader = () => Promise.resolve(artist)

  const genesResponse = [
    { id: "pop-art", name: "Pop Art" },
    { id: "painting", name: "Painting" },
  ]

  const artistGenesLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(genesResponse))

  const context = { artistLoader, artistGenesLoader }

  beforeEach(() => {
    artistGenesLoader.mockClear()
  })

  it("returns genes without args", async () => {
    const query = `
      {
        artist(id: "andy-warhol") {
          genes {
            slug
          }
        }
      }
    `
    const result = await runQuery(query, context)
    expect(result.artist.genes).toHaveLength(2)
    expect(artistGenesLoader).toHaveBeenCalledWith(artist.id, {})
  })

  it("passes geneFamilyID to the loader", async () => {
    const query = `
      {
        artist(id: "andy-warhol") {
          genes(geneFamilyID: "styles") {
            slug
          }
        }
      }
    `
    await runQuery(query, context)
    expect(artistGenesLoader).toHaveBeenCalledWith(artist.id, {
      gene_family_id: "styles",
    })
  })

  it("passes minValue to the loader", async () => {
    const query = `
      {
        artist(id: "andy-warhol") {
          genes(minValue: 25) {
            slug
          }
        }
      }
    `
    await runQuery(query, context)
    expect(artistGenesLoader).toHaveBeenCalledWith(artist.id, {
      min_value: 25,
    })
  })

  it("passes size to the loader", async () => {
    const query = `
      {
        artist(id: "andy-warhol") {
          genes(size: 1) {
            slug
          }
        }
      }
    `
    await runQuery(query, context)
    expect(artistGenesLoader).toHaveBeenCalledWith(artist.id, {
      size: 1,
    })
  })
})
