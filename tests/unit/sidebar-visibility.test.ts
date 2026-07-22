import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const sidebarVisibility = await import("../../src/shared/constants/sidebarVisibility.ts");
const repoRoot = join(import.meta.dirname, "../..");

function getSectionItemIds(section) {
  return section.children.flatMap((child) =>
    child.type === "group" ? child.items.map((item) => item.id) : [child.id]
  );
}

function getSectionItems(section) {
  return section.children.flatMap((child) =>
    child.type === "group" ? child.items : [child]
  );
}

test("monitoring section items place logs before console logs", () => {
  const section = sidebarVisibility.SIDEBAR_SECTIONS.find(
    (s) => s.id === "monitoring"
  );

  assert.ok(section, "expected monitoring sidebar section to exist");
  const ids = getSectionItemIds(section);
  assert.ok(ids.indexOf("logs") < ids.indexOf("logs-console"));
  assert.ok(ids.includes("logs"));
  assert.ok(ids.includes("logs-console"));
  assert.ok(ids.includes("analytics"));
});

test("sidebar sections order starts with home, omni-proxy, monitoring", () => {
  const sectionIds = sidebarVisibility.SIDEBAR_SECTIONS.map((s) => s.id);
  assert.deepEqual(sectionIds.slice(0, 3), ["home", "omni-proxy", "monitoring"]);
});

test("sidebar visibility drops stale entries from saved settings", () => {
  const allSidebarItemIds = sidebarVisibility.SIDEBAR_SECTIONS.flatMap((section) =>
    getSectionItems(section).map((item) => item.id)
  );

  assert.equal(sidebarVisibility.HIDEABLE_SIDEBAR_ITEM_IDS.includes("auto-combo"), false);
  assert.equal(allSidebarItemIds.includes("auto-combo"), false);
  assert.deepEqual(sidebarVisibility.normalizeHiddenSidebarItems(["auto-combo", "home"]), ["home"]);
});

test("legacy dashboard routes redirect to their consolidated surfaces", async () => {
  const autoComboPage = await readFile(
    join(repoRoot, "src/app/(dashboard)/dashboard/auto-combo/page.tsx"),
    "utf8"
  );
  const usagePage = await readFile(
    join(repoRoot, "src/app/(dashboard)/dashboard/usage/page.tsx"),
    "utf8"
  );

  assert.match(autoComboPage, /redirect\("\/dashboard\/combos\?filter=intelligent"\)/);
  assert.match(usagePage, /redirect\("\/dashboard\/logs"\)/);

  const compressionPage = await readFile(
    join(repoRoot, "src/app/(dashboard)/dashboard/compression/page.tsx"),
    "utf8"
  );
  assert.match(compressionPage, /redirect\("\/dashboard\/context\/caveman"\)/);
});
