(function () {
  "use strict";

  var ORIGIN = "https://getcitepilot.com";
  var script =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');
  if (!script) return;

  var domain = (script.getAttribute("data-domain") || "").trim();
  if (!domain) return;

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function scoreColor(n) {
    if (n <= 40) return "#ef4444";
    if (n <= 70) return "#f59e0b";
    return "#22c55e";
  }

  function postClick() {
    try {
      fetch(ORIGIN + "/api/widget/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain, action: "click" }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  function auditUrl() {
    return (
      ORIGIN +
      "/audit?ref=badge&domain=" +
      encodeURIComponent(domain)
    );
  }

  var root = document.createElement("div");
  root.setAttribute("data-citepilot-widget", domain);
  root.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483000;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.3;color:#fff;pointer-events:auto;";

  var card = document.createElement("button");
  card.type = "button";
  card.setAttribute("aria-label", "GEO Score by CitePilot");
  card.style.cssText =
    "display:flex;flex-direction:column;align-items:flex-end;gap:0;border:0;padding:0;background:transparent;cursor:pointer;text-align:right;";

  var pill = document.createElement("div");
  pill.style.cssText =
    "display:flex;align-items:center;gap:8px;background:#1a1a1a;border-radius:999px;padding:6px 12px 6px 8px;box-shadow:0 4px 24px rgba(0,0,0,.35);" +
    (reducedMotion ? "" : "transition:transform .2s ease,box-shadow .2s ease;");

  var mark = document.createElement("span");
  mark.style.cssText =
    "width:18px;height:18px;border-radius:5px;background:#070b14;display:inline-block;flex-shrink:0;background-image:url('" +
    ORIGIN +
    "/logo-mark.svg');background-size:cover;";

  var label = document.createElement("span");
  label.textContent = "GEO Score";
  label.style.cssText = "font-weight:600;color:#fff;";

  var scoreEl = document.createElement("span");
  scoreEl.textContent = "…";
  scoreEl.style.cssText =
    "font-weight:800;color:#f59e0b;min-width:2ch;text-align:center;";

  pill.appendChild(mark);
  pill.appendChild(label);
  pill.appendChild(scoreEl);

  var powered = document.createElement("span");
  powered.textContent = "Powered by CitePilot";
  powered.style.cssText =
    "margin-top:4px;font-size:10px;color:rgba(255,255,255,.55);opacity:0;max-height:0;overflow:hidden;" +
    (reducedMotion ? "" : "transition:opacity .2s ease,max-height .2s ease;");

  var detail = document.createElement("div");
  detail.style.cssText =
    "margin-top:6px;padding:8px 10px;background:#111;border-radius:10px;border:1px solid #333;opacity:0;max-height:0;overflow:hidden;text-align:left;min-width:180px;" +
    (reducedMotion ? "" : "transition:opacity .2s ease,max-height .2s ease;");

  function setExpanded(on) {
    powered.style.opacity = on ? "1" : "0";
    powered.style.maxHeight = on ? "20px" : "0";
    detail.style.opacity = on ? "1" : "0";
    detail.style.maxHeight = on ? "120px" : "0";
    if (!reducedMotion) {
      pill.style.transform = on ? "translateY(-2px)" : "";
      pill.style.boxShadow = on
        ? "0 8px 32px rgba(0,0,0,.45)"
        : "0 4px 24px rgba(0,0,0,.35)";
    }
  }

  card.addEventListener("mouseenter", function () {
    setExpanded(true);
  });
  card.addEventListener("mouseleave", function () {
    setExpanded(false);
  });
  card.addEventListener("focus", function () {
    setExpanded(true);
  });
  card.addEventListener("blur", function () {
    setExpanded(false);
  });
  card.addEventListener("click", function () {
    postClick();
    window.open(auditUrl(), "_blank", "noopener,noreferrer");
  });

  card.appendChild(pill);
  card.appendChild(powered);
  card.appendChild(detail);
  root.appendChild(card);
  document.body.appendChild(root);

  function renderPlatforms(platforms) {
    detail.innerHTML = "";
    (platforms || []).forEach(function (p) {
      var row = document.createElement("div");
      row.style.cssText = "display:flex;justify-content:space-between;gap:12px;padding:2px 0;color:#ddd;";
      var name = document.createElement("span");
      name.textContent = p.name + ":";
      var status = document.createElement("span");
      status.textContent = p.cited ? "Cited ✓" : "Missing ✗";
      status.style.color = p.cited ? "#22c55e" : "#ef4444";
      row.appendChild(name);
      row.appendChild(status);
      detail.appendChild(row);
    });
  }

  fetch(
    ORIGIN +
      "/api/widget/score/" +
      encodeURIComponent(domain) +
      "?format=json",
    { credentials: "omit" },
  )
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data.hasAudit && data.score != null) {
        scoreEl.textContent = String(data.score);
        scoreEl.style.color = scoreColor(data.score);
      } else {
        scoreEl.textContent = "?";
        scoreEl.style.color = "#f59e0b";
        label.textContent = "Get GEO Score";
      }
      renderPlatforms(data.platforms || []);
    })
    .catch(function () {
      scoreEl.textContent = "?";
    });
})();
