import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { getConversations, getMessages, sendMessage } from "./messages.controller.js";
import { authenticateAccessToken } from "../../middleware/auth.js";

const messagesRoutes = Router();

messagesRoutes.use(authenticateAccessToken);

messagesRoutes.get("/conversations", asyncHandler(getConversations));
messagesRoutes.get("/:partnerId", asyncHandler(getMessages));
messagesRoutes.post("/", asyncHandler(sendMessage));

export { messagesRoutes };
