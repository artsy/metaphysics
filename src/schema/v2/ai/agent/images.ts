import config from "config"
import type { AIAgentHistoryEntry, AIAgentImage } from "./types"

/**
 * Attached images never reach the model as pixels by default, and the model
 * never sees an S3 key. Each image becomes a handle -- `image_1`, `image_2`,
 * ... in conversation order -- that the model passes to a tool, and the tool
 * resolves it here, against this request's own input and history. A handle
 * the request didn't attach resolves to nothing, so a model (or a collector
 * typing "[Collector attached image_7]") cannot point a search at an
 * arbitrary S3 object.
 *
 * Handles are positional, so they stay stable across turns as long as the
 * client replays the same history, which it does by contract.
 */
export type AIAgentImageHandles = ReadonlyMap<string, AIAgentImage>

export interface AIAgentImageHandleAssignment {
  handles: AIAgentImageHandles
  // Aligned with `history`: the handle attached to each entry, if any.
  historyHandles: Array<string | null>
  currentHandle: string | null
}

export function assignImageHandles(
  history: readonly AIAgentHistoryEntry[] | null | undefined,
  image: AIAgentImage | null | undefined
): AIAgentImageHandleAssignment {
  const handles = new Map<string, AIAgentImage>()
  const assign = (attached: AIAgentImage) => {
    const handle = `image_${handles.size + 1}`
    handles.set(handle, { s3Key: attached.s3Key, s3Bucket: attached.s3Bucket })
    return handle
  }

  // Only a collector attaches images; one replayed on an assistant entry
  // describes nothing that was sent.
  const historyHandles = (history ?? []).map((entry) =>
    entry.role !== "assistant" && entry.image ? assign(entry.image) : null
  )
  const currentHandle = image ? assign(image) : null

  return { handles, historyHandles, currentHandle }
}

export function imageHandleNote(handle: string): string {
  return `[Collector attached ${handle}]`
}

export function withImageHandleNote(
  content: string,
  handle: string | null
): string {
  if (!handle) return content
  const note = imageHandleNote(handle)
  return content.length > 0 ? `${note}\n${content}` : note
}

export function isSupportedImageBucket(bucket: string): boolean {
  return config.SEARCH_ARTWORK_IMAGE_BUCKETS.includes(bucket)
}
