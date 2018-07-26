/* eslint-disable promise/always-return */
import { totalViaLoader } from "lib/total"

describe("total", () => {
  const loader = jest
    .fn()
    .mockReturnValue(Promise.resolve({ headers: { "x-total-count": "50" } }))
  it("loads the path and passes in the token", () => {
    return totalViaLoader(loader, {}, { size: 10, extra_option: 1 }).then(
      total => {
        expect(loader.mock.calls[0][0].size).toBe(0)
        expect(loader.mock.calls[0][0].total_count).toBe(true)
        expect(loader.mock.calls[0][0].extra_option).toBe(1)
        expect(total).toBe(50)
      }
    )
  })
})
