import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { sanitizePartnerDocuments } from "../shared/partner-docs.ts";
import { createdHistoryEvent, ensureHistory, type HistoryEvent } from "../shared/history.ts";
import { normalizeStatus, type ApplicationStatus } from "../shared/status.ts";
import { applyManagerChange, applyStatusChange } from "../shared/workflow.ts";

export type { ApplicationStatus, HistoryEvent };

type PartnerDocument = {
  key: string;
  fileName: string;
  size: number;
  mime: string;
};

export type PartnerRecord = {
  id: string;
  phone: string;
  passwordHash: string;
  companyName: string;
  contactName: string;
  unp: string;
  email: string;
  documents: PartnerDocument[];
  createdAt: string;
  status: ApplicationStatus;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
};

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  unp: string;
  email: string;
  documents: PartnerDocument[];
  createdAt: string;
  status: ApplicationStatus;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
};

function withDefaults(record: PartnerRecord): PartnerRecord {
  const createdAt = record.createdAt;
  return {
    ...record,
    unp: record.unp ?? "",
    email: record.email ?? "",
    documents: Array.isArray(record.documents) ? record.documents : [],
    status: normalizeStatus(record.status),
    responsibleManager: record.responsibleManager || record.activatedBy || "",
    activatedBy: record.activatedBy ?? "",
    activatedAt: record.activatedAt ?? "",
    history: ensureHistory(record.history, createdAt),
  };
}

function workflowOf(record: PartnerRecord) {
  return {
    status: record.status,
    responsibleManager: record.responsibleManager,
    activatedBy: record.activatedBy,
    activatedAt: record.activatedAt,
    history: record.history,
  };
}

export function toPublicPartner(record: PartnerRecord): PublicPartner {
  const normalized = withDefaults(record);
  return {
    id: normalized.id,
    phone: normalized.phone,
    companyName: normalized.companyName,
    contactName: normalized.contactName,
    unp: normalized.unp,
    email: normalized.email,
    documents: normalized.documents,
    createdAt: normalized.createdAt,
    status: normalized.status,
    responsibleManager: normalized.responsibleManager,
    activatedBy: normalized.activatedBy,
    activatedAt: normalized.activatedAt,
    history: normalized.history,
  };
}

export class PartnerStore {
  constructor(private readonly filePath: string) {}

  async list(): Promise<PartnerRecord[]> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as PartnerRecord[];
      return Array.isArray(parsed) ? parsed.map(withDefaults) : [];
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

  async findByUnp(unp: string): Promise<PartnerRecord | undefined> {
    if (!unp) {
      return undefined;
    }
    const partners = await this.list();
    return partners.find((item) => item.unp === unp);
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
    unp?: string;
    email?: string;
    documents?: PartnerDocument[];
  }): Promise<PartnerRecord> {
    const partners = await this.list();
    const createdAt = new Date().toISOString();
    const record: PartnerRecord = {
      id: randomUUID(),
      phone: input.phone,
      passwordHash: input.passwordHash,
      companyName: input.companyName,
      contactName: input.contactName,
      unp: input.unp ?? "",
      email: input.email ?? "",
      documents: sanitizePartnerDocuments(input.documents),
      createdAt,
      status: "pending",
      responsibleManager: "",
      activatedBy: "",
      activatedAt: "",
      history: [createdHistoryEvent(createdAt)],
    };
    partners.push(record);
    await this.write(partners);
    return record;
  }

  async setStatus(
    id: string,
    status: ApplicationStatus,
    manager = "",
  ): Promise<PartnerRecord | undefined> {
    const partners = await this.list();
    const index = partners.findIndex((item) => item.id === id);
    if (index < 0) {
      return undefined;
    }
    const current = partners[index];
    if (!current) {
      return undefined;
    }
    partners[index] = { ...current, ...applyStatusChange(workflowOf(current), status, manager) };
    await this.write(partners);
    return partners[index];
  }

  async activateCabinet(id: string): Promise<PartnerRecord | undefined> {
    const current = await this.findById(id);
    if (!current) {
      return undefined;
    }
    if (normalizeStatus(current.status) !== "approved") {
      return current;
    }
    return this.setStatus(id, "active", "Партнёр");
  }

  async setManager(id: string, manager: string, actor: string): Promise<PartnerRecord | undefined> {
    const partners = await this.list();
    const index = partners.findIndex((item) => item.id === id);
    if (index < 0) {
      return undefined;
    }
    const current = partners[index];
    if (!current) {
      return undefined;
    }
    const result = applyManagerChange(workflowOf(current), manager, actor);
    if (!result.ok) {
      return undefined;
    }
    partners[index] = { ...current, ...result.state };
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
