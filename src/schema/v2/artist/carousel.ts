import _ from "lodash"
import Image from "schema/v2/image"
import { error } from "lib/loggers"
import { GraphQLObjectType, GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const ArtistCarouselType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistCarousel",
  fields: {
    images: {
      type: new GraphQLList(Image.type),
      resolve: Image.resolve,
    },
  },
})

const ArtistCarousel: GraphQLFieldConfig<{ id: string }, ResolverContext> = {
  type: ArtistCarouselType,
  resolve: (
    { id },
    _args,
    { artistArtworksLoader, partnerShowImagesLoader, relatedShowsLoader }
  ) => {
    return Promise.all([
      relatedShowsLoader({
        artist_id: id,
        sort: "-end_at",
        displayable: true,
        solo_show: true,
        top_tier: true,
      }),
      artistArtworksLoader(id, {
        size: 10,
        sort: "-iconicity",
        published: true,
      }),
    ])
      .then(([{ body: shows }, artworks]) => {
        const elligibleShows = shows.filter((show) => show.images_count > 0)
        return Promise.all(
          elligibleShows.map((show) =>
            partnerShowImagesLoader(show.id, { size: 1 }).then(
              ({ body }) => body
            )
          )
        )
          .then((showImages) => {
            return _.zip(elligibleShows, showImages).map(
              ([show, images]: any) => {
                return _.assign(
                  { href: `/show/${show.id}`, title: show.name },
                  _.find(images, (i) => i.is_default)
                )
              }
            )
          })
          .then((showsWithImages) => {
            return showsWithImages.concat(
              artworks.map((artwork) => {
                return _.assign(
                  { href: `/artwork/${artwork.id}`, title: artwork.title },
                  _.find(artwork.images, (i) => i.is_default)
                )
              })
            )
          })
      })
      .catch(error)
  },
}

export default ArtistCarousel
