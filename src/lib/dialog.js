let active = null;
let previousFocus = null;
const focusable = () =>
  active
    ? [
        ...active.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter(
        (el) =>
          !el.disabled &&
          !el.closest("[hidden], [inert]") &&
          el.getClientRects().length,
      )
    : [];
export function closeDialog() {
  if (!active) return;
  active.classList.remove("open");
  active.setAttribute("aria-hidden", "true");
  active = null;
  if (previousFocus?.isConnected) previousFocus.focus();
  previousFocus = null;
}
export function openDialog(id) {
  const sheet = document.getElementById(id);
  if (!sheet) return;
  closeDialog();
  previousFocus = document.activeElement;
  active = sheet;
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  const dialog = sheet.querySelector('[role="dialog"]') || sheet;
  dialog.tabIndex = -1;
  (focusable()[0] || dialog).focus();
}
document.addEventListener("keydown", (event) => {
  if (!active) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeDialog();
  }
  if (event.key !== "Tab" || !active) return;
  const items = focusable();
  const first = items[0],
    last = items.at(-1);
  if (!first) {
    event.preventDefault();
    return;
  }
  if (
    !active.contains(document.activeElement) ||
    (event.shiftKey && document.activeElement === first) ||
    (!event.shiftKey && document.activeElement === last)
  ) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
});
document.addEventListener("focusin", (event) => {
  if (active && !active.contains(event.target))
    (focusable()[0] || active.querySelector('[role="dialog"]')).focus();
});
