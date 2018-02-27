import { allViaLoader } from "lib/all"

describe("all", () => {
  it("fans out all the requests", () => {
    const loader = jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          headers: { "x-total-count": 42 },
        })
      )
      .mockReturnValue(Promise.resolve({}))

    return allViaLoader(loader, {}, { size: 10 }).then(artworks => {
      expect(artworks.length).toBe(5) // 5 pages fo 10 each to get 42 works
    })
  })
})
