// Runs the Art Assistant over a dataset, once per variant, and records each
// variant as a Phoenix experiment with code and LLM-judge scores. See
// scripts/evals/README.md.
//
//   yarn eval --dataset art-assistant-golden-v1 \
//     --variant sonnet-5=anthropic:claude-sonnet-5 \
//     --variant sonnet-5-5=anthropic:claude-sonnet-5-5

import "../../src/lib/loadenv"
import xapp from "@artsy/xapp"
import { createHash } from "crypto"
import { execSync } from "child_process"
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import config from "../../src/config"
import { isLiteLLMConfigured } from "../../src/lib/apis/anthropic"
import { readDatasetFile } from "../../src/lib/evals/dataset"
import { runCodeEvaluators } from "../../src/lib/evals/evaluators"
import {
  DEFAULT_JUDGE_MODEL,
  JUDGE_VERSION,
  judge as judgeRun,
} from "../../src/lib/evals/judge"
import { languageModelFor, parseVariant } from "../../src/lib/evals/models"
import type { EvalVariant } from "../../src/lib/evals/models"
import { PhoenixClient } from "../../src/lib/evals/phoenix"
import { summarize } from "../../src/lib/evals/report"
import { evalContext, runCase } from "../../src/lib/evals/runCase"
import type { ScoredRun } from "../../src/lib/evals/stats"
import type {
  EvalCase,
  EvalRunOutput,
  EvalScore,
} from "../../src/lib/evals/types"
import { schema } from "../../src/schema/v2"
import { loadPromptTemplate } from "../../src/schema/v2/ai/agent/runTurn"
import { argv, flag, value, values } from "./args"

// ---------------------------------------------------------------- arguments

function usage(message?: string): never {
  if (message) console.error(`${message}\n`)
  console.error(
    [
      "Usage: yarn eval (--dataset <phoenix name> | --file <jsonl>) --variant <spec> [--variant <spec> ...]",
      "",
      "  --variant label=anthropic|litellm:model[@prompt-file]   first one is the baseline",
      "  --repetitions N        runs per case per variant (default 3)",
      "  --limit N              first N cases only",
      "  --case ID              only this case (repeatable; caseId or Phoenix example ID)",
      "  --split NAME           only this Phoenix split (a category)",
      "  --exclude-user-dependent  skip cases about the eval user's own saves/follows",
      "  --concurrency N        turns in flight (default 3)",
      "  --now YYYY-MM-DD       pin today's date in the prompt (default: today)",
      "  --judge [provider:]MODEL  judge model (default litellm:claude-opus-5-5 when LiteLLM is set,",
      "                         else anthropic:); --no-judge to skip",
      "  --no-phoenix           don't create experiments; local report only",
      "  --out DIR              report directory (default .cache/evals)",
      "",
      "Env: METAPHYSICS_ACCESS_TOKEN + METAPHYSICS_USER_ID (the eval user), LITELLM_BASE_URL +",
      "LITELLM_API_KEY and/or ANTHROPIC_API_KEY, PHOENIX_URL + PHOENIX_API_KEY.",
    ].join("\n")
  )
  process.exit(1)
}

if (flag("--help")) usage()

const datasetName = value("--dataset")
const datasetFile = value("--file")
if (!datasetName === !datasetFile)
  usage("Pass exactly one of --dataset or --file.")

let variants: EvalVariant[]
try {
  variants = values("--variant").map(parseVariant)
} catch (error) {
  usage((error as Error).message)
}
if (variants.length === 0) usage("Pass at least one --variant.")
if (new Set(variants.map((v) => v.label)).size !== variants.length) {
  usage("Variant labels must be unique.")
}

const repetitions = Number(value("--repetitions") ?? 3)
const limit = value("--limit") ? Number(value("--limit")) : undefined
const onlyCases = new Set(values("--case"))
const split = value("--split")
const concurrency = Number(value("--concurrency") ?? 3)
const now = value("--now")
  ? new Date(`${value("--now")}T12:00:00Z`)
  : new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`)
// Same `provider:model` form as a variant; a bare model name uses LiteLLM
// when it's configured, so one key covers the whole run.
let judgeVariant: EvalVariant | null = null
if (!flag("--no-judge")) {
  const spec = value("--judge") ?? DEFAULT_JUDGE_MODEL
  const provider = isLiteLLMConfigured() ? "litellm" : "anthropic"
  try {
    judgeVariant = parseVariant(
      `judge=${spec.includes(":") ? spec : `${provider}:${spec}`}`
    )
  } catch {
    usage(`Bad --judge "${spec}": expected [anthropic|litellm:]model`)
  }
}
const judgeModelID = judgeVariant
  ? `${judgeVariant.provider}:${judgeVariant.model}`
  : null
const usePhoenix = !flag("--no-phoenix")
const outDir = value("--out") ?? ".cache/evals"

if (!Number.isInteger(repetitions) || repetitions < 1)
  usage("Bad --repetitions.")
if (isNaN(now.getTime())) usage("Bad --now; expected YYYY-MM-DD.")
if (usePhoenix && !datasetName) {
  usage("--file runs have no Phoenix dataset to attach to; add --no-phoenix.")
}

const user = {
  accessToken: process.env.METAPHYSICS_ACCESS_TOKEN ?? "",
  userID: process.env.METAPHYSICS_USER_ID ?? "",
}
if (!user.accessToken || !user.userID) {
  usage(
    "Set METAPHYSICS_ACCESS_TOKEN and METAPHYSICS_USER_ID for the eval user."
  )
}

// ---------------------------------------------------------------- helpers

const shortHash = (text: string) =>
  createHash("sha256").update(text).digest("hex").slice(0, 8)

function git(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: "utf8" }).trim()
  } catch {
    return "unknown"
  }
}

async function pool<T>(
  items: T[],
  size: number,
  work: (item: T, index: number) => Promise<void>
) {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const index = next++
        await work(items[index], index)
      }
    })
  )
}

/**
 * Gravity rejects every call without an app token. The server fetches it on
 * boot (index.js); running runTurn in-process, we have to do the same.
 */
function initAppToken(): Promise<void> {
  return new Promise((resolve, reject) => {
    // The library's error carries the request URL, which has the secret in
    // its query string; don't print it.
    xapp.once("error", () =>
      reject(
        new Error(
          `Couldn't get a Gravity app token from ${config.GRAVITY_API_URL} (VPN? GRAVITY_ID/SECRET?).`
        )
      )
    )
    xapp.init(
      {
        url: config.GRAVITY_API_URL,
        id: config.GRAVITY_ID,
        secret: config.GRAVITY_SECRET,
      },
      (_unused: unknown, token?: string) => {
        if (!token) {
          reject(
            new Error(
              `No Gravity app token from ${config.GRAVITY_API_URL}; check GRAVITY_ID and GRAVITY_SECRET.`
            )
          )
          return
        }
        config.GRAVITY_XAPP_TOKEN = token
        resolve()
      }
    )
  })
}

// ---------------------------------------------------------------- main

async function main() {
  await initAppToken()
  const phoenix = usePhoenix ? PhoenixClient.fromEnv() : null

  let datasetID: string | null = null
  let versionID: string | null = null
  let cases: EvalCase[]
  if (datasetName && phoenix) {
    const dataset = await phoenix.datasetByName(datasetName)
    datasetID = dataset.id
    const loaded = await phoenix.examples(dataset.id, { split })
    versionID = loaded.versionID
    cases = loaded.cases
  } else if (datasetName) {
    usage("--dataset needs Phoenix; use --file with --no-phoenix.")
  } else {
    cases = readDatasetFile(datasetFile as string)
    if (split) cases = cases.filter((c) => c.metadata.category === split)
  }

  if (onlyCases.size) {
    cases = cases.filter(
      (c) => onlyCases.has(c.id) || onlyCases.has(String(c.metadata.caseId))
    )
  }
  if (flag("--exclude-user-dependent")) {
    cases = cases.filter((c) => !c.metadata.userDependent)
  }
  if (limit) cases = cases.slice(0, limit)
  if (cases.length === 0) usage("No cases left to run.")

  const sha = git("rev-parse --short HEAD")
  const dirty = git("status --porcelain") !== ""
  // Variants without a prompt file use Gravity's prompt, fetched once so an
  // edit to it mid-run can't make the variants incomparable.
  const gravityPrompt = variants.some((variant) => !variant.promptFile)
    ? await loadPromptTemplate(evalContext(user))
    : undefined
  const prompts = new Map(
    variants.map((variant) => [
      variant.label,
      variant.promptFile
        ? readFileSync(variant.promptFile, "utf8")
        : gravityPrompt,
    ])
  )

  const runName = `${new Date().toISOString().replace(/[:.]/g, "-")}`
  const runDir = join(outDir, runName)
  mkdirSync(runDir, { recursive: true })
  const runsFile = join(runDir, "runs.jsonl")

  const experiments = new Map<string, string>()
  for (const variant of variants) {
    const prompt = prompts.get(variant.label)
    const metadata = {
      variant: variant.label,
      provider: variant.provider,
      model: variant.model,
      promptFile: variant.promptFile ?? null,
      promptSource: variant.promptFile ? "file" : "gravity",
      promptHash: prompt ? shortHash(prompt) : null,
      gitSha: sha,
      gitDirty: dirty,
      now: now.toISOString().slice(0, 10),
      judgeModel: judgeModelID,
      judgeVersion: JUDGE_VERSION,
      repetitions,
      cases: cases.length,
    }
    if (phoenix && datasetID && versionID) {
      const experiment = await phoenix.createExperiment(datasetID, {
        name: `${variant.label} · ${variant.model}${
          prompt ? ` · prompt ${shortHash(prompt)}` : ""
        } · ${sha}${dirty ? "+dirty" : ""}`,
        description: `yarn eval ${argv.join(" ")}`,
        metadata,
        versionID,
        repetitions,
        split,
      })
      experiments.set(variant.label, experiment.id)
    }
  }
  writeFileSync(
    join(runDir, "config.json"),
    JSON.stringify(
      {
        argv,
        variants,
        datasetName,
        datasetFile,
        datasetID,
        versionID,
        experiments: Object.fromEntries(experiments),
        sha,
        dirty,
        now,
        judgeModelID,
        judgeVersion: JUDGE_VERSION,
        repetitions,
        caseIDs: cases.map((c) => c.id),
      },
      null,
      2
    )
  )

  // Case-major, and the variant order rotates, so variants run side by side
  // under the same live data and neither always goes first.
  const jobs = cases.flatMap((testCase, caseIndex) =>
    Array.from({ length: repetitions }, (_, rep) =>
      variants.map((_, k) => ({
        testCase,
        repetition: rep + 1,
        variant: variants[(k + caseIndex + rep) % variants.length],
      }))
    ).flat()
  )

  const judgeModel = judgeVariant ? languageModelFor(judgeVariant) : null
  const scored: ScoredRun[] = []
  const uploads: Promise<void>[] = []
  let done = 0
  console.log(
    `Running ${cases.length} cases × ${repetitions} × ${
      variants.length
    } variants = ${jobs.length} turns (git ${sha}${
      dirty ? "+dirty" : ""
    }, today ${now.toISOString().slice(0, 10)}).`
  )

  await pool(jobs, concurrency, async ({ testCase, repetition, variant }) => {
    const startTime = new Date()
    let output: EvalRunOutput | null = null
    let error: string | undefined
    try {
      output = await runCase(testCase, {
        model: languageModelFor(variant),
        systemPromptTemplate: prompts.get(variant.label),
        now,
        schema,
        user,
      })
    } catch (cause) {
      error = (cause as Error)?.stack ?? String(cause)
    }
    const endTime = new Date()

    const scores: EvalScore[] = output
      ? runCodeEvaluators(output, testCase)
      : []
    if (output && judgeModel) {
      try {
        scores.push(...(await judgeRun(judgeModel, testCase, output)))
      } catch (cause) {
        console.error(`  judge failed on ${testCase.id}: ${cause}`)
      }
    }

    // Uploading doesn't hold a turn slot; the summary waits for it.
    const experimentID = experiments.get(variant.label)
    if (phoenix && experimentID) {
      uploads.push(
        (async () => {
          try {
            const run = await phoenix.createRun(experimentID, {
              exampleID: testCase.id,
              repetition,
              output: output ?? {},
              startTime,
              endTime,
              error,
            })
            const evaluatedAt = new Date()
            await Promise.all(
              scores.map((score) =>
                phoenix.createEvaluation(run.id, score, {
                  startTime: endTime,
                  endTime: evaluatedAt,
                })
              )
            )
          } catch (cause) {
            console.error(`  Phoenix upload failed on ${testCase.id}: ${cause}`)
          }
        })()
      )
    }

    const record: ScoredRun = {
      variant: variant.label,
      caseID: testCase.id,
      scores: Object.fromEntries(scores.map((s) => [s.name, s.score])),
    }
    scored.push(record)
    appendFileSync(
      runsFile,
      JSON.stringify({
        ...record,
        repetition,
        error,
        output,
        details: scores,
      }) + "\n"
    )

    done += 1
    const useful = record.scores.judge_useful
    console.log(
      `[${done}/${jobs.length}] ${variant.label} ${testCase.id} #${repetition}: ` +
        (error
          ? `ERROR ${error.split("\n")[0]}`
          : `${output!.stopReason}, ${output!.steps.length} steps, ` +
            `${record.scores.failed_searches} failed, ${(
              output!.latencyMs / 1000
            ).toFixed(1)}s` +
            (useful != null ? `, useful ${useful}` : ""))
    )
  })

  await Promise.all(uploads)

  // ------------------------------------------------------------ summary

  const lines = [
    summarize(
      scored,
      variants.map((v) => v.label),
      repetitions
    ),
  ]

  if (phoenix && datasetID) {
    lines.push("", "Phoenix:")
    for (const [label, id] of experiments) {
      lines.push(`  ${label}: ${phoenix.experimentURL(datasetID, id)}`)
    }
  }
  lines.push("", `Report: ${runDir}`)

  const summary = lines.join("\n")
  console.log(summary)
  writeFileSync(join(runDir, "summary.txt"), summary + "\n")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
