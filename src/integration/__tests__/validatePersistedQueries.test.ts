/**
 * If this test is failing and you want to add an exception just update the
 * knownV1Failures.json or knownV2Failures.json file with the hash of the failing query.
 */

import { validate, parse, Source } from "graphql"
import fs from "fs"
import path from "path"
import knownV2Failures from "./__fixtures__/knownV2Failures.json"

/**
 * This set of queries is known to be valid against v1 _and_ v2. They're contained
 * in the knownV1Queries list. This list shouldn't be changed.
 */
const knownOverlap = [
  "82ce08bed0f640d2f4d4c84e4a50e012",
  "cbf4686647f004d150e5f1a608cbe861",
  "35cce10251babf176c3aa1313217b639",
  "3580c0fe3b32d9febb4e67be71192572",
  "9e8a7891114d59f7905a4aa9027e24e0",
  "21d8ec4ea76fb5e8b71f3045b76905a0",
  "0de7f21178b2e07411e95edac6027432",
  "836d7fa217741306a9e462f3d5b78a0f",
  "f2ba9edeb91d96024fedc8203737bb0c",
  "1c5a434bbd025089a619958784349e15",
  "9f0e327258f6f737e6a758fe7819a051",
  "0690e06ee79f5c42829d0b519d4df860",
  "8cfb809712a89b6b6a53dfd23e6bfeb6",
  "8ed72db052cdb49a3f8fbc74df3fcb33",
  "7d9a8d2edf5e67ad757ac629a5251ae0",
  "f00c41abf4aff4738987ff9a680cd41c",
  "2a9481ee99ef977b10d9916f3943a168",
  "55a8c7797e0ad70ce3351836d4745c74",
  "18fe2187f5a732516ea47696a1ef21df",
  "63194f0a6a98703dcf55c36ca801cf39",
]

type PersistedQueryMap = { [hash: string]: string }

const queryMap: PersistedQueryMap = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../data/complete.queryMap.json"),
    "utf8"
  )
)

const schemaV2 = require("schema/v2").schema

const queryToAst = (query) => parse(new Source(query))

const knownFailingForV2 = (hash: string) => hash in knownV2Failures
const inBothV1AndV2 = (hash: string) => knownOverlap.includes(hash)

Object.entries(queryMap).forEach(([hash, query]) => {
  if (!knownFailingForV2(hash) && inBothV1AndV2(hash)) {
    test(`Ensure persisted query ${hash} is valid against v2 schema`, () => {
      const errors = validate(schemaV2, queryToAst(query))
      expect(errors).toEqual([])
    })
  }
})
