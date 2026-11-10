/**
 * The slice of Phoenix's REST API the eval runner needs: datasets in,
 * experiments out. Talks to Phoenix directly (PHOENIX_URL + PHOENIX_API_KEY),
 * not through LiteLLM's pass-through, whose key is scoped to tracing.
 * Shapes follow Phoenix 20.16's REST API.
 */

import type { EvalCase, EvalScore } from "./types"

export interface PhoenixConfig {
  url: string
  apiKey?: string
}

export class PhoenixClient {
  constructor(private readonly config: PhoenixConfig) {}

  static fromEnv(env = process.env): PhoenixClient {
    const url = env.PHOENIX_URL
    if (!url) throw new Error("Set PHOENIX_URL (and PHOENIX_API_KEY).")
    return new PhoenixClient({ url, apiKey: env.PHOENIX_API_KEY })
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(new URL(path, this.config.url), {
      method,
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(this.config.apiKey
          ? { authorization: `Bearer ${this.config.apiKey}` }
          : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(
        `Phoenix ${method} ${path}: HTTP ${response.status} ${text.slice(
          0,
          500
        )}`
      )
    }
    return (await response.json()) as T
  }

  async datasetByName(name: string): Promise<{ id: string; name: string }> {
    const { data } = await this.request<{
      data: Array<{ id: string; name: string }>
    }>("GET", `/v1/datasets?name=${encodeURIComponent(name)}`)
    const dataset = data.find((candidate) => candidate.name === name)
    if (!dataset) throw new Error(`No Phoenix dataset named "${name}".`)
    return dataset
  }

  /** The latest version unless one is pinned. */
  async examples(
    datasetID: string,
    { versionID, split }: { versionID?: string; split?: string } = {}
  ): Promise<{ versionID: string; cases: EvalCase[] }> {
    const params = new URLSearchParams()
    if (versionID) params.set("version_id", versionID)
    if (split) params.set("split", split)
    const { data } = await this.request<{
      data: {
        version_id: string
        examples: Array<{
          id: string
          input: any
          output: any
          metadata: any
        }>
      }
    }>("GET", `/v1/datasets/${datasetID}/examples?${params}`)
    return {
      versionID: data.version_id,
      cases: data.examples.map((example) => ({
        id: example.id,
        input: example.input,
        reference: example.output ?? {},
        metadata: example.metadata ?? {},
      })),
    }
  }

  async uploadDataset({
    name,
    description,
    cases,
    action = "create",
  }: {
    name: string
    description?: string
    cases: Array<Omit<EvalCase, "id">>
    action?: "create" | "append"
  }): Promise<{ datasetID: string; versionID: string; created: number }> {
    const { data } = await this.request<{
      data: {
        dataset_id: string
        version_id: string
        num_created_examples: number
      }
    }>("POST", "/v1/datasets/upload?sync=true", {
      action,
      name,
      description,
      inputs: cases.map((testCase) => testCase.input),
      outputs: cases.map((testCase) => testCase.reference),
      metadata: cases.map((testCase) => testCase.metadata),
      // One split per category, so the UI (and --split) can slice by it.
      splits: cases.map((testCase) => testCase.metadata.category ?? null),
    })
    return {
      datasetID: data.dataset_id,
      versionID: data.version_id,
      created: data.num_created_examples,
    }
  }

  async createExperiment(
    datasetID: string,
    body: {
      name: string
      description?: string
      metadata: Record<string, unknown>
      versionID: string
      repetitions: number
      split?: string
    }
  ): Promise<{ id: string }> {
    const { data } = await this.request<{ data: { id: string } }>(
      "POST",
      `/v1/datasets/${datasetID}/experiments`,
      {
        name: body.name,
        description: body.description,
        metadata: body.metadata,
        version_id: body.versionID,
        repetitions: body.repetitions,
        ...(body.split ? { splits: [body.split] } : {}),
      }
    )
    return data
  }

  async createRun(
    experimentID: string,
    run: {
      exampleID: string
      repetition: number
      output: unknown
      startTime: Date
      endTime: Date
      error?: string
    }
  ): Promise<{ id: string }> {
    const { data } = await this.request<{ data: { id: string } }>(
      "POST",
      `/v1/experiments/${experimentID}/runs`,
      {
        dataset_example_id: run.exampleID,
        repetition_number: run.repetition,
        output: run.output,
        start_time: run.startTime.toISOString(),
        end_time: run.endTime.toISOString(),
        error: run.error ?? null,
      }
    )
    return data
  }

  async createEvaluation(
    runID: string,
    score: EvalScore,
    { startTime, endTime }: { startTime: Date; endTime: Date }
  ): Promise<void> {
    await this.request("POST", "/v1/experiment_evaluations", {
      experiment_run_id: runID,
      name: score.name,
      annotator_kind: score.kind,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      result: {
        score: score.score,
        label: score.label ?? null,
        explanation: score.explanation ?? null,
      },
    })
  }

  experimentURL(datasetID: string, experimentID: string): string {
    return new URL(
      `/datasets/${datasetID}/compare?experimentId=${experimentID}`,
      this.config.url
    ).toString()
  }
}
