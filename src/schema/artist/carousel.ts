import _ from "lodash"
import Image from "schema/image"
import { error } from "lib/loggers"
import { GraphQLObjectType, GraphQLList } from "graphql"
import { GravityArtwork } from "types/gravity/artworkResponse"

const ArtistCarouselType = new GraphQLObjectType<ResolverContext>({
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
        size: 10, // we only show a max of 7 though, a hotfix for AS-285
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
            return _.zip(elligibleShows, showImages).map(
              ([show, images]: any) => {
                return _.assign(
                  { href: `/show/${show.id}`, title: show.name },
                  _.find(images, i => i.is_default)
                )
              }
            )
          })
          .then(showsWithImages => {
            return showsWithImages.concat(
              removeReproductionsFromArtworks(artworks)
                .slice(0, 6) // Always return the top 7 artworks
                .map(artwork => {
                  return _.assign(
                    { href: `/artwork/${artwork.id}`, title: artwork.title },
                    _.find(artwork.images, i => i.is_default)
                  )
                })
            )
          })
      })
      .catch(error)
  },
}

export const removeReproductionsFromArtworks = (artworks: GravityArtwork[]) => {
  return artworks.filter(a => {
    // Considering it's likely that we've not covered most artworks
    // with attribution metadata, I'd prefer to be conservative and
    // let works without attribution class on the banner
    if (!a.attribution_class) {
      return true
    }

    // Only return unique or limited edition works as these are what we
    // want to highlight. This gives gallery reps the ability to correctly
    // set attribution classes on works which shouldn't be in the carousel
    return (
      a.attribution_class === "unique" ||
      a.attribution_class === "limited edition"
    )
  })
}

export default ArtistCarousel
