import {
  enforceInternalHTTPS,
  formatMarkdownValue,
  markdown,
} from "../markdown"

describe("formatMarkdownValue", () => {
  it("formats markdown as html", () => {
    expect(formatMarkdownValue("Here's some *emphasis* !", "html"))
      .toMatchInlineSnapshot(`
      "<p>Here&#39;s some <em>emphasis</em> !</p>
      "
    `)
  })
  it("formats markdown as markdown", () => {
    expect(
      formatMarkdownValue("Here's some *emphasis* !", "markdown")
    ).toMatchInlineSnapshot(`"Here's some *emphasis* !"`)
  })
})

describe("markdown", () => {
  it("resolves markdown as html", () => {
    expect(
      markdown().resolve?.(
        { description: "Here's a **description** with some *emphasis* !" },
        { format: "html" },
        {} as any,
        { fieldName: "description" } as any
      )
    ).toMatchInlineSnapshot(`
      "<p>Here&#39;s a <strong>description</strong> with some <em>emphasis</em> !</p>
      "
    `)
  })

  it("resolves markdown as markdown", () => {
    expect(
      markdown().resolve?.(
        { description: "Here's a **description** with some *emphasis* !" },
        { format: "markdown" },
        {} as any,
        { fieldName: "description" } as any
      )
    ).toMatchInlineSnapshot(`"Here's a **description** with some *emphasis* !"`)
  })

  it("resolves markdown as plain text", () => {
    expect(
      markdown().resolve?.(
        { description: "Here's a **description** with some *emphasis* !" },
        { format: "plain" },
        {} as any,
        { fieldName: "description" } as any
      )
    ).toMatchInlineSnapshot(`"Here's a description with some emphasis !"`)
  })
})

describe("enforceInternalHTTPS", () => {
  it("converts http://artsy.net links to https://www.artsy.net", () => {
    const input =
      "Check out this artwork on http://artsy.net/artwork/andy-warhol-flowers"
    expect(enforceInternalHTTPS(input)).toBe(
      "Check out this artwork on https://www.artsy.net/artwork/andy-warhol-flowers"
    )
  })

  it("converts http://www.artsy.net links to https://www.artsy.net", () => {
    const input =
      "Visit our blog at http://www.artsy.net/blog and our magazine at http://www.artsy.net/magazine"
    expect(enforceInternalHTTPS(input)).toBe(
      "Visit our blog at https://www.artsy.net/blog and our magazine at https://www.artsy.net/magazine"
    )
  })

  it("handles complex art-focused markdown with mixed internal and external links", () => {
    const input = `
Artsy's curatorial highlights include [Liu Ye](http://artsy.net/artist/liu-ye-liu-ye)'s Mondrian-inspired paintings and [Luo Yang](http://www.artsy.net/artwork/5e0a14386a2fb5001127943d)'s photographs. Browse works from [Art Basel](http://artsy.net/art-basel-hong-kong-2020) and [Art Central](http://www.artsy.net/art-central-2020).

For more information visit [our partners](https://www.artpartners.com) or [contact us](http://artsy.net/contact).
    `.trim()

    const expected = `
Artsy's curatorial highlights include [Liu Ye](https://www.artsy.net/artist/liu-ye-liu-ye)'s Mondrian-inspired paintings and [Luo Yang](https://www.artsy.net/artwork/5e0a14386a2fb5001127943d)'s photographs. Browse works from [Art Basel](https://www.artsy.net/art-basel-hong-kong-2020) and [Art Central](https://www.artsy.net/art-central-2020).

For more information visit [our partners](https://www.artpartners.com) or [contact us](https://www.artsy.net/contact).
    `.trim()

    expect(enforceInternalHTTPS(input)).toBe(expected)
  })

  it("leaves other URLs unchanged", () => {
    const input =
      "Check these sites: http://example.com, https://google.com, http://artsy.net/about, https://www.artsy.net/contact"
    expect(enforceInternalHTTPS(input)).toBe(
      "Check these sites: http://example.com, https://google.com, https://www.artsy.net/about, https://www.artsy.net/contact"
    )
  })

  it("handles text without any URLs", () => {
    const input = "This is just a regular text with no URLs in it."
    expect(enforceInternalHTTPS(input)).toBe(input)
  })
})
