import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { normalizeStatus, type ApplicationStatus } from "../shared/status.ts";

export type { ApplicationStatus };

export type PartnerRecord = {
  id: string;
  phone: string;
  passwordHash: string;
  companyName: string;
  contactName: string;
  createdAt: string;
  status: ApplicationStatus;
};

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  createdAt: string;
  status: ApplicationStatus;
};

function withStatus(record: PartnerRecord): PartnerRecord {
  return { ...record, status: normalizeStatus(record.status) };
}

export function toPublicPartner(record: PartnerRecord): PublicPartner {
  const normalized = withStatus(record);
  return {
    id: normalized.id,
    phone: normalized.phone,
    companyName: normalized.companyName,
    contactName: normalized.contactName,
    createdAt: normalized.createdAt,
    status: normalized.status,
  };
}

export class PartnerStore {
  constructor(private readonly filePath: string) {}

  async list(): Promise<PartnerRecord[]> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as PartnerRecord[];
      return Array.isArray(parsed) ? parsed.map(withStatus) : [];
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async findByPhone(phone: string): Promise<PartnerRecord | undefined> {
    const partners = await this.list();
    return partners.find((item) => item.phone === phone);
  }

  async findById(id: string): Promise<PartnerRecord | undefined> {
    const partners = await this.list();
    return partners.find((item) => item.id === id);
  }

  async create(input: {
    phone: string;
    passwordHash: string;
    companyName: string;
    contactName: string;
  }): Promise<PartnerRecord> {
    const partners = await this.list();
    const record: PartnerRecord = {
      id: randomUUID(),
      phone: input.phone,
      passwordHash: input.passwordHash,
      companyName: input.companyName,
      contactName: input.contactName,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    partners.push(record);
    await this.write(partners);
    return record;
  }

  async setStatus(id: string, status: ApplicationStatus): Promise<PartnerRecord | undefined> {
    const partners = await this.list();
    const index = partners.findIndex((item) => item.id === id);
    if (index < 0) {
      return undefined;
    }
    partners[index] = { ...partners[index], status };
    await this.write(partners);
    return partners[index];
  }

  private async write(partners: PartnerRecord[]) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(partners, null, 2)}\n`, "utf8");
    await rename(tempPath, this.filePath);
  }
}
