import assert from "node:assert/strict";
import test from "node:test";

import type { ServiceContext } from "@/server/modules/shared/context";
import {
  createOperationsServices,
  type OperationsDb,
} from "@/server/modules/operations";

type Row = Record<string, unknown>;

const context: ServiceContext = {
  userId: "admin-1",
  role: "ADMIN",
};

function createFakeDb() {
  const financeTransactions: Row[] = [];
  const facilities: Row[] = [];
  const maintenances: Row[] = [];
  const alerts: Row[] = [];
  let sequence = 0;

  function nextId(prefix: string) {
    sequence += 1;
    return `${prefix}-${sequence}`;
  }

  function cloneRow(row: Row | undefined) {
    return row ? { ...row } : null;
  }

  function updateRow(rows: Row[], id: string, data: Row) {
    const row = rows.find((candidate) => candidate.id === id);

    if (!row) {
      throw new Error(`Missing row ${id}`);
    }

    Object.assign(row, data);
    return row;
  }

  const db = {
    financeTransaction: {
      findMany: async () => financeTransactions,
      count: async () => financeTransactions.length,
      findUnique: async ({ where }: { where: { id: string } }) =>
        cloneRow(financeTransactions.find((row) => row.id === where.id)),
      create: async ({ data }: { data: Row }) => {
        const row = { id: nextId("finance"), ...data };
        financeTransactions.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Row;
      }) => updateRow(financeTransactions, where.id, data),
    },
    facility: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        cloneRow(facilities.find((row) => row.id === where.id)),
      create: async ({ data }: { data: Row }) => {
        const row = { id: nextId("facility"), ...data };
        facilities.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Row }) =>
        updateRow(facilities, where.id, data),
      delete: async ({ where }: { where: { id: string } }) => {
        const index = facilities.findIndex((row) => row.id === where.id);
        const [row] = facilities.splice(index, 1);
        return row;
      },
    },
    facilityMaintenance: {
      findMany: async () => maintenances,
      count: async () => maintenances.length,
      findUnique: async ({ where }: { where: { id: string } }) =>
        cloneRow(maintenances.find((row) => row.id === where.id)),
      create: async ({ data }: { data: Row }) => {
        const row = { id: nextId("maintenance"), ...data };
        maintenances.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Row }) =>
        updateRow(maintenances, where.id, data),
      delete: async ({ where }: { where: { id: string } }) => {
        const index = maintenances.findIndex((row) => row.id === where.id);
        const [row] = maintenances.splice(index, 1);
        return row;
      },
    },
    alert: {
      create: async ({ data }: { data: Row }) => {
        const row = { id: nextId("alert"), ...data };
        alerts.push(row);
        return row;
      },
    },
  };

  return {
    db: db as unknown as OperationsDb,
    state: { financeTransactions, facilities, maintenances, alerts },
  };
}

function createServices() {
  const fake = createFakeDb();
  const logs: Row[] = [];
  const services = createOperationsServices({
    db: fake.db,
    log: async (entry) => {
      logs.push(entry as unknown as Row);
    },
  });

  return { ...fake, logs, ...services };
}

test("void finance keeps the transaction, records the reason, and writes an audit entry", async () => {
  const { financeService, state, logs } = createServices();

  const created = await financeService.create(context, {
    type: "INCOME",
    category: "SPP",
    description: "Pembayaran SPP",
    amount: 150_000,
    transactionDate: new Date("2026-01-10"),
    status: "POSTED",
  });

  const voided = await financeService.void(
    context,
    String(created.id),
    "Salah input",
  );

  assert.equal(voided.status, "VOID");
  assert.equal(voided.voidedById, context.userId);
  assert.equal(voided.voidReason, "Salah input");
  assert.equal(state.financeTransactions.length, 1);
  assert.ok(logs.some((entry) => entry.action === "VOID"));
});

test("void finance rejects a transaction that is already void", async () => {
  const { financeService } = createServices();

  const created = await financeService.create(context, {
    type: "EXPENSE",
    category: "ATK",
    description: "Pembelian alat tulis",
    amount: 75_000,
    transactionDate: new Date("2026-01-11"),
    status: "POSTED",
  });

  await financeService.void(context, String(created.id), "Dibatalkan");

  await assert.rejects(
    () => financeService.void(context, String(created.id), "Dibatalkan lagi"),
    /sudah void/,
  );
});

test("creating a severely damaged facility raises one alert", async () => {
  const { facilityService, state } = createServices();

  const facility = await facilityService.create(context, {
    code: "LAB-1",
    name: "Laboratorium",
    location: "Gedung A",
    condition: "RUSAK_BERAT",
    notes: null,
  });

  assert.equal(state.alerts.length, 1);
  assert.equal(state.alerts[0]?.entityId, facility.id);
  assert.equal(state.alerts[0]?.severity, "WARNING");
});

test("facility update raises an alert only when the condition becomes severely damaged", async () => {
  const { facilityService, state } = createServices();

  const facility = await facilityService.create(context, {
    code: "LAB-2",
    name: "Laboratorium 2",
    location: "Gedung B",
    condition: "BAIK",
    notes: null,
  });

  await facilityService.update(context, String(facility.id), {
    condition: "RUSAK_BERAT",
  });
  await facilityService.update(context, String(facility.id), {
    condition: "RUSAK_BERAT",
  });

  assert.equal(state.alerts.length, 1);
});

test("maintenance create reports an alert and completion restores the facility condition", async () => {
  const { facilityService, maintenanceService, state } = createServices();

  const facility = await facilityService.create(context, {
    code: "Ruang-1",
    name: "Ruang Kelas 1",
    location: "Gedung C",
    condition: "RUSAK_BERAT",
    notes: null,
  });

  const maintenance = await maintenanceService.create(context, {
    facilityId: String(facility.id),
    description: "Perbaikan atap",
    status: "DILAPORKAN",
  });

  await maintenanceService.update(context, String(maintenance.id), {
    status: "SELESAI",
  });

  assert.equal(state.alerts.length, 2);
  assert.equal(facility.condition, "BAIK");
});

test("maintenance status updates do not duplicate an existing report alert", async () => {
  const { facilityService, maintenanceService, state } = createServices();

  const facility = await facilityService.create(context, {
    code: "Ruang-2",
    name: "Ruang Kelas 2",
    location: "Gedung C",
    condition: "RUSAK_RINGAN",
    notes: null,
  });

  const maintenance = await maintenanceService.create(context, {
    facilityId: String(facility.id),
    description: "Perbaikan jendela",
    status: "DILAPORKAN",
  });

  await maintenanceService.update(context, String(maintenance.id), {
    status: "DILAPORKAN",
  });
  assert.equal(state.alerts.length, 1);

  await maintenanceService.update(context, String(maintenance.id), {
    status: "DIJADWALKAN",
  });
  await maintenanceService.update(context, String(maintenance.id), {
    status: "DILAPORKAN",
  });
  assert.equal(state.alerts.length, 2);
});
