import { UserRole } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validateBody, validateQuery, validateParams } from "../../middleware/validate.js";
import { getConversations, getMessages, sendMessage } from "./messages.controller.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { sendMessageSchema, getConversationsQuerySchema } from "./messages.schemas.js";

const messagesRoutes = Router();

messagesRoutes.use(authenticateAccessToken);
messagesRoutes.use(authorizeRoles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SUB_ADMIN,
  UserRole.EMPLOYEE,
  UserRole.PARTNER,
));

messagesRoutes.get("/conversations", validateQuery(getConversationsQuerySchema), asyncHandler(getConversations));
messagesRoutes.get("/:partnerId", asyncHandler(getMessages));
messagesRoutes.post("/", validateBody(sendMessageSchema), asyncHandler(sendMessage));

export { messagesRoutes };
