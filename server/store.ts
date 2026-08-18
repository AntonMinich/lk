import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type PartnerRecord = {
  id: string;
  phone: string;
  passwordHash: string;
  companyName: string;
  contactName: string;
  createdAt: string;
};

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  createdAt: string;
};

export function toPublicPartner(record: PartnerRecord): PublicPartner {
  return {
    id: record.id,
    phone: record.phone,
    companyName: record.companyName,
    contactName: record.contactName,
    createdAt: record.createdAt,
  };
}

export class PartnerStore {
  constructor(private readonly filePath: string) {}

  async list(): Promise<PartnerRecord[]> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as PartnerRecord[];
      return Array.isArray(parsed) ? parsed : [];
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
    };
    partners.push(record);
    await this.write(partners);
    return record;
  }

  private async write(partners: PartnerRecord[]) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(partners, null, 2)}\n`, "utf8");
    await rename(tempPath, this.filePath);
  }
}
