/** Shared patterns for benign Chrome extension messaging noise. */
export const EXTENSION_CONSOLE_NOISE_PATTERNS = [
  "Could not establish connection",
  "Receiving end does not exist",
  "message port closed",
  "before a response was received",
  "runtime.lastError",
  "Unchecked runtime.lastError",
] as const;

export function isBenignExtensionConsoleMessage(args: unknown[]): boolean {
  const text = args.map((arg) => String(arg)).join(" ");
  return EXTENSION_CONSOLE_NOISE_PATTERNS.some((pattern) => text.includes(pattern));
}

/** Inline script — patch console before React so extension noise is filtered early. */
export const extensionConsoleNoiseScript = `(function(){try{var p=["Could not establish connection","Receiving end does not exist","message port closed","before a response was received","runtime.lastError","Unchecked runtime.lastError"];function benign(a){var t=Array.prototype.map.call(a,function(x){return String(x);}).join(" ");for(var i=0;i<p.length;i++){if(t.indexOf(p[i])!==-1)return true;}return false;}function wrap(m){var o=console[m];if(typeof o!=="function")return;console[m]=function(){if(benign(arguments))return;o.apply(console,arguments);};}["error","warn","log","info","debug"].forEach(wrap);window.addEventListener("error",function(e){if(benign([e.message||""])){e.preventDefault();}});}catch(e){}})();`;
