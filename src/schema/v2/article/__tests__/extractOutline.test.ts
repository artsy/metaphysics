import { extractOutline } from "../lib/extractOutline"

describe("extractOutline", () => {
  it("extracts h2 headings from text sections", () => {
    const sections = [
      {
        type: "text",
        body: '<h2>"Containing Multitudes"</h2><p>Some text</p>',
      },
      { type: "text", body: "<p>No headings here</p>" },
      {
        type: "text",
        body: "<h2>Ties of Our Common Kindred</h2><h3>Subtitle</h3>",
      },
    ]

    expect(extractOutline(sections)).toEqual([
      {
        id: "containing-multitudes",
        heading: '"Containing Multitudes"',
        slug: "containing-multitudes",
      },
      {
        id: "ties-of-our-common-kindred",
        heading: "Ties of Our Common Kindred",
        slug: "ties-of-our-common-kindred",
      },
    ])
  })

  it("preserves order across mixed section types", () => {
    const sections = [
      { type: "image_collection" },
      { type: "text", body: "<h2>First Heading</h2>" },
      { type: "image_collection" },
      { type: "text", body: "<h2>Second Heading</h2>" },
      { type: "video" },
      { type: "text", body: "<h2>Third Heading</h2>" },
    ]

    const result = extractOutline(sections)

    expect(result.map((e) => e.heading)).toEqual([
      "First Heading",
      "Second Heading",
      "Third Heading",
    ])
  })

  it("generates unique slugs for duplicate headings", () => {
    const sections = [
      { type: "text", body: "<h2>Overview</h2>" },
      { type: "text", body: "<h2>Overview</h2>" },
      { type: "text", body: "<h2>Overview</h2>" },
    ]

    expect(extractOutline(sections)).toEqual([
      { id: "overview", heading: "Overview", slug: "overview" },
      { id: "overview-2", heading: "Overview", slug: "overview-2" },
      { id: "overview-3", heading: "Overview", slug: "overview-3" },
    ])
  })

  it("returns an empty array when there are no h2 tags", () => {
    const sections = [
      { type: "text", body: "<h3>Not an h2</h3><p>Just text</p>" },
      { type: "image_collection" },
    ]

    expect(extractOutline(sections)).toEqual([])
  })

  it("returns an empty array when sections is undefined", () => {
    expect(extractOutline(undefined)).toEqual([])
  })

  it("returns an empty array when sections is empty", () => {
    expect(extractOutline([])).toEqual([])
  })

  it("strips HTML tags and entities from heading text", () => {
    const sections = [
      {
        type: "text",
        body:
          '<h2><a href="https://example.com">Titus Kaphar</a> and <a href="#">Junius Brutus Stearns</a></h2>',
      },
    ]

    expect(extractOutline(sections)).toEqual([
      {
        id: "titus-kaphar-and-junius-brutus-stearns",
        heading: "Titus Kaphar and Junius Brutus Stearns",
        slug: "titus-kaphar-and-junius-brutus-stearns",
      },
    ])
  })

  it("handles multiple h2 tags within a single text section", () => {
    const sections = [
      {
        type: "text",
        body: "<h2>Part One</h2><p>Text</p><h2>Part Two</h2><p>More text</p>",
      },
    ]

    expect(extractOutline(sections)).toEqual([
      { id: "part-one", heading: "Part One", slug: "part-one" },
      { id: "part-two", heading: "Part Two", slug: "part-two" },
    ])
  })

  it("skips headings that are empty after stripping", () => {
    const sections = [
      { type: "text", body: "<h2>   </h2><h2>Real Heading</h2>" },
    ]

    expect(extractOutline(sections)).toEqual([
      { id: "real-heading", heading: "Real Heading", slug: "real-heading" },
    ])
  })

  it("handles HTML entities in headings", () => {
    const sections = [{ type: "text", body: "<h2>Art &amp; Design</h2>" }]

    expect(extractOutline(sections)).toEqual([
      { id: "art-design", heading: "Art & Design", slug: "art-design" },
    ])
  })

  it("guards against null section entries", () => {
    const sections = [
      null,
      { type: "text", body: "<h2>Safe Heading</h2>" },
      undefined,
    ]

    expect(extractOutline(sections)).toEqual([
      { id: "safe-heading", heading: "Safe Heading", slug: "safe-heading" },
    ])
  })

  it("falls back to numeric slugs when heading cannot be slugified", () => {
    const sections = [{ type: "text", body: "<h2>你好</h2><h2>世界</h2>" }]

    expect(extractOutline(sections)).toEqual([
      { id: "1", heading: "你好", slug: "1" },
      { id: "2", heading: "世界", slug: "2" },
    ])
  })
})
