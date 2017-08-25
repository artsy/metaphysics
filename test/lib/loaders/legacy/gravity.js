import gravityLoader from "lib/loaders/legacy/gravity"
import gravity from "lib/apis/gravity"
jest.mock("lib/apis/gravity")

describe("gravity", () => {
  describe("with authentication", () => {
    it("loads the path and passes in the token and options", () => {
      gravity.mockImplementation(() => Promise.resolve({ body: { ok: true } }))

      return Promise.all([
        gravityLoader.with("xxx")("foo/bar", { ids: ["baz"] }),
        gravityLoader.with("yyy")("foo/bar", { ids: ["baz"] }),
        gravityLoader.with("zzz")("foo/bar", { ids: ["baz"] }),
      ]).then(responses => {
        expect(gravity.mock.calls).toEqual([
          ["foo/bar?ids%5B%5D=baz", "xxx", {}],
          ["foo/bar?ids%5B%5D=baz", "yyy", {}],
          ["foo/bar?ids%5B%5D=baz", "zzz", {}],
        ])
        expect(responses).toEqual([{ ok: true }, { ok: true }, { ok: true }])
      })
    })
  })
})
