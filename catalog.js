import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8/+esm";
import { APP_CONFIG } from "./config.js";

const supabase = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const status = document.querySelector("#search-status");
const results = document.querySelector("#search-results");
const dialog = document.querySelector("#search-dialog");
const toast = document.querySelector("#toast");

const state = { cards: [], user: null, busy: false };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function pct(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function displayCondition(value) {
  const map = { NM: "Near Mint", LP: "Lightly Played", MP: "Moderately Played", HP: "Heavily Played", DMG: "Damaged" };
  return map[value] || value || "Unspecified";
}

function unixToIso(seconds) {
  const value = Number(seconds);
  return Number.isFinite(value) && value > 0 ? new Date(value * 1000).toISOString() : new Date().toISOString();
}

function showToast(message, isError = false) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3500);
}

async function providerCall(body) {
  const { data, error } = await supabase.functions.invoke(APP_CONFIG.priceFunctionName, { body });
  if (error) {
    let payload = null;
    try { payload = error.context ? await error.context.json() : null; } catch { /* ignore */ }
    throw new Error(payload?.error || error.message || "The pricing service could not be reached.");
  }
  return data;
}

function renderResults() {
  const rows = [];
  state.cards.forEach((card, cardIndex) => {
    (card.variants || []).slice(0, 5).forEach((variant, variantIndex) => {
      const change = Number(variant.priceChange24hr || 0);
      rows.push(`<article class="search-card">
        <div class="card-avatar">${escapeHtml(String(card.name || "?").slice(0, 1).toUpperCase())}</div>
        <div>
          <strong>${escapeHtml(card.name || "Unknown card")}</strong>
          <small>${escapeHtml(card.set_name || card.set || "Unknown set")} • ${escapeHtml(card.number || "—")}</small>
          <small>${escapeHtml(card.rarity || "Unknown rarity")} • ${escapeHtml(displayCondition(variant.condition))} • ${escapeHtml(variant.printing || "Normal")}</small>
        </div>
        <div class="result-price"><strong>${money(variant.price)}</strong><span class="${change >= 0 ? "positive" : "negative"}">${pct(change)}</span></div>
        <button class="small-button full-catalog-add" data-card="${cardIndex}" data-variant="${variantIndex}">Add</button>
      </article>`);
    });
  });

  results.innerHTML = rows.join("");
  document.querySelectorAll(".full-catalog-add").forEach((button) => {
    button.addEventListener("click", () => addCard(Number(button.dataset.card), Number(button.dataset.variant), button));
  });
}

async function searchCatalog(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  if (state.busy) return;
  const query = input?.value.trim() || "";
  if (query.length < 2) return;

  state.busy = true;
  status.textContent = "Searching the full Pokémon card catalog…";
  results.innerHTML = "";

  try {
    const response = await providerCall({ action: "search", query, limit: 20, duration: "30d" });
    state.cards = response?.data || [];
    renderResults();

    const total = Number(response?.meta?.total || state.cards.length);
    if (!state.cards.length) {
      status.textContent = "No matching Pokémon cards found. Try a card name, set, or card number.";
    } else if (total > state.cards.length) {
      status.textContent = `Showing ${state.cards.length} of ${total} matching cards. Use a more specific name, set, or number to narrow the results.`;
    } else {
      status.textContent = `${state.cards.length} matching Pokémon cards`;
    }
  } catch (error) {
    status.textContent = error.message;
    showToast(error.message, true);
  } finally {
    state.busy = false;
  }
}

async function addCard(cardIndex, variantIndex, button) {
  const card = state.cards[cardIndex];
  const variant = card?.variants?.[variantIndex];
  if (!card || !variant || !state.user) return;

  button.disabled = true;
  try {
    const row = {
      user_id: state.user.id,
      provider: "justtcg",
      provider_card_id: String(card.id),
      provider_card_uuid: card.uuid || null,
      provider_variant_id: String(variant.id),
      provider_variant_uuid: variant.uuid || null,
      card_name: card.name || "Unknown card",
      set_name: card.set_name || card.set || null,
      card_number: card.number || null,
      rarity: card.rarity || "Unknown",
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

    const pricePoints = (variant.priceHistory || []).filter((point) => Number.isFinite(Number(point.p)) && Number.isFinite(Number(point.t)));
    const sourcePoints = pricePoints.length ? pricePoints : [{ p: variant.price, t: variant.lastUpdated || Math.floor(Date.now() / 1000) }];
    const historyRows = sourcePoints.map((point) => ({
      user_id: state.user.id,
      watchlist_id: data.id,
      source: "justtcg",
      price: Number(point.p || 0),
      observed_at: unixToIso(point.t),
      provider_timestamp: Number(point.t),
    }));

    const historyResult = await supabase.from("promo_price_history").upsert(historyRows, {
      onConflict: "watchlist_id,provider_timestamp",
      ignoreDuplicates: true,
    });
    if (historyResult.error) throw historyResult.error;

    showToast(`${card.name} added to your watchlist.`);
    dialog?.close();
    setTimeout(() => window.location.reload(), 500);
  } catch (error) {
    showToast(error.message, true);
    button.disabled = false;
  }
}

async function applySession(session) {
  state.user = session?.user || null;
}

if (form) form.addEventListener("submit", searchCatalog, true);

supabase.auth.getSession().then(({ data }) => applySession(data.session));
supabase.auth.onAuthStateChange((_event, session) => applySession(session));
