(function () {
  "use strict";

  function notify() {
    try {
      chrome.runtime.sendMessage({
        type: "TAB_NAVIGATED",
        url: location.href,
      });
    } catch {
      /* extension context invalidated */
    }
  }

  notify();

  const pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(this, arguments);
    notify();
  };

  window.addEventListener("popstate", notify);
})();
