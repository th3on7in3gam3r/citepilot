import { domainFromUrl, getApiOrigin } from "./shared.js";

const $ = (id) => document.getElementById(id);

let currentDomain = "";

function setVisible(section) {
  ["loading", "content", "error"].forEach((id) => {
    $(id).classList.toggle("hidden", id !== section);
  });
}

function renderPlatforms(platforms) {
  const list = $("platforms");
  list.innerHTML = "";
  if (!platforms.length) {
    const li = document.createElement("li");
    li.textContent = "No platform data yet";
    list.appendChild(li);
    return;
  }

  for (const row of platforms) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = row.name;
    const status = document.createElement("span");
    status.className = row.cited ? "ok" : "no";
    status.textContent = row.cited ? "Cited ✓" : "Not cited ✗";
    li.append(name, status);
    list.appendChild(li);
  }
}

function renderWorkspace(workspace) {
  const block = $("workspace");
  const list = $("prompts");
  list.innerHTML = "";

  if (!workspace?.prompts?.length) {
    block.classList.add("hidden");
    return;
  }

  block.classList.remove("hidden");
  for (const prompt of workspace.prompts) {
    const li = document.createElement("li");
    li.textContent = prompt;
    list.appendChild(li);
  }
}

async function render(report) {
  const origin = await getApiOrigin();
  const cited = report.cited;
  const hasAudit = report.hasAudit;

  $("status").textContent = cited
    ? "This site appears in AI search citations."
    : hasAudit
      ? "Audit on file, but citation coverage is limited on top platforms."
      : "No CitePilot audit data yet — run a free check.";

  const scoreRow = $("score-row");
  if (report.score != null) {
    scoreRow.classList.remove("hidden");
    $("score").textContent = `${report.score}/100`;
  } else {
    scoreRow.classList.add("hidden");
  }

  renderPlatforms(report.platforms || []);
  renderWorkspace(report.workspace);

  $("full-report").href = `${origin}/audit?domain=${encodeURIComponent(currentDomain)}`;

  const secondary = $("secondary-cta");
  if (report.signedIn && report.workspace) {
    secondary.textContent = "Add to workspace →";
    secondary.href = `${origin}/dashboard/content?domain=${encodeURIComponent(currentDomain)}`;
    secondary.classList.remove("hidden");
  } else if (report.signedIn) {
    secondary.textContent = "Add domain to workspace →";
    secondary.href = `${origin}/dashboard/settings?domain=${encodeURIComponent(currentDomain)}`;
    secondary.classList.remove("hidden");
  } else {
    secondary.textContent = "Get weekly monitoring →";
    secondary.href = `${origin}/pricing?ref=extension`;
    secondary.classList.remove("hidden");
  }

  setVisible("content");
}

async function load(force = false) {
  if (!currentDomain) {
    $("domain").textContent = "No site detected";
    $("status").textContent = "Open a public website tab to check citations.";
    setVisible("content");
    return;
  }

  setVisible("loading");

  chrome.runtime.sendMessage(
    { type: "GET_DOMAIN_REPORT", domain: currentDomain, force },
    (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        setVisible("error");
        return;
      }
      void render(response.report);
    },
  );
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentDomain = domainFromUrl(tab?.url || "");
  $("domain").textContent = currentDomain || "No site detected";

  $("retry").addEventListener("click", () => void load(true));
  await load(false);
}

void init();
