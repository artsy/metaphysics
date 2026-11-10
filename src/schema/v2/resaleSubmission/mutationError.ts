// For errors raised in Metaphysics, shaped so the mutations' failure branch matches them.
export const mutationError = (message: string) => ({
  _type: "GravityMutationError",
  type: "error",
  message,
})
