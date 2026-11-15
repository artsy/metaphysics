import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import {
  ResaleShippingPreferenceQuestion,
  resaleShippingPreferenceQuestions,
} from "lib/resaleShippingPreferenceQuestions"
import { ResolverContext } from "types/graphql"
import {
  ResaleSubmissionCourierHandoffEnum,
  ResaleSubmissionPackagingEnum,
  ResaleSubmissionPackerEnum,
} from "./resaleSubmission"

const ResaleShippingPreferenceFieldEnum = new GraphQLEnumType({
  name: "ResaleShippingPreferenceField",
  description: "The updateResaleSubmission input a question answers.",
  values: {
    COURIER_HANDOFF: { value: "courierHandoff" },
    PACKAGING: { value: "packaging" },
    PACKER: { value: "packer" },
  },
})

const ResaleShippingPreferenceOptionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ResaleShippingPreferenceOption",
  fields: {
    description: { type: GraphQLString },
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The enum value to send for this answer, e.g. FRAMED for packaging.",
    },
    label: { type: new GraphQLNonNull(GraphQLString) },
  },
})

const ResaleShippingPreferenceQuestionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ResaleShippingPreferenceQuestion",
  fields: {
    field: {
      type: new GraphQLNonNull(ResaleShippingPreferenceFieldEnum),
    },
    options: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ResaleShippingPreferenceOptionType))
      ),
    },
    prompt: { type: new GraphQLNonNull(GraphQLString) },
  },
})

const enumsByField: Record<
  ResaleShippingPreferenceQuestion["field"],
  GraphQLEnumType
> = {
  courierHandoff: ResaleSubmissionCourierHandoffEnum,
  packaging: ResaleSubmissionPackagingEnum,
  packer: ResaleSubmissionPackerEnum,
}

export const ResaleShippingPreferenceOptions: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(ResaleShippingPreferenceQuestionType))
  ),
  description:
    "The shipping questions to ask when preparing a resale submission, with the answers each accepts, in the order they are asked.",
  resolve: () =>
    resaleShippingPreferenceQuestions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({
        ...option,
        key: enumsByField[question.field].serialize(option.value),
      })),
    })),
}
