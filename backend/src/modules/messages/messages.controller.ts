import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

// Helper to interact with Message table even if Prisma client generation failed due to file locks
const messageDb = {
  async findMany(args: any) {
    // If the prisma delegate exists, use it (preferred)
    if ((prisma as any).message) {
      return (prisma as any).message.findMany(args);
    }
    
    // Fallback to raw query if delegate missing (e.g. generation failed with EPERM)
    console.warn("[Messages] Using raw query fallback for findMany");
    const where = args.where || {};
    let query = 'SELECT * FROM "Message"';
    const params: any[] = [];
    
    if (where.OR) {
      const orParts = where.OR.map((part: any) => {
        const keys = Object.keys(part);
        return keys.map(k => {
          params.push(part[k]);
          return `"${k}" = $${params.length}`;
        }).join(" AND ");
      });
      query += ` WHERE (${orParts.join(") OR (")})`;
    }
    
    if (args.orderBy) {
      const field = Object.keys(args.orderBy)[0];
      const direction = args.orderBy[field].toUpperCase();
      query += ` ORDER BY "${field}" ${direction}`;
    }
    
    return prisma.$queryRawUnsafe(query, ...params);
  },
  
  async create(args: any) {
    if ((prisma as any).message) {
      return (prisma as any).message.create(args);
    }
    
    console.warn("[Messages] Using raw query fallback for create");
    const data = args.data;

    // Ensure required defaults are present for the raw INSERT
    const insertData: Record<string, unknown> = {
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      isRead: data.isRead ?? false,
    };

    const keys = Object.keys(insertData);
    const values = keys.map(k => insertData[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const columns = keys.map(k => `"${k}"`).join(", ");
    
    const query = `INSERT INTO "Message" (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result: any = await (prisma as any).$queryRawUnsafe(query, ...values);
    return result[0];
  }
};

async function getRecursiveReporteeIds(userId: string): Promise<string[]> {
  const reports = await prisma.user.findMany({
    where: { reportingManagerId: userId, isActive: true },
    select: { id: true },
  });
  const ids = reports.map((r) => r.id);
  if (ids.length === 0) return [];

  const subReportIds = await Promise.all(ids.map((id) => getRecursiveReporteeIds(id)));
  return [...ids, ...subReportIds.flat()];
}

export async function getConversations(req: Request, res: Response): Promise<void> {
  // @ts-ignore
  const userId = req.auth?.userId;
  // @ts-ignore
  const role = req.auth?.role;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUB_ADMIN") {
      // Admins: Get a list of users they have messages with
      const messages = await messageDb.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: "desc" },
      });

      // Fetch user details for these messages
      const userIds = new Set<string>();
      messages.forEach((m: any) => {
        userIds.add(m.senderId);
        userIds.add(m.receiverId);
      });
      userIds.delete(userId);

      const users = await prisma.user.findMany({
        where: { 
          id: { in: Array.from(userIds) },
          role: "PARTNER"
        },
        select: { id: true, fullName: true, role: true }
      });

      const userMap = new Map<string, typeof users[0]>(users.map(u => [u.id, u]));

      const partnersMap = new Map<string, {
        id: string;
        fullName: string;
        role: string;
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
      }>();
      messages.forEach((m: any) => {
        const otherId = m.senderId === userId ? m.receiverId : m.senderId;
        const otherUser = userMap.get(otherId);
        if (otherUser && !partnersMap.has(otherId)) {
          partnersMap.set(otherId, {
            id: otherUser.id,
            fullName: otherUser.fullName,
            role: otherUser.role,
            lastMessage: m.content,
            lastMessageAt: m.createdAt,
            unreadCount: 0
          });
        }
      });

      // Also get all partners who haven't messaged yet
      const allPartners = await prisma.user.findMany({
        where: { role: "PARTNER" },
        select: { id: true, fullName: true, role: true }
      });

      allPartners.forEach((p: any) => {
        if (!partnersMap.has(p.id)) {
          partnersMap.set(p.id, {
            id: p.id,
            fullName: p.fullName,
            role: p.role,
            lastMessage: null,
            lastMessageAt: null,
            unreadCount: 0
          });
        }
      });



      res.status(200).json({ data: { conversations: Array.from(partnersMap.values()) } });
    } else if (role === "EMPLOYEE" || role === "TEAM_LEAD" || role === "DEPARTMENT_HEAD") {
      // Employees & Managers: See their reporting manager + admin conversations + messages they have had
      const adminUsers = await prisma.user.findMany({
        where: { 
          OR: [
            { role: "SUPER_ADMIN" },
            { role: "ADMIN" },
            { role: "SUB_ADMIN" }
          ]
        },
        select: { id: true, fullName: true, role: true },
        take: 1
      });

      // Fetch users they have messaged with
      const messages = await messageDb.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: "desc" },
      });

      const userIds = new Set<string>();
      messages.forEach((m: any) => {
        userIds.add(m.senderId);
        userIds.add(m.receiverId);
      });
      userIds.delete(userId);

      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, fullName: true, role: true }
      });

      const userMap = new Map<string, typeof users[0]>(users.map(u => [u.id, u]));

      const conversations: any[] = [];
      const seenUserIds = new Set<string>();

      messages.forEach((m: any) => {
        const otherId = m.senderId === userId ? m.receiverId : m.senderId;
        const otherUser = userMap.get(otherId);
        if (otherUser && !seenUserIds.has(otherId)) {
          seenUserIds.add(otherId);
          conversations.push({
            id: otherUser.id,
            fullName: otherUser.fullName,
            role: otherUser.role,
            lastMessage: m.content,
            lastMessageAt: m.createdAt,
            unreadCount: 0
          });
        }
      });

      // Add fallback admin
      if (adminUsers.length > 0 && !conversations.some(c => c.id === adminUsers[0].id)) {
        conversations.push({
          id: adminUsers[0].id,
          fullName: "SWAYOG Admin Support",
          role: adminUsers[0].role,
        });
      }

      // Also add reporting manager if exists
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { reportingManagerId: true }
      });
      if (currentUser?.reportingManagerId) {
        const manager = await prisma.user.findUnique({
          where: { id: currentUser.reportingManagerId },
          select: { id: true, fullName: true, role: true }
        });
        if (manager && !conversations.some(c => c.id === manager.id)) {
          conversations.push({
            id: manager.id,
            fullName: manager.fullName,
            role: manager.role,
          });
        }
      }

      // Also add recursive reportees (direct and indirect)
      const reporteeIds = await getRecursiveReporteeIds(userId);
      if (reporteeIds.length > 0) {
        const reportees = await prisma.user.findMany({
          where: { id: { in: reporteeIds }, isActive: true },
          select: { id: true, fullName: true, role: true }
        });
        reportees.forEach((r) => {
          if (!conversations.some(c => c.id === r.id)) {
            conversations.push({
              id: r.id,
              fullName: r.fullName,
              role: r.role,
            });
          }
        });
      }

      res.status(200).json({ data: { conversations } });
    } else {
      // Partners & others: See the admin conversation
      console.log("[Messages] Partner requesting conversations. Fetching admins...");
      const adminUsers = await prisma.user.findMany({
        where: { 
          OR: [
            { role: "SUPER_ADMIN" },
            { role: "ADMIN" },
            { role: "SUB_ADMIN" }
          ]
        },
        select: { id: true, fullName: true, role: true },
        take: 1
      });

      console.log(`[Messages] Found ${adminUsers.length} admins`);
      const admin = adminUsers[0];
      if (!admin) {
        console.warn("[Messages] No admins found in database!");
        res.status(200).json({ data: { conversations: [] } });
        return;
      }

      res.status(200).json({
        data: {
          conversations: [{
            id: admin.id,
            fullName: "SWAYOG Admin Support",
            role: admin.role,
          }]
        }
      });
    }
  } catch (error) {
    console.error("[Messages] Failed to get conversations", error);
    res.status(500).json({ error: "Server error" });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  // @ts-ignore
  const userId = req.auth?.userId;
  const { partnerId } = req.params;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const messages = await messageDb.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ]
      },
      orderBy: { createdAt: "asc" }
    });

    res.status(200).json({ data: { messages } });
  } catch (error) {
    console.error("Failed to get messages", error);
    res.status(500).json({ error: "Server error" });
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  // @ts-ignore
  const userId = req.auth?.userId;
  let { receiverId, content } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Validate content is a non-empty string
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Message content cannot be empty" });
    return;
  }

  content = content.trim();

  try {
    // Default to first admin if no receiver specified (for partners/employees)
    if (!receiverId) {
      const adminUsers = await prisma.user.findMany({
        where: { 
          OR: [
            { role: "SUPER_ADMIN" },
            { role: "ADMIN" },
            { role: "SUB_ADMIN" }
          ]
        },
        select: { id: true },
        take: 1
      });
      if (adminUsers.length > 0) {
        receiverId = adminUsers[0].id;
      } else {
        res.status(400).json({ error: "No admin found to receive message" });
        return;
      }
    }

    const message = await messageDb.create({
      data: {
        senderId: userId,
        receiverId,
        content
      }
    });

    res.status(201).json({ data: { message } });
  } catch (error) {
    console.error("Failed to send message", error);
    res.status(500).json({ error: "Server error" });
  }
}
