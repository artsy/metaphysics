/* eslint-disable promise/always-return */
import { resolve } from "path"
import { readFileSync } from "fs"
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"

it("returns artists for a user", () => {
  const artworksPath = resolve(
    "src",
    "test",
    "fixtures",
    "gravity",
    "follow_artists.json"
  )
  const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))

  const followedArtistsLoader = sinon
    .stub()
    .withArgs("me/follow/artists", { size: 10, offset: 0, total_count: true })
    .returns(
      Promise.resolve({ body: artworks, headers: { "x-total-count": 10 } })
    )

  const query = gql`
    {
      me {
        followed_artists_connection(first: 10) {
          edges {
            node {
              artist {
                name
                id
              }
            }
          }
        }
      }
    }
  `
  return runAuthenticatedQuery(query, { followedArtistsLoader }).then(data => {
    expect(data).toMatchSnapshot()
  })
})
