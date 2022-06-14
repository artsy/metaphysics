import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLNonNull,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { omit } from "lodash"
import { ResolverContext } from "types/graphql"
import { FeatureFlags } from "../featureFlags"

export const FeatureFlagInputFields = {
  type: {
    type: new GraphQLNonNull(
      new GraphQLEnumType({
        name: "FeatureFlagToggleType",
        values: {
          RELEASE: {
            value: "release",
          },
          EXPERIMENT: {
            value: "experiment",
          },
        },
      })
    ),
  },
  name: {
    type: GraphQLString,
  },
  description: {
    type: GraphQLString,
    defaultValue: "",
  },
  impressionData: {
    type: GraphQLBoolean,
    defaultValue: false,
  },
  strategy: {
    type: new GraphQLNonNull(
      new GraphQLInputObjectType({
        name: "FeatureFlagStrategyInput",
        fields: {
          strategyType: {
            type: new GraphQLEnumType({
              name: "FeatureFlagStrategyType",
              values: {
                DEFAULT: {
                  description: "Simple on/off flag",
                  value: "default",
                },
                FLEXIBLE_ROLLOUT: {
                  description:
                    "For A/B tests, where you can specify a percentage of users to be served a variant",
                  value: "flexibleRollout",
                },
              },
            }),
          },
          rollOut: {
            type: GraphQLInt,
            defaultValue: 100,
          },
        },
      })
    ),
  },
  variants: {
    type: new GraphQLList(
      new GraphQLInputObjectType({
        name: "FeatureFlagVariantInputName",
        fields: {
          name: {
            type: new GraphQLNonNull(GraphQLString),
          },
          weightType: {
            type: new GraphQLEnumType({
              name: "FeatureFlagVariantWeightType",
              values: {
                VARIABLE: {
                  value: "variable",
                },
              },
            }),
          },
          weight: {
            type: new GraphQLNonNull(GraphQLInt),
          },
          stickiness: {
            type: GraphQLString,
            defaultValue: "sessionId",
          },
        },
      })
    ),
  },
}

export interface CreateFeatureFlagInput {
  name: string
  type: string
  strategy: Strategy
  variants: Variant[]
}

export interface Strategy {
  strategyType: string
  rollOut: number
}

export interface Variant {
  name: string
  weight: number
  weightType: string
}

export const createFeatureFlagMutation = mutationWithClientMutationId<
  CreateFeatureFlagInput,
  any,
  ResolverContext
>({
  name: "AdminCreateFeatureFlag",
  description: "Creates a new feature flag",
  inputFields: FeatureFlagInputFields,
  outputFields: {
    featureFlags: FeatureFlags,
  },
  mutateAndGetPayload: async (
    args,
    {
      adminCreateFeatureFlag,
      addFeatureFlagStrategy,
      addFeatureFlagVariant,
      adminFeatureFlagLoader,
    }
  ) => {
    if (
      !(
        adminCreateFeatureFlag &&
        addFeatureFlagStrategy &&
        addFeatureFlagVariant &&
        adminFeatureFlagLoader
      )
    ) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await adminCreateFeatureFlag(omit(args, ["strategy", "variants"]))

      if (args.strategy) {
        await Promise.all(
          ["development", "production"].map((environment) => {
            return addFeatureFlagStrategy(
              { id: args.name, environment: environment as any },
              {
                name: args.strategy.strategyType,
                parameters: {
                  ...args.strategy,
                  groupId: args.name,
                },
              }
            )
          })
        )
      }

      if (args.variants) {
        await addFeatureFlagVariant(args.name, args.variants)
      }

      const featureFlag = await adminFeatureFlagLoader(args.name)
      return featureFlag
    } catch (error) {
      throw new Error(JSON.stringify(error))
    }
  },
})
