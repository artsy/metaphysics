import { extractEmbed } from "../lib/extractEmbed"

describe("extractEmbed", () => {
  it("extracts a vimeo embed", () => {
    expect(extractEmbed("https://vimeo.com/143024721")).toEqual(
      '<iframe src="https://player.vimeo.com/video/143024721?" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
    )
  })

  it("extracts a vimeo embed (2)", () => {
    expect(extractEmbed("https://www.vimeo.com/143024721?foo=bar")).toEqual(
      '<iframe src="https://player.vimeo.com/video/143024721?" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
    )
  })

  it("extracts a youtube embed", () => {
    expect(extractEmbed("https://www.youtube.com/watch?v=QWtsV50_-p4")).toEqual(
      '<iframe src="https://www.youtube.com/embed/QWtsV50_-p4?title=0&portrait=0&badge=0&byline=0&showinfo=0&rel=0&controls=2&modestbranding=1&iv_load_policy=3&color=E5E5E5" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
    )
  })

  it("extracts a youtube embed (2)", () => {
    expect(
      extractEmbed("https://youtube.com/watch?v=QWtsV50_-p4&foo=bar")
    ).toEqual(
      '<iframe src="https://www.youtube.com/embed/QWtsV50_-p4?title=0&portrait=0&badge=0&byline=0&showinfo=0&rel=0&controls=2&modestbranding=1&iv_load_policy=3&color=E5E5E5" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
    )
  })

  it("extracts a youtube embed (3)", () => {
    expect(extractEmbed("https://youtu.be/QWtsV50_-p4")).toEqual(
      '<iframe src="https://www.youtube.com/embed/QWtsV50_-p4?title=0&portrait=0&badge=0&byline=0&showinfo=0&rel=0&controls=2&modestbranding=1&iv_load_policy=3&color=E5E5E5" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
    )
  })

  it("adds the autoplay param", () => {
    expect(
      extractEmbed("https://www.youtube.com/watch?v=QWtsV50_-p4", {
        autolay: 1,
      })
    ).toEqual(
      '<iframe src="https://www.youtube.com/embed/QWtsV50_-p4?title=0&portrait=0&badge=0&byline=0&showinfo=0&rel=0&controls=2&modestbranding=1&iv_load_policy=3&color=E5E5E5&autolay=1" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
    )
  })
})
