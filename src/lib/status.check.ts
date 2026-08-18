import {
  countApplicationFilter,
  isDirectoryPartner,
  isRegistrationQueue,
  loginBlockedMessage,
  matchesApplicationFilter,
  STATUS_LABEL,
} from "./status.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(STATUS_LABEL.pending, "Новые", "pending label");
assertEqual(STATUS_LABEL.accepted, "На проверке", "accepted label");
assertEqual(STATUS_LABEL.approved, "Одобрено", "approved label");
assertEqual(STATUS_LABEL.active, "Активен", "active label");
assertEqual(STATUS_LABEL.rejected, "Отклонено", "rejected label");

assertEqual(isRegistrationQueue("approved"), true, "approved stays in queue");
assertEqual(isRegistrationQueue("active"), false, "active leaves queue");
assertEqual(isDirectoryPartner("active"), true, "active is a partner");
assertEqual(loginBlockedMessage("approved"), null, "approved can log in");
assertEqual(loginBlockedMessage("active"), null, "active can log in");
assertEqual(Boolean(loginBlockedMessage("pending")), true, "pending blocked");

const queue = [
  { status: "pending" as const },
  { status: "pending" as const },
  { status: "accepted" as const },
  { status: "approved" as const },
  { status: "rejected" as const },
];

assertEqual(countApplicationFilter(queue, "all"), 5, "all count");
assertEqual(countApplicationFilter(queue, "pending"), 2, "new count");
assertEqual(matchesApplicationFilter("accepted", "accepted"), true, "review match");
assertEqual(matchesApplicationFilter("rejected", "all"), true, "all includes rejected");

console.log("status checks passed");
