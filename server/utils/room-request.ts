import { z } from "zod";

const createRoomBodySchema = z.object({
  title: z.string().trim().min(1),
});

export function parseCreateRoomBody(body: unknown) {
  return createRoomBodySchema.parse(body);
}
