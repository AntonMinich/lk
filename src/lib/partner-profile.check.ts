import {
  filterPartnerUsers,
  goodsSourceLabel,
  isPartnerProfile,
  matchesPartnerUserFilter,
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

console.log("partner-profile checks passed");
