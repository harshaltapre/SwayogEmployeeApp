import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid().optional(),
  content: z.string().trim().min(1, "Message content cannot be empty").max(1000, "Message cannot exceed 1000 characters"),
});

export const getConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetConversationsQueryInput = z.infer<typeof getConversationsQuerySchema>;
