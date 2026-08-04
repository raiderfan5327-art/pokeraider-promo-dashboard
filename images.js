import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8/+esm";
import { APP_CONFIG } from "./config.js";

const supabase = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const state = {
  user: null,
  busy: false,
  queued: false,
  searchBusy: false,
  searchMatches: new Map(),
};

function injectStyles() {
  if (document.querySelector("#pokeraider-image-styles")) return;
  const style = document.createElement("style");
  style.id = "pokeraider-image-styles";
  style.textContent = `
    .card-art {
      overflow: hidden !important;
      padding: 0 !important;
      background: #080a0c !important;
      text-decoration: none !important;
      transition: transform .16s ease, border-color .16s ease;
    }
    .card-art:hover, .card-art:focus-visible {
      transform: translateY(-2px) scale(1.04);
      border-color: #ffe17a !important;
      outline: none;
    }
    .card-art img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
      background: #080a0c;
    }
  `;
  document.head.append(style);
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cardKey(name, setName, number) {
  return `${normalize(name)}|${normalize(setName)}|${normalize(number)}`;
}

function syntheticProviderId(name, setName, number) {
  return `search:${cardKey(name, setName, number).replace(/\|/g, ":").replace(/\s+/g, "-")}`.slice(0, 220);
}

function parseSearchRow(row) {
  const name = row.querySelector("strong")?.textContent?.trim() || "";
  const detail = row.querySelector("small")?.textContent || "";
  const [setName = "", number = ""] = detail.split("•").map((part) => part.trim());
  return { name, setName, number };
}

function artworkNode(match, name) {
  const link = document.createElement("a");
  link.className = "card-avatar card-art";
  link.href = match.imageLargeUrl || match.imageUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = `Open larger ${name} card image`;

  const image = document.createElement("img");
  image.src = match.imageUrl;
  image.alt = `${name} card`;
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => link.remove(), { once: true });
  link.append(image);
  return link;
}

function replaceAvatar(row, match, name) {
  if (!match?.imageUrl) return;
  const current = row.querySelector(":scope > .card-avatar");
  if (!current) return;
  const existing = current.querySelector("img");
  if (existing?.src === match.imageUrl) return;
  current.replaceWith(artworkNode(match, name));
}

async function imageCall(body) {
  const { data, error } = await supabase.functions.invoke(APP_CONFIG.imageFunctionName || "promo-card-images", { body });
  if (error) {
    let payload = null;
    try { payload = error.context ? await error.context.json() : null; } catch { /* ignore */ }
    throw new Error(payload?.error || error.message || "Card artwork could not be loaded.");
  }
  return data;
}

async function decorateWatchlist() {
  if (!state.user || state.busy) {
    state.queued = true;
    return;
  }
  state.busy = true;
  state.queued = false;

  try {
    const { data: missingRows, error: missingError } = await supabase
      .from("promo_watchlist")
      .select("id,card_name,set_name,card_number,image_url")
      .eq("is_active", true)
      .is("image_url", null)
      .limit(20);
    if (missingError) throw missingError;

    for (const row of missingRows || []) {
      const cached = state.searchMatches.get(cardKey(row.card_name, row.set_name, row.card_number));
      if (!cached?.imageUrl) continue;
      await supabase.from("promo_watchlist").update({
        image_url: cached.imageUrl,
        image_large_url: cached.imageLargeUrl || cached.imageUrl,
        image_source: cached.source || "pokemontcg.io",
        image_source_card_id: cached.sourceCardId || null,
        image_match_score: Number(cached.matchScore || 0) || null,
      }).eq("id", row.id);
    }

    await imageCall({ action: "backfill" });

    const { data: cards, error } = await supabase
      .from("promo_watchlist")
      .select("id,card_name,image_url,image_large_url,image_source_card_id")
      .eq("is_active", true);
    if (error) throw error;

    const byId = new Map((cards || []).map((card) => [String(card.id), card]));
    document.querySelectorAll("#watchlist .watch-row").forEach((row) => {
      const id = row.querySelector(".remove-card")?.dataset?.id;
      const card = id ? byId.get(String(id)) : null;
      if (!card?.image_url) return;
      replaceAvatar(row, {
        imageUrl: card.image_url,
        imageLargeUrl: card.image_large_url || card.image_url,
      }, card.card_name);
    });
  } catch (error) {
    console.warn("PokéRaider artwork update failed:", error);
  } finally {
    state.busy = false;
    if (state.queued) setTimeout(decorateWatchlist, 150);
  }
}

async function decorateSearchResults() {
  if (!state.user || state.searchBusy) return;
  const rows = [...document.querySelectorAll("#search-results .search-card")]
    .filter((row) => !row.dataset.imageRequested);
  if (!rows.length) return;

  state.searchBusy = true;
  const grouped = new Map();
  for (const row of rows) {
    row.dataset.imageRequested = "true";
    const parsed = parseSearchRow(row);
    if (!parsed.name) continue;
    const key = cardKey(parsed.name, parsed.setName, parsed.number);
    if (!grouped.has(key)) grouped.set(key, { ...parsed, rows: [] });
    grouped.get(key).rows.push(row);
  }

  try {
    const unique = [...grouped.entries()].slice(0, 20);
    const response = await imageCall({
      action: "resolve",
      items: unique.map(([key, item]) => ({
        providerCardId: syntheticProviderId(item.name, item.setName, item.number),
        cardName: item.name,
        setName: item.setName,
        cardNumber: item.number,
      })),
    });

    const byProviderId = new Map((response?.data || []).map((match) => [String(match.providerCardId), match]));
    for (const [key, item] of unique) {
      const match = byProviderId.get(syntheticProviderId(item.name, item.setName, item.number));
      if (!match?.imageUrl) continue;
      state.searchMatches.set(key, match);
      item.rows.forEach((row) => replaceAvatar(row, match, item.name));
    }
  } catch (error) {
    console.warn("PokéRaider search artwork failed:", error);
  } finally {
    state.searchBusy = false;
  }
}

function scheduleWatchlist() {
  clearTimeout(scheduleWatchlist.timer);
  scheduleWatchlist.timer = setTimeout(decorateWatchlist, 250);
}

function scheduleSearch() {
  clearTimeout(scheduleSearch.timer);
  scheduleSearch.timer = setTimeout(decorateSearchResults, 180);
}

async function applySession(session) {
  state.user = session?.user || null;
  if (!state.user) return;
  scheduleWatchlist();
  scheduleSearch();
}

async function boot() {
  injectStyles();
  const watchlist = document.querySelector("#watchlist");
  const searchResults = document.querySelector("#search-results");
  if (watchlist) new MutationObserver(scheduleWatchlist).observe(watchlist, { childList: true, subtree: true });
  if (searchResults) new MutationObserver(scheduleSearch).observe(searchResults, { childList: true, subtree: true });

  const { data } = await supabase.auth.getSession();
  await applySession(data.session);
  supabase.auth.onAuthStateChange((_event, session) => applySession(session));
  window.addEventListener("focus", () => state.user && scheduleWatchlist());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.user) scheduleWatchlist();
  });
}

boot().catch((error) => console.warn("PokéRaider artwork module failed:", error));
