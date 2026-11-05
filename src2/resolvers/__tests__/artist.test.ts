import { graphql } from "graphql"
import { schema } from "../../schema"

const run = (source: string, artistLoader: jest.Mock) =>
  graphql({ schema, source, contextValue: { artistLoader } })

const gravityArtist = {
  _id: "4d8b92b34eb68a1b2c0003f4",
  id: "andy-warhol",
  name: "Andy Warhol",
  display_name: "Warhol",
  alternate_names: ["Andrew Warhola"],
  disable_price_context: true,
  birthday: "1928",
  deathday: "1987",
}

describe("Query.artist", () => {
  it("maps Gravity fields onto the Artist type", async () => {
    const artistLoader = jest.fn().mockResolvedValue(gravityArtist)

    const { data, errors } = await run(
      `{
        artist(id: "andy-warhol") {
          id
          internalID
          slug
          alternateNames
          birthday
          deathday
          disablePriceContext
          displayLabel
          displayName
        }
      }`,
      artistLoader
    )

    expect(errors).toBeUndefined()
    expect(artistLoader).toHaveBeenCalledWith("andy-warhol")
    expect(data!.artist).toEqual({
      id: Buffer.from(`Artist:${gravityArtist._id}`).toString("base64"),
      internalID: "4d8b92b34eb68a1b2c0003f4",
      slug: "andy-warhol",
      alternateNames: ["Andrew Warhola"],
      birthday: "1928",
      deathday: "1987",
      disablePriceContext: true,
      displayLabel: "Andy Warhol",
      displayName: "Warhol",
    })
  })

  it("returns null without calling Gravity for an empty id", async () => {
    const artistLoader = jest.fn()

    const { data } = await run(`{ artist(id: "") { slug } }`, artistLoader)

    expect(data!.artist).toBeNull()
    expect(artistLoader).not.toHaveBeenCalled()
  })
})
