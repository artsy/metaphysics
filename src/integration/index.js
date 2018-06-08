/* eslint-disable promise/always-return */
import { keys, isUndefined } from "lodash"
import request from "request"
import deepEqual from "deep-equal"
import config from "config"

const { METAPHYSICS_STAGING_ENDPOINT, METAPHYSICS_PRODUCTION_ENDPOINT } = config

const get = (url, options) => {
  return new Promise((resolve, reject) =>
    request(url, options, (err, response) => {
      if (err) return reject(err)
      resolve(JSON.parse(response.body))
    })
  )
}

const metaphysics = endpoint => (query, vars = {}) => {
  const variables = JSON.stringify(vars)
  return get(endpoint, { method: "GET", qs: { query, variables } })
}

const staging = metaphysics(METAPHYSICS_STAGING_ENDPOINT)
const production = metaphysics(METAPHYSICS_PRODUCTION_ENDPOINT)

describe("Integration specs", () => {
  xdescribe("/artwork", () => {
    const query = `
      query artwork($id: String!) {
        artwork(id: $id) {
          ... banner
          ... images
          ... actions
          ... metadata
        }
      }
      fragment banner on Artwork {
        banner: related {
          __typename
          ... on RelatedSale {
            name
            href
            end_at
          }
          ... on RelatedFair {
            name
            href
            profile {
              icon {
                img: resized(width: 80, height: 45, version: "square140") {
                  width
                  height
                  url
                }
              }
            }
          }
        }
      }
      fragment images on Artwork {
        images {
          id
          url(version: "larger")
          placeholder: resized(width: 30, height: 30, version: "small") {
            url
          }
        }
      }
      fragment actions on Artwork {
        is_shareable
        is_hangable
      }
      fragment metadata on Artwork {
        href
        title
        artists {
          id
          name
          href
        }
        medium
        dimensions {
          in
          cm
        }
        is_contactable
        partner {
          name
          href
        }
      }
    `

    it("is in sync with production", () => {
      return Promise.all([
        staging(query, { id: "cindy-sherman-untitled" }),
        production(query, { id: "cindy-sherman-untitled" }),
      ]).then(([stagingResponse, productionResponse]) => {
        deepEqual(stagingResponse, productionResponse).should.be.true()
      })
    })
  })

  describe("/artists", () => {
    const query = `
      {
        featured_artists: ordered_sets(key: "homepage:featured-artists") {
          name
          artists: items {
            ... on FeaturedLinkItem {
              id
              title
              subtitle
              href
              image {
                thumb: cropped(width: 600, height: 500, version: "wide") {
                  width
                  height
                  url
                }
              }
            }
          }
        }
        featured_genes: ordered_sets(key: "artists:featured-genes") {
          name
          genes: items {
            ... on GeneItem {
              id
              name
              href
              trending_artists {
                id
                href
                name
                years
                nationality
                initials
                image {
                  url(version: "four_thirds")
                }
              }
            }
          }
        }
      }
    `

    it("makes the query without error", () => {
      return staging(query).then(({ errors, data }) => {
        isUndefined(errors).should.be.true()
        keys(data).should.eql(["featured_artists", "featured_genes"])
      })
    })
  })
})
