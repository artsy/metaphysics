// @ts-check

import _ from "lodash"
import Image from "schema/image"
import { error } from "lib/loggers"
import { GraphQLObjectType, GraphQLList } from "graphql"

const ArtistCarouselType = new GraphQLObjectType({
  name: "ArtistCarousel",
  fields: {
    images: {
      type: new GraphQLList(Image.type),
      resolve: Image.resolve,
    },
  },
})

const ArtistCarousel = {
  type: ArtistCarouselType,
  resolve: ({ id }, _options, _request, resolver) => {
    const {
      artistArtworksLoader,
      partnerShowImagesLoader,
      relatedShowsLoader,
    } = resolver.rootValue

    return Promise.all([
      relatedShowsLoader({
        artist_id: id,
        sort: "-end_at",
        displayable: true,
        solo_show: true,
        top_tier: true,
      }),
      artistArtworksLoader(id, {
        size: 7,
        sort: "-iconicity",
        published: true,
      }),
    ])
      .then(([{ body: shows }, artworks]) => {
        const elligibleShows = shows.filter(show => show.images_count > 0)
        return Promise.all(
          elligibleShows.map(show =>
            partnerShowImagesLoader(show.id, { size: 1 })
          )
        )
          .then(showImages => {
            return _.zip(elligibleShows, showImages).map(([show, images]) => {
              return _.assign(
                { href: `/show/${show.id}`, title: show.name },
                _.first(images)
              )
            })
          })
          .then(showsWithImages => {
            return showsWithImages.concat(
              artworks.map(artwork => {
                return _.assign(
                  { href: `/artwork/${artwork.id}`, title: artwork.title },
                  _.first(artwork.images)
                )
              })
            )
          })
      })
      .catch(error)
  },
}

export default ArtistCarousel
