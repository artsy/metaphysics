/**
 * LLM-as-judge for one run of one case. One call returns all three
 * judgments, so they read the same evidence. The judge is pinned to a model
 * that isn't one of the candidates, since models favour their own answers.
 */

import { generateText, Output } from "ai"
import type { LanguageModel } from "ai"
import { z } from "zod"
import { toolCalls } from "./evaluators"
import type { EvalCase, EvalRunOutput, EvalScore } from "./types"

export const DEFAULT_JUDGE_MODEL = "claude-opus-5-5"

/** Bump when the rubric changes, so old and new scores aren't averaged. */
export const JUDGE_VERSION = "v2"

// About 25k tokens of search results. Past it a result is cut and marked
// "…", and the rubric says not to fail a claim that only the cut part
// could support.
const TOOL_RESULT_BUDGET = 100_000

export const JUDGE_SYSTEM_PROMPT = `
You grade answers from Artsy's art assistant, which helps collectors find
artworks, artists, shows and fairs by searching Artsy's catalogue. You see
what the collector asked, what a good answer should do, what the assistant's
searches returned, and the answer with the cards shown under it.

Grade strictly and consistently; the same answer must always get the same
grade.

- useful (1-5): would this collector be well served?
  5 = does exactly what was asked, with fitting cards and no errors;
  4 = good, a minor miss (one off-target card, a little vague);
  3 = partly useful: right direction but a clear gap;
  2 = mostly unhelpful, or ignores a stated constraint;
  1 = wrong, refuses something it could do, or no answer.
  A clarifying question is a 4-5 when the request was genuinely ambiguous,
  and a 2 when it wasn't.
- constraints: "pass" if every constraint the collector stated (budget,
  medium, size, artist, for sale, place, time) is respected by the answer
  and its cards; "fail" if any is broken; "na" if none was stated.
- grounded: "pass" if every factual claim (names, prices, dates, counts,
  availability) is supported by the search results or the cards; "fail"
  if anything is invented or contradicts them; "na" if the answer makes no
  factual claims. A result ending in "…" was cut for length: a claim it
  could only be checked against there is not a fail.
- mustNot: if the case lists things a good answer must not do and the
  answer does one, useful is at most 2.

Explain in two or three sentences, citing the specific problem.
`.trim()

const JudgeSchema = z.object({
  explanation: z.string(),
  useful: z.number().int().min(1).max(5),
  constraints: z.enum(["pass", "fail", "na"]),
  grounded: z.enum(["pass", "fail", "na"]),
})

export type JudgeVerdict = z.infer<typeof JudgeSchema>

export function buildJudgePrompt(
  testCase: EvalCase,
  output: EvalRunOutput
): string {
  const history = (testCase.input.history ?? [])
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n")

  let budget = TOOL_RESULT_BUDGET
  const searches = toolCalls(output)
    .map((call, index) => {
      const result = call.result.slice(0, Math.max(0, budget))
      budget -= result.length
      return [
        `#${index + 1} ${call.ok === false ? "FAILED" : "ok"}`,
        `query: ${call.query ?? "(none)"}`,
        call.variables ? `variables: ${JSON.stringify(call.variables)}` : "",
        `result: ${result}${result.length < call.result.length ? " …" : ""}`,
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n\n")

  const cards = output.cards
    .map((card, index) =>
      [
        `${index + 1}.`,
        card.name ?? card.title,
        card.artist ? `by ${card.artist}` : "",
        card.medium ? `(${card.medium})` : "",
        card.price ? `— ${card.price}` : "",
        card.nationality ? `(${card.nationality})` : "",
      ]
        .filter(Boolean)
        .join(" ")
    )
    .join("\n")

  return [
    history ? `<conversation_so_far>\n${history}\n</conversation_so_far>` : "",
    `<collector_message>\n${testCase.input.message}\n</collector_message>`,
    testCase.reference.expectedBehavior
      ? `<good_answer_should>\n${testCase.reference.expectedBehavior}\n</good_answer_should>`
      : "",
    testCase.reference.mustNot?.length
      ? `<must_not>\n${testCase.reference.mustNot.join("\n")}\n</must_not>`
      : "",
    `<search_results>\n${searches || "(no searches)"}\n</search_results>`,
    `<answer>\n${output.message ?? "(no answer)"}\n</answer>`,
    `<cards_shown>\n${cards || "(none)"}\n</cards_shown>`,
  ]
    .filter(Boolean)
    .join("\n\n")
}

const passFail = (value: "pass" | "fail" | "na") =>
  value === "na" ? null : value === "pass" ? 1 : 0

export function verdictScores(verdict: JudgeVerdict): EvalScore[] {
  return [
    {
      name: "judge_useful",
      kind: "LLM",
      score: verdict.useful,
      label: String(verdict.useful),
      explanation: verdict.explanation,
    },
    {
      name: "judge_constraints",
      kind: "LLM",
      score: passFail(verdict.constraints),
      label: verdict.constraints,
    },
    {
      name: "judge_grounded",
      kind: "LLM",
      score: passFail(verdict.grounded),
      label: verdict.grounded,
    },
  ]
}

export async function judge(
  model: LanguageModel,
  testCase: EvalCase,
  output: EvalRunOutput
): Promise<EvalScore[]> {
  // A turn with no answer has nothing to judge; it is already a 1.
  if (!output.message) {
    return verdictScores({
      explanation: `No answer (stopReason=${output.stopReason}).`,
      useful: 1,
      constraints: "na",
      grounded: "na",
    })
  }

  const result = await generateText({
    model,
    system: JUDGE_SYSTEM_PROMPT,
    prompt: buildJudgePrompt(testCase, output),
    output: Output.object({ schema: JudgeSchema }),
    maxOutputTokens: 4000,
    providerOptions: {
      anthropic: {
        thinking: { type: "adaptive" },
        effort: "medium",
        structuredOutputMode: "outputFormat",
      },
    },
  })
  return verdictScores(result.output)
}
