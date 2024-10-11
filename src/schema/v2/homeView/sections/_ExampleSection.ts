import { ContextModule, OwnerType } from "@artsy/cohesion"
import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { filterArtworksConnectionWithParams } from "schema/v2/filterArtworksConnection"

/*
 * A section in the home view is specified declaratively
 * as a plain object of type HomeViewSection.
 *
 * Below we will configure its various attributes and behaviors.
 */
export const ExampleSection: HomeViewSection = {
  /*
   * An unique identifier for the section.
   *
   * This is used to identify the section in the UI and in analytics,
   * as well as to request it individually via Metaphysics, e.g.
   *
   * ```graphql
   * query {
   *   homeView {
   *     section(id: "home-view-section-example") {
   *       internalID
   *       # etc
   *     }
   *   }
   * }
   * ```
   */
  id: "home-view-section-example",

  /**
   * (optional) The id of an Unleash feature flag that controls
   * the rollout of this section.
   *
   * Pardon the fake id below, it's just an example.
   * A real id would be defined in lib/featureFlags.ts
   *
   */
  // @ts-expect-error - not a real flag ID
  featureFlag: "onyx_enable-home-view-section-example",

  /*
   * An analytics label to describe this section.
   *
   * This is assumed to already exist in @artsy/cohesion's
   * ContextModule enum. (You can omit this attribute until
   * Cohesion actually contains the desired value.)
   *
   * A real value would be something like:
   *
   * contextModule: ContextModule.recommendedArtistsRail
   * -or-
   * contextModule: ContextModule.featuredCollectionsRail
   * etc…
   */
  // @ts-expect-error - not a real context module
  contextModule: ContextModule.example,

  /*
   * An analytics label to describe the expanded (view-all)
   * presentation of this section's data.
   *
   * (If the section handles view-all by hard navigating to a separate route,
   * then this label does not apply -- see `behaviors.viewAll.ownerType` below.)
   *
   * This is assumed to already exist in @artsy/cohesion's
   * OwnerType enum. (You can omit this attribute until
   * Cohesion actually contains the desired value.)
   *
   * A real value would be something like:
   *
   * ownerType: OwnerType.artists
   * -or-
   * ownerType: OwnerType.artworkRecommendations
   * etc…
   */
  // @ts-expect-error - not a real owner type
  ownerType: OwnerType.example,

  /*
   * An individual section instance, such as the one being defined here,
   * can be handled by clients in a predictable way, so long as the client
   * knows what *type* of section it is: a collection of artworks, or artists,
   * or whatever the case maybe.
   *
   * Here is where you specify that section type:
   *
   * type: HomeViewSectionTypeNames.HomeViewSectionArtworks
   * -or-
   * type: HomeViewSectionTypeNames.HomeViewSectionArtists
   * -or-
   * type: HomeViewSectionTypeNames.HomeViewSectionShows
   * etc…
   *
   */
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,

  /*
   * Customizations or overrides for the client side component used to
   * render the section.
   */
  component: {
    /*
     * If the default component for this type of section is not sufficient,
     * you can specify a custom client-side component to use instead.
     *
     * In other words, a section of type `HomeViewSectionArtworks`
     * will be handled in Eigen by its similarly named built-in
     * `HomeViewSectionArtworks` component.
     *
     * This allows us to roll out a new home view section containing
     * a new bundle of artworks at any time, with the expectation that it
     * will be rendered in a reasonable way.
     *
     * But that default rendering style may not be always be sufficient,
     * depending on the specific needs or design of the section. In such a case
     * we can specify a custom component to use instead. If it exists on the
     * client it will be used; if not (consider the case of old Eigen versions),
     * the default component would be used instead.
     */
    type: "FeaturedCollection", // a (real) example of a specialized artworks section component

    /*
     * A display title for the secction.
     *
     * This will usually be a simple string scalar. But in the event that this needs
     * to be fetched from upstream, it can also be a function that resolves to a string.
     */
    title: "My Example Section",

    /*
    // async version that can fetch this value from upstream
    title: async (context: ResolverContext) => {
      const { app_title } = await context.siteHeroUnitLoader(
        "curators-picks-emerging-app"
      )
      return app_title
    },
    */

    /*
     * A descriptive text or blurb that is secondary to the main display title.
     *
     * This is not currently used by the standard section components in Eigen but
     * can be supplied for custom components.
     *
     * This will usually be a simple string scalar. But in the event that this needs
     * to be fetched from upstream, it can also be a function that resolves to a string.
     */
    description: "My example section's blurb",

    /*
    // async version that can fetch this value from upstream
    description: async (context: ResolverContext) => {
      const { app_description } = await context.siteHeroUnitLoader(
        "curators-picks-emerging-app"
      )
      return app_description
    },
    */

    /*
     * A background image for customizing the appearance of the section.
     *
     * This is not currently used by the standard section components in Eigen but
     * can be supplied for custom components.
     *
     * This will usually be a simple string scalar. But in the event that this needs
     * to be fetched from upstream, it can also be a function that resolves to a string.
     */
    backgroundImageURL: "https://example.com/image.jpg",

    /*
    // async version that can fetch this value from upstream
    backgroundImageURL: async (context: ResolverContext, args) => {
      const {
        background_image_app_phone_url,
        background_image_app_tablet_url,
      } = await context.siteHeroUnitLoader("curators-picks-emerging-app")

      if (args.version === "wide") {
        return background_image_app_tablet_url
      }

      return background_image_app_phone_url
    },
    */

    /*
     * A specification for the component’s behaviors.
     */
    behaviors: {
      /*
       * How should the "View All" button behave?
       */
      viewAll: {
        /*
         * The URL to navigate to when the "View All" button is pressed.
         *
         * If `viewAll` is specified, but `viewAll.href` is not, then the
         * component will present the items in an expanded view, rather than
         * navigating to a separate route.
         */
        href: "/collection/curators-picks-emerging",

        /*
         * The text to display on the "View All" button.
         */
        buttonText: "Browse All Artworks",

        /*
         * An analytics label for the requested destination route.
         *
         * Pardon the fake value below, it's just an example.
         * A real value would be something like:
         *
         * ownerType: OwnerType.artists
         * -or-
         * ownerType: OwnerType.artworkRecommendations
         */
        // @ts-expect-error - not a real owner type
        ownerType: OwnerType.example,
      },
    },
  },

  /*
   * Whether the user must be authenticated in order to view this section.
   * (A non-issue in Eigen, this anticipates future usage on web.)
   */
  requiresAuthentication: false,

  /*
   * Arbitrary logic to determine whether this section should be displayed.
   *
   * Intended for considering any logic beyond the standard checks
   * that have already been declared above (featureFlag, requiresAuthentication)
   */
  shouldBeDisplayed: (_context: ResolverContext) => true,

  /*
   * The resolver method that knows how to fetch the data for this section.
   *
   * Has the same signature as a typical Metaphysics resolver.
   *
   * (And, in many cases where we migrated legacy sections, even imports
   * and makes use of existing resolvers.)
   *
   * Note that it is wrapped in a helper function that adds a timeout
   * to the resolver, and throws if the timeout is exceeded.
   */
  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const loader = filterArtworksConnectionWithParams((_args) => {
      return {
        marketing_collection_id: "curators-picks-emerging",
        sort: "-decayed_merch",
      }
    })

    if (!loader?.resolve) {
      return
    }

    const result = await loader.resolve(parent, args, context, info)

    return result
  }),
}
