export type PartnerComment = {
  id: string;
  partnerId: string;
  text: string;
  author: string;
  createdAt: string;
};

const COMMENTS_KEY = "lk-partner-comments";

function readAll(): PartnerComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PartnerComment[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.partnerId === "string" &&
        typeof item.text === "string" &&
        item.text.trim(),
    );
  } catch {
    return [];
  }
}

function writeAll(items: PartnerComment[]) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(items));
}

export function listPartnerComments(partnerId: string): PartnerComment[] {
  return readAll()
    .filter((item) => item.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addPartnerComment(input: {
  partnerId: string;
  text: string;
  author: string;
}): PartnerComment | null {
  const text = input.text.trim().slice(0, 4000);
  if (!text || !input.partnerId) {
    return null;
  }
  const comment: PartnerComment = {
    id: crypto.randomUUID(),
    partnerId: input.partnerId,
    text,
    author: input.author.trim() || "Сотрудник",
    createdAt: new Date().toISOString(),
  };
  writeAll([...readAll(), comment]);
  return comment;
}

export function countPartnerComments(partnerId: string): number {
  return listPartnerComments(partnerId).length;
}
