import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8/+esm";
import { APP_CONFIG } from "./config.js";

const supabase = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const palette = ["#f4c84a", "#9a78ff", "#4e9cff", "#ff665f"];

const state = {
  user: null,
  watchlist: [],
  history: [],
  searchCards: [],
  chartRange: 7,
  authMode: "signin",
  busy: false,
};

const els = {
  authScreen: $("#auth-screen"), app: $("#app"), authForm: $("#auth-form"),
  authEmail: $("#auth-email"), authPassword: $("#auth-password"), authTitle: $("#auth-title"),
  authSubmit: $("#auth-submit"), authToggle: $("#auth-toggle"), authMessage: $("#auth-message"),
  dialog: $("#search-dialog"), searchForm: $("#search-form"), searchInput: $("#search-input"),
  searchStatus: $("#search-status"), searchResults: $("#search-results"), watchlist: $("#watchlist"),
  emptyWatchlist: $("#empty-watchlist"), refresh: $("#refresh-prices"), toast: $("#toast"),
  setupBanner: $("#setup-banner"), chart: $("#price-chart"), chartLegend: $("#chart-legend"),
};

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}
function pct(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
}
function displayCondition(value) {
  const map = { NM: "Near Mint", LP: "Lightly Played", MP: "Moderately Played", HP: "Heavily Played", DMG: "Damaged" };
  return map[value] || value || "Unspecified";
}
function unixToIso(seconds) {
  if (!seconds || !Number.isFinite(Number(seconds))) return new Date().toISOString();
  return new Date(Number(seconds) * 1000).toISOString();
}
function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle("error", isError);
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 3500);
}

async function providerCall(body) {
  const { data, error } = await supabase.functions.invoke(APP_CONFIG.priceFunctionName, { body });
  if (error) {
    const context = error.context;
    let payload = null;
    try { payload = context ? await context.json() : null; } catch { /* ignore */ }
    const message = payload?.error || error.message || "The pricing service could not be reached.";
    if (payload?.setupRequired || /JUSTTCG_API_KEY/i.test(message)) els.setupBanner.hidden = false;
    throw new Error(message);
  }
  if (data?.setupRequired) els.setupBanner.hidden = false;
  return data;
}

async function handleAuth(event) {
  event.preventDefault();
  els.authMessage.textContent = "";
  els.authSubmit.disabled = true;
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  try {
    const result = state.authMode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: new URL("./", window.location.href).href },
        });
    if (result.error) throw result.error;
    if (state.authMode === "signup" && !result.data.session) {
      els.authMessage.textContent = "Account created. Check your email to confirm it, then sign in.";
    }
  } catch (error) {
    els.authMessage.textContent = error.message;
  } finally {
    els.authSubmit.disabled = false;
  }
}

function toggleAuthMode() {
  state.authMode = state.authMode === "signin" ? "signup" : "signin";
  const signingIn = state.authMode === "signin";
  els.authTitle.textContent = signingIn ? "Sign in" : "Create account";
  els.authSubmit.textContent = signingIn ? "Sign in" : "Create account";
  els.authToggle.textContent = signingIn ? "Create an account" : "I already have an account";
  els.authPassword.autocomplete = signingIn ? "current-password" : "new-password";
  els.authMessage.textContent = "";
}

async function loadDashboard() {
  if (!state.user) return;
  const [watchResult, historyResult] = await Promise.all([
    supabase.from("promo_watchlist").select("*").eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("promo_price_history").select("*").order("observed_at", { ascending: true }).limit(5000),
  ]);
  if (watchResult.error) throw watchResult.error;
  if (historyResult.error) throw historyResult.error;
  state.watchlist = watchResult.data || [];
  state.history = historyResult.data || [];
  renderDashboard();
}

function renderDashboard() {
  const total = state.watchlist.reduce((sum, card) => sum + Number(card.current_price || 0), 0);
  const changes = state.watchlist.map((card) => Number(card.price_change_24h || 0));
  const average = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const pulse = state.watchlist.length ? Math.max(0, Math.min(100, Math.round(50 + average * 6))) : null;

  $("#watchlist-value").textContent = money(total);
  $("#watchlist-count").textContent = `${state.watchlist.length} tracked card${state.watchlist.length === 1 ? "" : "s"}`;
  $("#average-change").textContent = state.watchlist.length ? pct(average) : "—";
  $("#average-change").className = average >= 0 ? "positive" : "negative";
  $("#market-pulse").textContent = pulse ?? "—";
  $("#market-label").textContent = pulse == null ? "Add cards to begin" : pulse >= 65 ? "Strong" : pulse >= 45 ? "Steady" : "Cooling";

  els.emptyWatchlist.hidden = state.watchlist.length > 0;
  els.watchlist.innerHTML = state.watchlist.map((card) => {
    const change = Number(card.price_change_24h || 0);
    const points = state.history.filter((item) => item.watchlist_id === card.id).slice(-20);
    return `<article class="watch-row">
      <div class="card-avatar">${escapeHtml(card.card_name.slice(0, 1).toUpperCase())}</div>
      <div class="watch-info"><strong>${escapeHtml(card.card_name)}</strong><small>${escapeHtml(card.set_name || "Promo")} • ${escapeHtml(card.card_number || "—")}</small><small>${escapeHtml(displayCondition(card.condition))} • ${escapeHtml(card.printing)}</small></div>
      <div class="watch-price"><strong>${money(card.current_price)}</strong><span class="${change >= 0 ? "positive" : "negative"}">${pct(change)}</span></div>
      <div class="sparkline">${sparklineSvg(points.map((p) => Number(p.price)), change >= 0)}</div>
      <button class="row-menu remove-card" data-id="${card.id}" aria-label="Remove ${escapeHtml(card.card_name)}">×</button>
    </article>`;
  }).join("");

  renderMovers();
  renderChart();
  $$(".remove-card").forEach((button) => button.addEventListener("click", () => removeCard(button.dataset.id)));
}

function sparklineSvg(values, positive) {
  const data = values.length > 1 ? values : [values[0] || 0, values[0] || 0];
  const min = Math.min(...data), max = Math.max(...data), spread = max - min || 1;
  const points = data.map((value, index) => `${(index / (data.length - 1)) * 68},${26 - ((value - min) / spread) * 22}`).join(" ");
  return `<svg viewBox="0 0 68 30" role="img" aria-label="Price sparkline"><polyline points="${points}" fill="none" stroke="${positive ? "#47da86" : "#ff625e"}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
}

function renderMovers() {
  const sorted = [...state.watchlist].sort((a, b) => Number(b.price_change_24h || 0) - Number(a.price_change_24h || 0));
  const gainers = sorted.filter((item) => Number(item.price_change_24h || 0) >= 0).slice(0, 3);
  const losers = [...sorted].reverse().filter((item) => Number(item.price_change_24h || 0) < 0).slice(0, 3);
  $("#gainers").innerHTML = gainers.length ? gainers.map((item) => `<li><span>${escapeHtml(item.card_name)}</span><b>${pct(item.price_change_24h)}</b></li>`).join("") : "<li class='muted'>No gainers yet</li>";
  $("#losers").innerHTML = losers.length ? losers.map((item) => `<li><span>${escapeHtml(item.card_name)}</span><b>${pct(item.price_change_24h)}</b></li>`).join("") : "<li class='muted'>No losers yet</li>";
}

function renderChart() {
  const canvas = els.chart;
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(320, rect.width) * dpr;
  canvas.height = 230 * dpr;
  canvas.style.width = `${Math.max(320, rect.width)}px`;
  canvas.style.height = "230px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const width = canvas.width / dpr, height = canvas.height / dpr;
  ctx.clearRect(0, 0, width, height);

  const cutoff = Date.now() - state.chartRange * 86400000;
  const series = state.watchlist.slice(0, 4).map((card, index) => ({
    card, color: palette[index], points: state.history
      .filter((item) => item.watchlist_id === card.id && new Date(item.observed_at).getTime() >= cutoff)
      .map((item) => ({ x: new Date(item.observed_at).getTime(), y: Number(item.price) }))
      .filter((point) => Number.isFinite(point.y)),
  })).filter((item) => item.points.length);

  els.chartLegend.innerHTML = series.map((item) => `<span><i style="background:${item.color}"></i>${escapeHtml(item.card.card_name)}</span>`).join("");
  const pad = { left: 48, right: 14, top: 14, bottom: 30 };
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.font = "11px system-ui";

  if (!series.length) {
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Price history will appear after you add a card.", width / 2, height / 2);
    return;
  }

  const all = series.flatMap((item) => item.points);
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  let minY = Math.min(...all.map((p) => p.y));
  let maxY = Math.max(...all.map((p) => p.y));
  const yPad = Math.max((maxY - minY) * 0.15, maxY * 0.03, 0.5);
  minY = Math.max(0, minY - yPad); maxY += yPad;
  const xSpan = maxX - minX || 1, ySpan = maxY - minY || 1;
  const xFor = (value) => pad.left + ((value - minX) / xSpan) * (width - pad.left - pad.right);
  const yFor = (value) => pad.top + (1 - (value - minY) / ySpan) * (height - pad.top - pad.bottom);

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * (height - pad.top - pad.bottom);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    const label = maxY - (i / 4) * ySpan;
    ctx.textAlign = "right"; ctx.fillText(money(label).replace(".00", ""), pad.left - 7, y + 4);
  }
  ctx.textAlign = "left";
  ctx.fillText(new Date(minX).toLocaleDateString(undefined, { month: "short", day: "numeric" }), pad.left, height - 8);
  ctx.textAlign = "right";
  ctx.fillText(new Date(maxX).toLocaleDateString(undefined, { month: "short", day: "numeric" }), width - pad.right, height - 8);

  series.forEach((item) => {
    ctx.strokeStyle = item.color; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    item.points.forEach((point, index) => {
      const x = xFor(point.x), y = yFor(point.y);
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    if (item.points.length === 1) {
      const point = item.points[0]; ctx.arc(xFor(point.x), yFor(point.y), 3, 0, Math.PI * 2);
    }
    ctx.stroke();
  });
}

async function searchCards(event) {
  event.preventDefault();
  const query = els.searchInput.value.trim();
  if (query.length < 2 || state.busy) return;
  state.busy = true;
  els.searchStatus.textContent = "Searching live promo prices…";
  els.searchResults.innerHTML = "";
  try {
    const response = await providerCall({ action: "search", query, limit: 20, duration: "30d" });
    state.searchCards = (response?.data || []).filter((card) => String(card.rarity || "").toLowerCase() === "promo");
    renderSearchResults();
    els.searchStatus.textContent = state.searchCards.length ? `${state.searchCards.length} matching promo cards` : "No matching promo cards found.";
  } catch (error) {
    els.searchStatus.textContent = error.message;
    showToast(error.message, true);
  } finally { state.busy = false; }
}

function renderSearchResults() {
  const rows = [];
  state.searchCards.forEach((card, cardIndex) => {
    (card.variants || []).slice(0, 5).forEach((variant, variantIndex) => {
      rows.push(`<article class="search-card">
        <div class="card-avatar">${escapeHtml(card.name.slice(0, 1).toUpperCase())}</div>
        <div><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.set_name || card.set || "Promo")} • ${escapeHtml(card.number || "—")}</small><small>${escapeHtml(displayCondition(variant.condition))} • ${escapeHtml(variant.printing || "Normal")}</small></div>
        <div class="result-price"><strong>${money(variant.price)}</strong><span class="${Number(variant.priceChange24hr || 0) >= 0 ? "positive" : "negative"}">${pct(variant.priceChange24hr)}</span></div>
        <button class="small-button add-result" data-card="${cardIndex}" data-variant="${variantIndex}">Add</button>
      </article>`);
    });
  });
  els.searchResults.innerHTML = rows.join("") || "";
  $$(".add-result").forEach((button) => button.addEventListener("click", () => addSearchResult(Number(button.dataset.card), Number(button.dataset.variant), button)));
}

async function addSearchResult(cardIndex, variantIndex, button) {
  const card = state.searchCards[cardIndex];
  const variant = card?.variants?.[variantIndex];
  if (!card || !variant || !state.user) return;
  button.disabled = true;
  try {
    const row = {
      user_id: state.user.id,
      provider: "justtcg",
      provider_card_id: card.id,
      provider_card_uuid: card.uuid || null,
      provider_variant_id: variant.id,
      provider_variant_uuid: variant.uuid || null,
      card_name: card.name,
      set_name: card.set_name || card.set || null,
      card_number: card.number || null,
      rarity: card.rarity || "Promo",
      condition: displayCondition(variant.condition),
      printing: variant.printing || "Normal",
      current_price: Number(variant.price || 0),
      price_change_24h: Number(variant.priceChange24hr || 0),
      last_provider_update: unixToIso(variant.lastUpdated),
    };
    const { data, error } = await supabase.from("promo_watchlist").insert(row).select().single();
    if (error) {
      if (error.code === "23505") throw new Error("That exact card variant is already in your watchlist.");
      throw error;
    }
    const pricePoints = (variant.priceHistory || []).filter((p) => Number.isFinite(Number(p.p)) && Number.isFinite(Number(p.t)));
    const historyRows = (pricePoints.length ? pricePoints : [{ p: variant.price, t: variant.lastUpdated || Math.floor(Date.now() / 1000) }]).map((point) => ({
      user_id: state.user.id,
      watchlist_id: data.id,
      source: "justtcg",
      price: Number(point.p),
      observed_at: unixToIso(point.t),
      provider_timestamp: Number(point.t),
    }));
    const historyResult = await supabase.from("promo_price_history").upsert(historyRows, { onConflict: "watchlist_id,provider_timestamp", ignoreDuplicates: true });
    if (historyResult.error) throw historyResult.error;
    await loadDashboard();
    showToast(`${card.name} added to your watchlist.`);
    els.dialog.close();
  } catch (error) {
    showToast(error.message, true);
    button.disabled = false;
  }
}

async function removeCard(id) {
  const card = state.watchlist.find((item) => item.id === id);
  if (!card || !confirm(`Remove ${card.card_name} from your watchlist?`)) return;
  const { error } = await supabase.from("promo_watchlist").delete().eq("id", id);
  if (error) return showToast(error.message, true);
  await loadDashboard();
  showToast("Card removed.");
}

async function refreshPrices() {
  if (!state.watchlist.length || state.busy) return;
  state.busy = true; els.refresh.disabled = true; els.refresh.textContent = "Refreshing…";
  try {
    for (let start = 0; start < state.watchlist.length; start += 20) {
      const group = state.watchlist.slice(start, start + 20);
      const response = await providerCall({ action: "batch", items: group.map((card) => ({ variantId: card.provider_variant_id })) });
      const cards = response?.data || [];
      for (const providerCard of cards) {
        const variant = providerCard.variants?.[0];
        if (!variant) continue;
        const local = group.find((card) => card.provider_variant_id === variant.id || card.provider_card_id === providerCard.id);
        if (!local) continue;
        const timestamp = Number(variant.lastUpdated || Math.floor(Date.now() / 1000));
        const updateResult = await supabase.from("promo_watchlist").update({
          current_price: Number(variant.price || 0),
          price_change_24h: Number(variant.priceChange24hr || 0),
          last_provider_update: unixToIso(timestamp),
        }).eq("id", local.id);
        if (updateResult.error) throw updateResult.error;
        const insertResult = await supabase.from("promo_price_history").upsert({
          user_id: state.user.id, watchlist_id: local.id, source: "justtcg",
          price: Number(variant.price || 0), observed_at: unixToIso(timestamp), provider_timestamp: timestamp,
        }, { onConflict: "watchlist_id,provider_timestamp", ignoreDuplicates: true });
        if (insertResult.error) throw insertResult.error;
      }
    }
    await loadDashboard();
    showToast("Watchlist prices refreshed.");
  } catch (error) { showToast(error.message, true); }
  finally { state.busy = false; els.refresh.disabled = false; els.refresh.textContent = "Refresh"; }
}

function openSearch() {
  if (!els.dialog.open) els.dialog.showModal();
  setTimeout(() => els.searchInput.focus(), 50);
}

async function boot() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  const { data } = await supabase.auth.getSession();
  applySession(data.session);
  supabase.auth.onAuthStateChange((_event, session) => applySession(session));
}

async function applySession(session) {
  state.user = session?.user || null;
  els.authScreen.hidden = Boolean(state.user);
  els.app.hidden = !state.user;
  if (state.user) {
    try { await loadDashboard(); } catch (error) { showToast(error.message, true); }
  } else {
    state.watchlist = []; state.history = [];
  }
}

els.authForm.addEventListener("submit", handleAuth);
els.authToggle.addEventListener("click", toggleAuthMode);
$("#open-search").addEventListener("click", openSearch);
$("#add-first-card").addEventListener("click", openSearch);
$("#nav-search").addEventListener("click", openSearch);
$$(".open-search-copy").forEach((button) => button.addEventListener("click", openSearch));
els.searchForm.addEventListener("submit", searchCards);
els.refresh.addEventListener("click", refreshPrices);
$("#sign-out").addEventListener("click", () => supabase.auth.signOut());
$("#nav-trends").addEventListener("click", () => $(".chart-panel").scrollIntoView({ behavior: "smooth" }));
$$(".range-tabs button").forEach((button) => button.addEventListener("click", () => {
  state.chartRange = Number(button.dataset.range);
  $$(".range-tabs button").forEach((item) => item.classList.toggle("active", item === button));
  renderChart();
}));
window.addEventListener("resize", () => state.user && renderChart());

boot();
