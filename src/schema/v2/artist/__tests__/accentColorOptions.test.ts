import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("Artist accentColorOptions", () => {
  const query = `
    {
      artist(id: "heidi-lau") {
        accentColorOptions {
          hex
          textColor
        }
      }
    }
  `

  const artistLoader = jest.fn().mockResolvedValue({ id: "heidi-lau" })

  it("returns each option with the text color that contrasts more", async () => {
    const artistAccentColorOptionsLoader = jest
      .fn()
      .mockResolvedValue(["#f5e6a8", "#1a1a2e", "#808080"])

    const data = await runAuthenticatedQuery(query, {
      artistLoader,
      artistAccentColorOptionsLoader,
    })

    expect(data.artist.accentColorOptions).toEqual([
      { hex: "#f5e6a8", textColor: "BLACK" },
      { hex: "#1a1a2e", textColor: "WHITE" },
      { hex: "#808080", textColor: "BLACK" },
    ])
    expect(artistAccentColorOptionsLoader).toHaveBeenCalledWith({
      artist_id: "heidi-lau",
    })
  })

  it("returns an empty list when the artist has no color data", async () => {
    const data = await runAuthenticatedQuery(query, {
      artistLoader,
      artistAccentColorOptionsLoader: jest.fn().mockResolvedValue([]),
    })

    expect(data.artist.accentColorOptions).toEqual([])
  })

  it("drops a value that isn't a color", async () => {
    const data = await runAuthenticatedQuery(query, {
      artistLoader,
      artistAccentColorOptionsLoader: jest
        .fn()
        .mockResolvedValue(["#ffffff", "oops"]),
    })

    expect(data.artist.accentColorOptions).toEqual([
      { hex: "#ffffff", textColor: "BLACK" },
    ])
  })

  it("errors when signed out", async () => {
    await expect(runQuery(query, { artistLoader })).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("errors under a list of artists without calling Gravity", async () => {
    const artistAccentColorOptionsLoader = jest.fn()

    await expect(
      runAuthenticatedQuery(
        `{
          artistsConnection(first: 1) {
            edges {
              node {
                accentColorOptions {
                  hex
                }
              }
            }
          }
        }`,
        {
          artistsLoader: jest.fn().mockResolvedValue({
            body: [{ id: "heidi-lau" }],
            headers: { "x-total-count": "1" },
          }),
          artistAccentColorOptionsLoader,
        }
      )
    ).rejects.toThrow("cannot be queried under a list or connection")
    expect(artistAccentColorOptionsLoader).not.toHaveBeenCalled()
  })
})
