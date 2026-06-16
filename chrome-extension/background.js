import {
  CACHE_TTL_MS,
  cacheKey,
  domainFromUrl,
  fetchDomainReport,
  isCitedPayload,
} from "./shared.js";

const BADGE = {
  cited: { color: "#22c55e", text: "●" },
  unknown: { color: "#9ca3af", text: "●" },
};

async function readCache(domain) {
  const key = cacheKey(domain);
  const stored = await chrome.storage.local.get([key]);
  const entry = stored[key];
  if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry;
}

async function writeCache(report) {
  await chrome.storage.local.set({ [cacheKey(report.domain)]: report });
}

async function updateBadgeForTab(tabId, url) {
  const domain = domainFromUrl(url || "");
  if (!domain) {
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  try {
    let report = await readCache(domain);
    if (!report) {
      report = await fetchDomainReport(domain);
      await writeCache(report);
    }

    const cited = isCitedPayload(report);
    const badge = cited ? BADGE.cited : BADGE.unknown;
    await chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });
    await chrome.action.setBadgeText({ tabId, text: badge.text });
    await chrome.action.setTitle({
      tabId,
      title: cited
        ? `CitePilot: ${domain} is cited in AI search`
        : `CitePilot: No data for ${domain} — run a check`,
    });
  } catch {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE.unknown.color });
    await chrome.action.setBadgeText({ tabId, text: BADGE.unknown.text });
  }
}

async function refreshActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await updateBadgeForTab(tab.id, tab.url || "");
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await updateBadgeForTab(tabId, tab.url || "");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    await updateBadgeForTab(tabId, tab.url || changeInfo.url || "");
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_DOMAIN_REPORT") {
    const domain = message.domain;
    (async () => {
      try {
        let report = await readCache(domain);
        if (!report || message.force) {
          report = await fetchDomainReport(domain);
          await writeCache(report);
        }
        sendResponse({ ok: true, report });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Request failed",
        });
      }
    })();
    return true;
  }

  if (message?.type === "TAB_NAVIGATED") {
    const tabId = _sender.tab?.id;
    if (tabId && message.url) {
      void updateBadgeForTab(tabId, message.url);
    }
    return false;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  void refreshActiveTab();
});
