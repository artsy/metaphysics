import * as t from "io-ts"
import { cast } from "../cast"

const Example = t.type({
  foo: t.string,
  bar: t.string,
  baz: t.type({
    qux: t.number,
  }),
})

describe("cast", () => {
  it("returns out the decoded value when it is without errors", () => {
    expect(
      cast(Example, { foo: "bar", bar: "baz", baz: { qux: 1 } })
    ).toStrictEqual({
      foo: "bar",
      bar: "baz",
      baz: { qux: 1 },
    })
  })

  it("throws a DeocdeError when unable to decode", () => {
    expect(() =>
      cast(Example, { foo: "bar", bar: "baz", baz: { qux: "1" } })
    ).toThrowError('Error decoding field "baz.qux"')
  })
})
