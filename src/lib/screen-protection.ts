export function initScreenProtection() {
  if (typeof window === "undefined") return;

  // Disable right-click context menu
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Disable common screenshot/copy keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // PrintScreen
    if (e.key === "PrintScreen") {
      e.preventDefault();
    }
    // Ctrl/Cmd + Shift + S (screenshot tools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
    }
    // Ctrl/Cmd + Shift + 3/4/5 (macOS screenshots)
    if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
      e.preventDefault();
    }
    // Ctrl/Cmd + P (print)
    if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
      e.preventDefault();
    }
  });

  // Disable drag on images
  document.addEventListener("dragstart", (e) => {
    if (e.target instanceof HTMLImageElement) {
      e.preventDefault();
    }
  });

  // Inject CSS protections
  const style = document.createElement("style");
  style.textContent = `
    body {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    /* Allow text selection in form inputs */
    input, textarea, [contenteditable="true"] {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
    img {
      pointer-events: none !important;
      -webkit-user-drag: none !important;
    }
    @media print {
      body { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}
