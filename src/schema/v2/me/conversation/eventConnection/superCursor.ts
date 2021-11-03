import qs from "qs"
import { URLSearchParams } from "url"

type CursorState<T extends string> = { position: number } & Record<T, number>

const PREFIX = "supercursor"
const base64 = (str: string) => Buffer.from(str, "utf-8").toString("base64")
const unBase64 = (str: string) => Buffer.from(str, "base64").toString("utf-8")

export class SuperCursor<T extends string> {
  readonly offsets: CursorState<T>

  static empty<U extends string>(keys: Array<U>): SuperCursor<U> {
    const offsets = keys.reduce<CursorState<U>>(
      (acc: CursorState<U>, key: U) => {
        return { ...acc, [key]: 0 }
      },
      { position: 0 } as CursorState<U>
    )
    return new SuperCursor(offsets)
  }

  static decode<U extends string>(cursor: string): SuperCursor<U> {
    const [type, offsetsString] = unBase64(cursor).split(":")
    if (type === PREFIX) {
      const rawOffsets = qs.parse(offsetsString)
      const offsets = Object.entries(rawOffsets).reduce((acc, keyVal) => {
        const [key, valueString] = keyVal
        const valueNumber = Number(valueString)
        if (isNaN(valueNumber)) {
          throw new Error("Deserialization error")
        }
        return { ...acc, [key]: Number(valueString) }
      }, {} as CursorState<U>)
      return new SuperCursor<U>(offsets)
    } else {
      throw new Error(`Unexpected serialized cursor type: ${type}`)
    }
  }

  private constructor(offsets: CursorState<T>) {
    this.offsets = offsets
  }

  increment(key: T) {
    const current: number = this.offsets[key]
    const newOffsets = {
      ...this.offsets,
      [key]: current + 1,
      position: this.offsets.position + 1,
    }
    return new SuperCursor<T>(newOffsets)
  }

  get serialized() {
    return new URLSearchParams(this.offsets as any).toString()
  }

  get encoded() {
    return base64(PREFIX + ":" + this.serialized)
  }
}
