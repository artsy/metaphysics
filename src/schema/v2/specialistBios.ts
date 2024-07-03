import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import specialistBiosData from "data/specialistBios.json"
import { ResolverContext } from "types/graphql"
import { ImageType } from "schema/v2/image"

interface specialistBio {
  bio: string
  email: string
  firstName: string
  imageUrl: string
  jobTitle: string
  name: string
}

const SpecialistBioType = new GraphQLObjectType<specialistBio, ResolverContext>(
  {
    name: "SpecialistBio",
    fields: {
      bio: { type: new GraphQLNonNull(GraphQLString) },
      email: { type: new GraphQLNonNull(GraphQLString) },
      firstName: {
        type: new GraphQLNonNull(GraphQLString),
      },
      image: {
        type: new GraphQLNonNull(ImageType),
        resolve: ({ imageUrl }) => {
          if (!imageUrl) return null

          return {
            image_url: imageUrl,
          }
        },
      },
      jobTitle: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
    },
  }
)

export const SpecialistBios: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A list of specialists",
  type: new GraphQLList(new GraphQLNonNull(SpecialistBioType)),
  resolve: () => specialistBiosData,
}
