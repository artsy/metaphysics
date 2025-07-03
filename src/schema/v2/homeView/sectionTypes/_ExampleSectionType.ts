import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../../artwork"
import { emptyConnection } from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import {
  HomeViewGenericSectionInterface,
  standardSectionFields,
} from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"

/*
 * A section type in the home view is specified declaratively
 * as a GraphQL object that implements the HomeViewGenericSectionInterface
 *
 * Below we will configure its various fields.
 */
export const HomeViewExampleSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  /**
   * The name of the section type, e.g. HomeViewSectionArtists
   * or HomeViewSectionArtworks.
   *
   * This is typically in the form of HomeViewSection{Things}>,
   * where Things is a plural noun that identifies the kind of content
   * returned by this section type.
   */
  // @ts-expect-error - not a real section type name
  name: HomeViewSectionTypeNames.HomeViewSectionExample,

  /**
   * A short description of the section type
   */
  description: "An artworks section in the home view",

  /**
   * (Do not modify). These are the interfaces that this section type implements.
   * HomeViewGenericSectionInterface specifies attributes that are common to
   * all section types.
   */
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],

  fields: {
    /**
     * (Do not modify). These are the standard fields that are shared by all
     * implementors of the HomeViewGenericSectionInterface
     */
    ...standardSectionFields,

    /**
     * This is where you define the field that is used to access this
     * section type's data.
     *
     * This can be either a new field that is used only within the home view,
     * or, most of the time, a connection over an existing MP data type.
     *
     * In the latter case, you will need to define the connection name itself, and the
     * type of connection. (The `args` and `resolve` attributes here are
     * generally just boilerplate.)
     */
    trackItemImpressions: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (parent) => !!parent.trackItemImpressions,
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
