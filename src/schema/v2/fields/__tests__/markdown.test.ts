import { formatMarkdownValue, markdown } from "../markdown"

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
