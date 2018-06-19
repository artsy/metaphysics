/* eslint-disable promise/always-return */
import { allViaLoader } from "lib/all"

describe("all", () => {
  it("fans out all the requests", () => {
    const loader = jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          headers: { "x-total-count": 22 },
        })
      )
      .mockReturnValue(Promise.resolve({}))

    return allViaLoader(loader, {}, { size: 10 }).then(artworks => {
      expect(artworks.length).toBe(3) // 3 pages of 10 each to get 22 works

      // Initial count fetch
      expect(loader.mock.calls[0].slice(-1)[0].size).toBe(0)
      expect(loader.mock.calls[0].slice(-1)[0].page).toBe(1)
      expect(loader.mock.calls[0].slice(-1)[0].total_count).toBe(true)
      expect(loader.mock.calls[1].slice(-1)[0].page).toBe(1)
      expect(loader.mock.calls[2].slice(-1)[0].page).toBe(2)
      expect(loader.mock.calls[3].slice(-1)[0].page).toBe(3)
    })
  })
})
