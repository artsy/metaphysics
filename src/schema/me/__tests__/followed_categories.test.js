/* eslint-disable promise/always-return */
import { resolve } from "path"
import { readFileSync } from "fs"
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"

it("returns artworks for a collection", () => {
  const genesPath = resolve(
    "src",
    "test",
    "fixtures",
    "gravity",
    "follow_genes.json"
  )
  const genes = JSON.parse(readFileSync(genesPath, "utf8"))

  const followedGenesLoader = sinon
    .stub()
    .withArgs("me/follow/genes", { size: 10, offset: 0, total_count: true })
    .returns(Promise.resolve({ body: genes, headers: { "x-total-count": 10 } }))

  const query = gql`
    {
      me {
        followed_genes(first: 10) {
          edges {
            node {
              gene {
                name
                id
              }
            }
          }
        }
      }
    }
  `
  return runAuthenticatedQuery(query, { followedGenesLoader }).then(data => {
    expect(data).toMatchSnapshot()
  })
})
