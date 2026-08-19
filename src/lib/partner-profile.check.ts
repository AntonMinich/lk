import {
  filterPartnerUsers,
  findPartnerUser,
  goodsSourceLabel,
  isPartnerProfile,
  matchesPartnerUserFilter,
  partnerCardSectionHref,
  savePartnerProfile,
  seedPartnerProfile,
  shiftPartnerPhone,
} from "./partner-profile.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const partner = {
  id: "partner-1",
  companyName: "ООО «Поставщик товаров»",
  contactName: "Никитин Спартак Сергеевич",
  phone: "+375291112233",
  email: "shop@example.by",
  unp: "234567890",
};

const profile = seedPartnerProfile(partner);

assertEqual(isPartnerProfile(profile), true, "seed is a profile");
assertEqual(profile.goodsSource, "api", "goods source");
assertEqual(goodsSourceLabel(profile.goodsSource), "API", "goods source label");
assertEqual(profile.users[0]?.fullName, partner.contactName, "admin is contact");
assertEqual(profile.users[0]?.role, "Администратор", "admin role");
assertEqual(profile.users[0]?.status, "activated", "admin activated");
assertEqual(profile.users[0]?.phone, partner.phone, "admin phone");
assertEqual(profile.settings.integrationCode, "FC-234567890", "integration code");
assertEqual(profile.settings.notifyEmail, partner.email, "notify email");
assertEqual(profile.pointsOfSale.length, 2, "two outlets");
assertEqual(profile.pointsOfSale[0]?.city, "Минск", "minsk outlet");
assertEqual(profile.financing.currency, "BYN", "financing currency");
assertEqual(profile.financing.advanceMin, "20%", "advance");

assertEqual(matchesPartnerUserFilter("activated", "all"), true, "all includes activated");
assertEqual(filterPartnerUsers(profile.users, "activated").length, 1, "one activated user");
assertEqual(filterPartnerUsers(profile.users, "invited").length, 1, "one invited user");
assertEqual(filterPartnerUsers(profile.users, "blocked").length, 0, "no blocked users");
assertEqual(filterPartnerUsers(profile.users, "all").length, 2, "all users");

assertEqual(shiftPartnerPhone("+375291112233", 17), "+375291112250", "shifted phone");
assertEqual(shiftPartnerPhone("bad", 3), "bad", "invalid phone stays");
assertEqual(partnerCardSectionHref("/admin/directory/1", ""), "/admin/directory/1", "overview href");
assertEqual(partnerCardSectionHref("/admin/directory/1", "settings"), "/admin/directory/1/settings", "settings href");
assertEqual(findPartnerUser(profile, `${partner.id}-user-admin`)?.role, "Администратор", "find admin user");

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.get(key) ?? null;
    },
    key(index: number) {
      return [...memory.keys()][index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    setItem(key: string, value: string) {
      memory.set(key, String(value));
    },
  } satisfies Storage,
  configurable: true,
});

const saved = savePartnerProfile({
  ...profile,
  settings: { ...profile.settings, goodsSource: "file", comment: "Файл прайса" },
});
assertEqual(saved.goodsSource, "file", "save syncs goods source");
assertEqual(saved.settings.comment, "Файл прайса", "save comment");

console.log("partner-profile checks passed");
