import { validate, Source, parse } from "graphql"
import { canonicalResourceDirectiveValidation } from "../canonicalResourceDirectiveValidation"

const schema = require("schema/v1").default

const queryToAst = query => parse(new Source(query))

describe(canonicalResourceDirectiveValidation, () => {
  it("errors when used more than once", () => {
    const query = `
      {
        artwork(id: "test") @canonicalResource {
          id @canonicalResource
        }
      }
    `

    const errors = validate(schema, queryToAst(query), [
      canonicalResourceDirectiveValidation,
    ])

    expect(errors[0].message).toContain(
      "Can only use `@canonicalResource` once"
    )
  })

  it("doesn't error when used once", () => {
    const query = `
      {
        artwork(id: "test") @canonicalResource {
          id
        }
      }
    `

    const errors = validate(schema, queryToAst(query), [
      canonicalResourceDirectiveValidation,
    ])

    expect(errors.length).toBeFalsy()
  })
})
