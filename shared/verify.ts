import z from "zod"

export function verifyPrimitiveMetadata(target: any) {
  return z.object({
    data: z.record(z.string(), z.array(z.string())),
    preferences: z.object({
      panelColors: z.record(z.string(), z.string()).optional(),
    }).optional(),
    updatedTime: z.number(),
  }).parse(target)
}
