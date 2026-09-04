import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const GuidedTourContextEnum = new GraphQLEnumType({
  name: "GuidedTourContext",
  values: {
    CATALOG_OS: { value: "catalog_os" },
  },
})

export const GuidedTourTourStateEnum = new GraphQLEnumType({
  name: "GuidedTourState",
  values: {
    NOT_STARTED: { value: "not_started" },
    IN_PROGRESS: { value: "in_progress" },
    COMPLETED: { value: "completed" },
    DISMISSED: { value: "dismissed" },
  },
})

export const GuidedTourChecklistItemStateEnum = new GraphQLEnumType({
  name: "GuidedTourChecklistItemState",
  values: {
    COMPLETE: { value: "complete" },
    INCOMPLETE: { value: "incomplete" },
  },
})

export const GuidedTourEventTypeEnum = new GraphQLEnumType({
  name: "GuidedTourEventType",
  values: {
    TOUR_STARTED: { value: "tour_started" },
    STEP_VIEWED: { value: "step_viewed" },
    TOUR_COMPLETED: { value: "tour_completed" },
    TOUR_DISMISSED: { value: "tour_dismissed" },
    CHECKLIST_ITEM_COMPLETED: { value: "checklist_item_completed" },
  },
})

export const GuidedTourStepType = new GraphQLObjectType<any, ResolverContext>({
  name: "GuidedTourStep",
  fields: () => ({
    key: { type: new GraphQLNonNull(GraphQLString) },
    anchorKey: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ anchor_key }) => anchor_key,
    },
    placement: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    body: { type: GraphQLString },
    ctaLabel: { type: GraphQLString, resolve: ({ cta_label }) => cta_label },
    completesItemKey: {
      type: GraphQLString,
      resolve: ({ completes_item_key }) => completes_item_key,
    },
    index: { type: new GraphQLNonNull(GraphQLInt) },
    total: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

export const GuidedTourTourType = new GraphQLObjectType<any, ResolverContext>({
  name: "GuidedTourTour",
  description: "An ordered sequence of steps and the user's state in it.",
  fields: () => ({
    key: { type: new GraphQLNonNull(GraphQLString) },
    state: { type: GuidedTourTourStateEnum },
    steps: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GuidedTourStepType))
      ),
      resolve: ({ steps }) => steps ?? [],
    },
  }),
})

export const GuidedTourChecklistItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "GuidedTourChecklistItem",
  fields: () => ({
    key: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    state: { type: new GraphQLNonNull(GuidedTourChecklistItemStateEnum) },
    showMeHowTour: {
      type: GuidedTourTourType,
      resolve: ({ show_me_how_tour }) => show_me_how_tour,
    },
  }),
})

export const GuidedTourChecklistType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "GuidedTourChecklist",
  fields: () => ({
    completedCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ completed_count }) => completed_count,
    },
    totalCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ total_count }) => total_count,
    },
    items: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GuidedTourChecklistItemType))
      ),
      resolve: ({ items }) => items ?? [],
    },
  }),
})

export const GuidedTourStateType = new GraphQLObjectType<any, ResolverContext>({
  name: "GuidedTourStateView",
  description: "A user's guided tour state for a context, server-driven.",
  fields: () => ({
    context: { type: new GraphQLNonNull(GuidedTourContextEnum) },
    activeTour: {
      type: GuidedTourTourType,
      resolve: ({ active_tour }) => active_tour,
    },
    activeStep: {
      type: GuidedTourStepType,
      description:
        "The single step to render now, or null when no required tour is active.",
      resolve: ({ active_step }) => active_step,
    },
    checklist: { type: new GraphQLNonNull(GuidedTourChecklistType) },
  }),
})

export const GuidedTourField: GraphQLFieldConfig<any, ResolverContext> = {
  type: GuidedTourStateType,
  description: "The logged-in user's guided tour state for a given context.",
  args: {
    context: { type: new GraphQLNonNull(GuidedTourContextEnum) },
  },
  resolve: (_root, { context }, { meGuidedTourLoader }) => {
    if (!meGuidedTourLoader) return null

    return meGuidedTourLoader({ context })
  },
}
