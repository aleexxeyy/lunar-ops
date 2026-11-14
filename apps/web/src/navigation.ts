export const pageIds = ["overview", "station", "crew", "journal"] as const;
export type Page = (typeof pageIds)[number];

export function currentPage(): Page {
  const candidate = window.location.hash.replace(/^#\/?/, "");
  return pageIds.find((page) => page === candidate) ?? "overview";
}

export function navigateTo(page: Page, replace = false): void {
  const hash = `#/${page}`;
  if (window.location.hash !== hash) {
    window.history[replace ? "replaceState" : "pushState"](null, "", hash);
  }
}
