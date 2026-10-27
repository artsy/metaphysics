import { createHash } from "crypto"
import config from "config"
import type { AIAgentHistoryEntry, AIAgentImage } from "./types"

/**
 * Attached images never reach the model as pixels by default, and the model
 * never sees an S3 key. Each image becomes a handle, e.g. `image_3f9a2c1b`,
 * that the model passes to a tool, and the tool resolves it here, against this
 * request's own input and history. A handle the request didn't attach
 * resolves to nothing, so a model (or a collector typing "[Collector attached
 * image_…]") cannot point a search at an arbitrary S3 object.
 *
 * A handle is derived from the image's S3 location rather than its position,
 * so it names the same image on every turn even when the client trims old
 * messages from the history it replays.
 */
export type AIAgentImageHandles = ReadonlyMap<string, AIAgentImage>

export interface AIAgentImageHandleAssignment {
  handles: AIAgentImageHandles
  // Aligned with `history`: the handle attached to each entry, if any.
  historyHandles: Array<string | null>
  currentHandle: string | null
}

export function imageHandleFor(image: AIAgentImage): string {
  const digest = createHash("sha256")
    .update(`${image.s3Bucket}/${image.s3Key}`)
    .digest("hex")
  return `image_${digest.slice(0, 8)}`
}

export function assignImageHandles(
  history: readonly AIAgentHistoryEntry[] | null | undefined,
  image: AIAgentImage | null | undefined
): AIAgentImageHandleAssignment {
  const handles = new Map<string, AIAgentImage>()
  const assign = (attached: AIAgentImage) => {
    // The same image attached twice is one handle.
    const handle = imageHandleFor(attached)
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
