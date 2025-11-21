import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { Vault } from "../types/vault";

const DATA_FILE =
  process.env.DATA_FILE ?? path.join(process.cwd(), "data/db.json");

interface DatabaseShape {
  vaults: Vault[];
}

async function readDb(): Promise<DatabaseShape> {
  try {
    const file = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(file) as DatabaseShape;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeDb({ vaults: [] });
      return { vaults: [] };
    }
    throw error;
  }
}

async function writeDb(data: DatabaseShape) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function createVault(payload: {
  ownerTonAddress: string;
  inactivityDays: number;
  nominees: Vault["nominees"];
  backupEmail?: string;
}): Promise<Vault> {
  const db = await readDb();
  const now = new Date().toISOString();
  const existingIndex = db.vaults.findIndex(
    (vault) =>
      vault.ownerTonAddress.toLowerCase() ===
      payload.ownerTonAddress.toLowerCase(),
  );

  const newVault: Vault = {
    vaultId: existingIndex >= 0 ? db.vaults[existingIndex].vaultId : nanoid(8),
    status: "ACTIVE",
    createdAt: existingIndex >= 0 ? db.vaults[existingIndex].createdAt : now,
    updatedAt: now,
    lastPingAt: now,
    ...payload,
  };

  if (existingIndex >= 0) {
    db.vaults[existingIndex] = newVault;
  } else {
    db.vaults.push(newVault);
  }

  await writeDb(db);
  return newVault;
}

export async function listVaults() {
  const db = await readDb();
  return db.vaults;
}

export async function findVaultByOwner(ownerTonAddress: string) {
  const db = await readDb();
  return db.vaults.find(
    (vault) =>
      vault.ownerTonAddress.toLowerCase() === ownerTonAddress.toLowerCase(),
  );
}

export async function findVaultById(vaultId: string) {
  const db = await readDb();
  return db.vaults.find((vault) => vault.vaultId === vaultId);
}

export async function updateVault(vault: Vault) {
  const db = await readDb();
  const idx = db.vaults.findIndex((item) => item.vaultId === vault.vaultId);
  if (idx === -1) {
    throw new Error("Vault not found");
  }
  db.vaults[idx] = { ...vault, updatedAt: new Date().toISOString() };
  await writeDb(db);
  return db.vaults[idx];
}

export async function recordPing(ownerTonAddress: string) {
  const vault = await findVaultByOwner(ownerTonAddress);
  if (!vault) {
    throw new Error("Vault not found");
  }
  vault.lastPingAt = new Date().toISOString();
  vault.status = "ACTIVE";
  return updateVault(vault);
}

