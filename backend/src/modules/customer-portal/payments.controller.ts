import crypto from "node:crypto";
import type { Request, Response } from "express";

import { env } from "../../config/env.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { InvoicePaymentStatus } from "@prisma/client";

type CreateRazorpayOrderBody = {
  amountInRupees?: number;
  description?: string;
  referenceId?: string;
};

function ensureRazorpayConfigured(): void {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, "Payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
}

function toPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}

export async function createRazorpayOrder(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { amountInRupees, description, referenceId } = req.body as CreateRazorpayOrderBody;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  ensureRazorpayConfigured();

  const parsedAmount = Number(amountInRupees);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new ApiError(400, "A valid amount in rupees is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { fullName: true, email: true },
  });

  const amount = toPaise(parsedAmount);
  const receipt = referenceId?.trim() || `receipt_${Date.now()}`;
  const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes: {
        customerId: auth.userId,
        description: description?.trim() || "Customer payment",
        referenceId: referenceId?.trim() || "",
        customerName: user?.fullName || "Customer",
        customerEmail: user?.email || "",
      },
    }),
  });

  const payload = await gatewayResponse.json().catch(() => null) as { id?: string; amount?: number; currency?: string; error?: { description?: string } } | null;

  if (!gatewayResponse.ok || !payload?.id) {
    throw new ApiError(502, payload?.error?.description || "Unable to create payment order");
  }

  res.status(200).json({
    data: {
      keyId: env.RAZORPAY_KEY_ID,
      orderId: payload.id,
      amount: payload.amount ?? amount,
      currency: payload.currency ?? "INR",
      customerName: user?.fullName || "Customer",
      customerEmail: user?.email || "",
      description: description?.trim() || "Customer payment",
      referenceId: referenceId?.trim() || null,
    },
  });
}

type VerifyRazorpayPaymentBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function verifyRazorpayPayment(req: Request, res: Response): Promise<void> {
  const auth = req.auth as AuthContext | undefined;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as VerifyRazorpayPaymentBody;

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  ensureRazorpayConfigured();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment verification details");
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: auth.userId },
  });

  if (customer) {
    let paidAmountInRupees = 0;
    try {
      const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        },
      });
      if (orderResponse.ok) {
        const orderPayload = await orderResponse.json() as any;
        if (orderPayload && orderPayload.amount) {
          paidAmountInRupees = orderPayload.amount / 100;
        }
      }
    } catch (err) {
      console.error("Failed to fetch order details from Razorpay:", err);
    }

    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        customerId: customer.id,
        paymentStatus: { in: [InvoicePaymentStatus.PENDING, InvoicePaymentStatus.FAILED] },
      },
      orderBy: { invoiceDate: "asc" },
    });

    if (paidAmountInRupees > 0) {
      let remainingPaid = paidAmountInRupees;
      for (const inv of pendingInvoices) {
        if (remainingPaid <= 0) break;
        const amountNeeded = inv.amount - inv.amountPaid;
        if (remainingPaid >= amountNeeded) {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              paymentStatus: InvoicePaymentStatus.PAID,
              amountPaid: inv.amount,
              paymentDate: new Date(),
              paymentMethod: "online",
            },
          });
          remainingPaid -= amountNeeded;
        } else {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              amountPaid: inv.amountPaid + remainingPaid,
            },
          });
          remainingPaid = 0;
        }
      }
    } else {
      for (const inv of pendingInvoices) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            paymentStatus: InvoicePaymentStatus.PAID,
            amountPaid: inv.amount,
            paymentDate: new Date(),
            paymentMethod: "online",
          },
        });
      }
    }
  }

  res.status(200).json({
    data: {
      verified: true,
      razorpay_order_id,
      razorpay_payment_id,
    },
    message: "Payment verified successfully",
  });
}