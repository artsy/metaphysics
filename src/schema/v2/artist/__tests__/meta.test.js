import { metaTitle } from "../meta"

describe("Artist Meta title tag", () => {
  const artist = {
    id: "claes-oldenburg",
    name: "Claes Oldenburg",
    published_artworks_count: 1,
    " $refType": null,
  }

  it("Returns a control group title tag ending in ' Artworks, Bio & Shows on Artsy'", () => {
    const titleTag = metaTitle(artist)
    expect(titleTag).toEqual(
      "Claes Oldenburg - 1 Artworks, Bio & Shows on Artsy"
    )
  })

  it("Returns a test group title tag ending in '- Art, Bio, Insights - Artsy'", () => {
    artist.id = "uri-aran"
    artist.name = "Uri Aran"
    const titleTag = metaTitle(artist)

    expect(titleTag).toEqual("Uri Aran - Art, Bio, Insights - Artsy")
  })

  it("Returns a test group title tag ending in '- For Sale on Artsy'", () => {
    artist.id = "jesus-bautista-moroles"
    artist.name = "Jesus Bautista Moroles"
    const titleTag = metaTitle(artist)

    expect(titleTag).toEqual("Jesus Bautista Moroles - For Sale on Artsy")
  })
})
