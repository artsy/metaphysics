import {
  artworkToSubmissionCategory,
  artworkToSubmissionMapping,
} from "lib/artworkToSubmissionMapping"

describe("artworkToSubmissionMapping", () => {
  it("doesn't fail with empty artwork", () => {
    const artwork = {}
    const submission = artworkToSubmissionMapping(artwork)

    expect(submission).toEqual({})
  })

  it("correctly maps artwork to submission", () => {
    const artwork = {
      artist: { id: "artist-id" },
      title: "Artwork Title",
      dates: ["2020"],
      medium: "Medium",
      category: "Photography",
      attribution_class: "Attribution Class",
      edition_sets: [{ available_editions: [1], edition_size: "2" }],
      height: "10",
      width: "10",
      depth: "10",
      metric: "in",
      provenance: "Provenance",
      collector_location: {
        city: "City",
        country: "Country",
        state: "State",
        countryCode: "US",
        postalCode: "10001",
      },
    }

    const submission = artworkToSubmissionMapping(artwork)

    expect(submission).toEqual({
      artistID: "artist-id",
      title: "Artwork Title",
      year: "2020",
      medium: "Medium",
      category: "PHOTOGRAPHY",
      attributionClass: "ATTRIBUTION_CLASS",
      editionNumber: 1,
      editionSize: 2,
      height: "10",
      width: "10",
      depth: "10",
      dimensionsMetric: "in",
      provenance: "Provenance",
      locationCity: "City",
      locationCountry: "Country",
      locationState: "State",
      locationCountryCode: "US",
      locationPostalCode: "10001",
    })
  })
})

describe("artworkToSubmissionCategory", () => {
  it("correctly maps artwork category to submission category", () => {
    expect(artworkToSubmissionCategory("Architecture")).toEqual("ARCHITECTURE")
    expect(artworkToSubmissionCategory("Design/Decorative Art")).toEqual(
      "DESIGN_DECORATIVE_ART"
    )
    expect(
      artworkToSubmissionCategory("Drawing, Collage or other Work on Paper")
    ).toEqual("DRAWING_COLLAGE_OR_OTHER_WORK_ON_PAPER")
    expect(
      artworkToSubmissionCategory("Fashion Design and Wearable Art")
    ).toEqual("FASHION_DESIGN_AND_WEARABLE_ART")
    expect(artworkToSubmissionCategory("Installation")).toEqual("INSTALLATION")
    expect(artworkToSubmissionCategory("Jewelry")).toEqual("JEWELRY")
    expect(artworkToSubmissionCategory("Mixed Media")).toEqual("MIXED_MEDIA")
    expect(artworkToSubmissionCategory("Painting")).toEqual("PAINTING")
    expect(artworkToSubmissionCategory("Performance Art")).toEqual(
      "PERFORMANCE_ART"
    )
    expect(artworkToSubmissionCategory("Photography")).toEqual("PHOTOGRAPHY")
    expect(artworkToSubmissionCategory("Print")).toEqual("PRINT")
    expect(artworkToSubmissionCategory("Sculpture")).toEqual("SCULPTURE")
    expect(artworkToSubmissionCategory("Textile Arts")).toEqual("TEXTILE_ARTS")
    expect(artworkToSubmissionCategory("Video/Film/Animation")).toEqual(
      "VIDEO_FILM_ANIMATION"
    )
    expect(artworkToSubmissionCategory("Posters")).toEqual("OTHER")
  })
})
