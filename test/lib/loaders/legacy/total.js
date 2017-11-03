import gravity from "lib/apis/gravity"
jest.mock("lib/apis/gravity")

import total from "lib/loaders/legacy/total"

describe("total", () => {
  it("loads the path and passes in the token", () => {
    gravity.mockImplementation(() =>
      Promise.resolve({
        headers: {
          "x-total-count": "50",
        },
      })
    )

    return total("foo/bar", { extra_option: 1 }).then(n => {
      expect(gravity).toBeCalledWith("foo/bar?extra_option=1&size=0&total_count=1", undefined)

      expect(n).toBe(50)
    })
  })
})
