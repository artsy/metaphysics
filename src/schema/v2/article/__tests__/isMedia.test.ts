import { isMedia } from "../lib/isMedia"

describe("isMedia", () => {
  it("returns true for .mp4", () => {
    expect(isMedia("https://www.youtube.com/watch?v=12345")).toBe(false)
    expect(isMedia("https://www.example.com/example.jpg")).toBe(false)
    expect(isMedia("https://www.example.com/foobar/example.mp4")).toBe(true)
  })
})
