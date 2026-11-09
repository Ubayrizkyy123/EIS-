import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import { ApiError } from "@/lib/api-error";
import {
  financeCreateSchema,
  financeUpdateSchema,
} from "@/lib/validations/eis";
import type { ServiceContext } from "@/server/modules/shared/context";
import {
  getPagination,
  paginated,
} from "@/server/modules/shared/pagination";
import {
  assertOperationalRead,
  assertOperationalWrite,
} from "@/server/modules/shared/policies";

import type { OperationsDeps } from "./types";

type FinanceCreate = z.infer<typeof financeCreateSchema>;
type FinanceUpdate = z.infer<typeof financeUpdateSchema>;

export function createFinanceService({
  db,
  log,
  now = () => new Date(),
}: OperationsDeps) {
  async function voidFinance(
    context: ServiceContext,
    id: string,
    reason: string,
  ) {
    assertOperationalWrite(context);
    const existing = await db.financeTransaction.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    if (existing.status === "VOID") {
      throw new ApiError(409, "TRANSACTION_VOID", "Transaksi sudah void.");
    }

    const data = await db.financeTransaction.update({
      where: { id },
      data: {
        status: "VOID",
        voidedById: context.userId,
        voidReason: reason,
        voidedAt: now(),
      },
    });

    await log({
      actorId: context.userId,
      action: "VOID",
      entityType: "FinanceTransaction",
      entityId: data.id,
      metadata: { reason },
    });

    return data;
  }

  return {
    async list(context: ServiceContext, searchParams: URLSearchParams) {
      assertOperationalRead(context);
      const { page, limit, skip, take } = getPagination(searchParams);
      const type = searchParams.get("type") ?? undefined;
      const status = searchParams.get("status") ?? undefined;
      const category = searchParams.get("category") ?? undefined;
      const where: Prisma.FinanceTransactionWhereInput = {
        ...(type ? { type: type as never } : {}),
        ...(status ? { status: status as never } : {}),
        ...(category
          ? { category: { contains: category, mode: "insensitive" } }
          : {}),
      };

      const [data, total] = await Promise.all([
        db.financeTransaction.findMany({
          where,
          skip,
          take,
          orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            voidedBy: { select: { id: true, name: true, email: true } },
          },
        }),
        db.financeTransaction.count({ where }),
      ]);

      return paginated(data, total, page, limit);
    },

    async get(context: ServiceContext, id: string) {
      assertOperationalRead(context);
      const data = await db.financeTransaction.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          voidedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (!data) {
        throw new ApiError(404, "NOT_FOUND", "Transaksi tidak ditemukan.");
      }

      return data;
    },

    async create(context: ServiceContext, input: FinanceCreate) {
      assertOperationalWrite(context);
      const data = await db.financeTransaction.create({
        data: {
          type: input.type,
          category: input.category,
          description: input.description,
          amount: input.amount,
          transactionDate: input.transactionDate,
          status: "POSTED",
          createdById: context.userId,
        },
      });

      await log({
        actorId: context.userId,
        action: "CREATE",
        entityType: "FinanceTransaction",
        entityId: data.id,
        metadata: { type: data.type, amount: data.amount.toString() },
      });

      return data;
    },

    async update(context: ServiceContext, id: string, input: FinanceUpdate) {
      assertOperationalWrite(context);
      const existing = await db.financeTransaction.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Transaksi tidak ditemukan.");
      }

      if (existing.status === "VOID") {
        throw new ApiError(
          409,
          "TRANSACTION_VOID",
          "Transaksi yang sudah void tidak dapat diubah.",
        );
      }

      const data = await db.financeTransaction.update({
        where: { id },
        data: {
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.transactionDate !== undefined
            ? { transactionDate: input.transactionDate }
            : {}),
        },
      });

      await log({
        actorId: context.userId,
        action: "UPDATE",
        entityType: "FinanceTransaction",
        entityId: data.id,
        metadata: { amount: data.amount.toString() },
      });

      return data;
    },

    async remove(context: ServiceContext, id: string) {
      return voidFinance(context, id, "Dihapus melalui API");
    },

    async void(context: ServiceContext, id: string, reason: string) {
      return voidFinance(context, id, reason);
    },
  };
}

export type FinanceService = ReturnType<typeof createFinanceService>;
