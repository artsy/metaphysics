import { validate, parse, Source } from "graphql"
import fs from "fs"
import path from "path"

type PersistedQueryMap = { [hash: string]: string }

const queryMap: PersistedQueryMap = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../data/complete.queryMap.json"),
    "utf8"
  )
)

const schema = require("schema/v1").default
const queryToAst = query => parse(new Source(query))

Object.entries(queryMap).forEach(([hash, query]) => {
  test(`Ensure persisted query ${hash} is valid against current schema`, () => {
    expect(validate(schema, queryToAst(query))).toEqual([])
  })
})
