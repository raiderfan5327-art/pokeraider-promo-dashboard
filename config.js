export const APP_CONFIG = Object.freeze({
  supabaseUrl: "https://djkivxmyapjlotcagjji.supabase.co",
  supabasePublishableKey: "sb_publishable_lQm6LNosxkNS35Yri5uK2w_3S8vDAg9",
  priceFunctionName: "promo-price-proxy",
  imageFunctionName: "promo-card-images",
});

if (typeof window !== "undefined") {
  import("./images.js").catch((error) => console.warn("PokéRaider artwork module did not load:", error));
}
