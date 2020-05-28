import { validate, Source, parse } from "graphql"
import { principalFieldDirectiveValidation } from "../principalFieldDirectiveValidation"

const schema = require("schema/v1").default

const queryToAst = (query) => parse(new Source(query))

describe(principalFieldDirectiveValidation, () => {
  it("errors when used more than once", () => {
    const query = `
      {
        artwork(id: "test") @principalField {
          id @principalField
        }
      }
    `

    const errors = validate(schema, queryToAst(query), [
      principalFieldDirectiveValidation,
    ])

    expect(errors[0].message).toContain("Can only use `@principalField` once")
  })

  it("doesn't error when used once", () => {
    const query = `
      {
        artwork(id: "test") @principalField {
          id
        }
      }
    `

    const errors = validate(schema, queryToAst(query), [
      principalFieldDirectiveValidation,
    ])

    expect(errors.length).toBeFalsy()
  })
})
