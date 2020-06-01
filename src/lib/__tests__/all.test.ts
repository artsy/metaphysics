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

    return allViaLoader(loader, { params: { size: 10 } }).then((artworks) => {
      expect(artworks.length).toBe(3) // 3 pages of 10 each to get 22 works

      // FIXME: The /shows endpoint does not return a count with size=0
      // expect(loader.mock.calls[0][0].size).toBe(0)
      expect(loader.mock.calls[0][0].page).toBe(1)
      expect(loader.mock.calls[0][0].total_count).toBe(true)
      expect(loader.mock.calls[1][0].page).toBe(1)
      expect(loader.mock.calls[2][0].page).toBe(2)
      expect(loader.mock.calls[3][0].page).toBe(3)
    })
  })
})
