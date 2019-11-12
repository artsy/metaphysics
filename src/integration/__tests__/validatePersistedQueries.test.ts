/**
 * If this test is failing and you want to add an exception just update the
 * knowFailures.json file with the hash of the failing query.
 */

import { validate, parse, Source } from "graphql"
import fs from "fs"
import path from "path"
import knowFailures from "./knownFailures.json"

type PersistedQueryMap = { [hash: string]: string }

const queryMap: PersistedQueryMap = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../data/complete.queryMap.json"),
    "utf8"
  )
)

const schema = require("schema/v2").schema
const queryToAst = query => parse(new Source(query))

Object.entries(queryMap).forEach(([hash, query]) => {
  if (!(hash in knowFailures)) {
    test(`Ensure persisted query ${hash} is valid against current schema`, () => {
      expect(validate(schema, queryToAst(query))).toEqual([])
    })
  }
})
