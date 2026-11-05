/**
 * An invalid-argument error whose message is written for the caller: it names
 * the arguments they passed and nothing internal. The AI agent passes these
 * through to the model verbatim, where every other execution error is reduced
 * to a category, so it can correct its own query.
 */
export class ArgumentError extends Error {}
