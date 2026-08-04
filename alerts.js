import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8/+esm";
import { APP_CONFIG } from "./config.js";

const supabase = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const $ = (selector) => document.querySelector(selector);
const state = { user: null, watchlist: [], alerts: [], editingCardId: null };

const els = {
  list: $("#alerts-list"),
  empty: $("#empty-alerts"),
  unread: $("#unread-alerts"),
  markRead: $("#mark-alerts-read"),
  panel: $("#alerts-panel"),
  dialog: $("#alert-dialog"),
  form: $("#alert-form"),
  cardName: $("#alert-card-name"),
  enabled: $("#alerts-enabled"),
  move: $("#alert-move"),
  above: $("#alert-above"),
  below: $("#alert-below"),
  toast: $("#toast"),
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
}

function showToast(message, isError = false) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.toggle("error", isError);
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 3500);
}

function relativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function renderAlerts() {
  if (!els.list || !els.empty || !els.unread) return;
  const unreadCount = state.alerts.filter((alert) => !alert.read_at).length;
  els.unread.textContent = String(unreadCount);
  els.unread.className = unreadCount ? "negative" : "";
  els.empty.hidden = state.alerts.length > 0;
  if (els.markRead) els.markRead.disabled = unreadCount === 0;

  els.list.innerHTML = state.alerts.map((alert) => {
    const upward = alert.alert_type === "move_up" || alert.alert_type === "price_above";
    return `<article class="alert-row ${alert.read_at ? "" : "unread"}">
      <div class="alert-symbol ${upward ? "positive" : "negative"}">${upward ? "↗" : "↘"}</div>
      <div class="alert-copy"><strong>${escapeHtml(alert.card_name)}</strong><p>${escapeHtml(alert.message)}</p><small>${relativeTime(alert.triggered_at)}</small></div>
      ${alert.read_at ? "" : '<span class="unread-dot" aria-label="Unread"></span>'}
    </article>`;
  }).join("");
}

function decorateWatchlist() {
  document.querySelectorAll(".watch-row .remove-card").forEach((removeButton) => {
    const id = removeButton.dataset.id;
    if (!id || removeButton.closest(".row-actions")) return;
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const settings = document.createElement("button");
    settings.className = "row-menu alert-settings";
    settings.type = "button";
    settings.dataset.id = id;
    settings.setAttribute("aria-label", "Open price alert settings");
    settings.textContent = "♢";
    removeButton.parentElement.insertBefore(actions, removeButton);
    actions.append(settings, removeButton);
    settings.addEventListener("click", () => openSettings(id));
  });
}

async function loadAlertData() {
  const { data: sessionData } = await supabase.auth.getSession();
  state.user = sessionData.session?.user || null;
  if (!state.user) return;
  const [watchResult, alertResult] = await Promise.all([
    supabase.from("promo_watchlist").select("id,card_name,alerts_enabled,alert_move_pct,alert_above,alert_below").eq("is_active", true),
    supabase.from("promo_alerts").select("*").order("triggered_at", { ascending: false }).limit(50),
  ]);
  if (watchResult.error) throw watchResult.error;
  if (alertResult.error) throw alertResult.error;
  state.watchlist = watchResult.data || [];
  state.alerts = alertResult.data || [];
  renderAlerts();
  decorateWatchlist();
}

function openSettings(id) {
  const card = state.watchlist.find((item) => item.id === id);
  if (!card || !els.dialog) return;
  state.editingCardId = id;
  els.cardName.textContent = card.card_name;
  els.enabled.checked = card.alerts_enabled !== false;
  els.move.value = Number(card.alert_move_pct || 5);
  els.above.value = card.alert_above ?? "";
  els.below.value = card.alert_below ?? "";
  if (!els.dialog.open) els.dialog.showModal();
}

async function saveSettings(event) {
  event.preventDefault();
  if (!state.editingCardId) return;
  const move = Number(els.move.value || 5);
  const above = els.above.value === "" ? null : Number(els.above.value);
  const below = els.below.value === "" ? null : Number(els.below.value);
  if (!Number.isFinite(move) || move < 0.5 || move > 100) return showToast("Enter a move threshold between 0.5% and 100%.", true);
  if (above !== null && (!Number.isFinite(above) || above < 0)) return showToast("The high-price target is invalid.", true);
  if (below !== null && (!Number.isFinite(below) || below < 0)) return showToast("The buy-price target is invalid.", true);

  const { error } = await supabase.from("promo_watchlist").update({
    alerts_enabled: els.enabled.checked,
    alert_move_pct: move,
    alert_above: above,
    alert_below: below,
  }).eq("id", state.editingCardId);
  if (error) return showToast(error.message, true);
  els.dialog.close();
  await loadAlertData();
  showToast("Alert settings saved.");
}

async function markAllRead() {
  const ids = state.alerts.filter((alert) => !alert.read_at).map((alert) => alert.id);
  if (!ids.length) return;
  els.markRead.disabled = true;
  const { error } = await supabase.from("promo_alerts").update({ read_at: new Date().toISOString() }).in("id", ids);
  if (error) {
    els.markRead.disabled = false;
    return showToast(error.message, true);
  }
  await loadAlertData();
  showToast("Alerts marked as read.");
}

if (els.form) els.form.addEventListener("submit", saveSettings);
if (els.markRead) els.markRead.addEventListener("click", markAllRead);
$("#nav-alerts")?.addEventListener("click", () => els.panel?.scrollIntoView({ behavior: "smooth" }));

const watchlistNode = $("#watchlist");
if (watchlistNode) new MutationObserver(decorateWatchlist).observe(watchlistNode, { childList: true, subtree: true });

supabase.auth.onAuthStateChange((_event, session) => {
  state.user = session?.user || null;
  if (state.user) setTimeout(() => loadAlertData().catch((error) => showToast(error.message, true)), 0);
});

window.addEventListener("focus", () => state.user && loadAlertData().catch(() => {}));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.user) loadAlertData().catch(() => {});
});
setInterval(() => state.user && loadAlertData().catch(() => {}), 120000);

loadAlertData().catch((error) => showToast(error.message, true));
