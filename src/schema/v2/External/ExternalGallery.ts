import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "../object_identification"
import { PartnerType } from "schema/v2/partner/partner"

export interface Response {
  total_count: number
  total_pages: number
  current_page: number
  next_page: number
  _embedded: {
    galleries: Gallery[]
  }
  _links: {
    self: Link
    next: Link
  }
}

interface Gallery {
  id: number
  name: string
  artsy_partner_id?: string
  city?: string
  region?: string
  _links: {
    self: Link
  }
}

interface Link {
  href: string
}

export const externalGalleryType = new GraphQLObjectType<
  Gallery,
  ResolverContext
>({
  name: "ExternalGallery",
  fields: {
    ...IDFields,
    name: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: GraphQLString },
    region: { type: GraphQLString },
    partner: {
      type: PartnerType,
      resolve: ({ artsy_partner_id }, _args, { partnerLoader }) => {
        if (!artsy_partner_id) return null
        return partnerLoader(artsy_partner_id)
      },
    },
  },
})
