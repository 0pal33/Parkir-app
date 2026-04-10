const ENV = window.location.hostname.includes("pages.dev")
  ? "DEV"
    : "PROD"

    const CONFIG = {
      DEV: {
          SUPABASE_URL: "https://vvfaeybdbgsvhifxfzsg.supabase.co",
              SUPABASE_KEY: "sb_publishable_rFwZ8m11ImicxfYHCwiGnw_l3qKXdvL"
      },
        PROD: {
            SUPABASE_URL: "https://ktpvkmmuugjcoscxbfja.supabase.co",
                SUPABASE_KEY: "sb_publishable_1SJL-5yxWSAC3osTXiEdMw_3Q-060K2"
        }
    }

    const supabase = window.supabase.createClient(
      CONFIG[ENV].SUPABASE_URL,
        CONFIG[ENV].SUPABASE_KEY
    )
const IS_DEV =
  window.location.hostname.includes("pages.dev") ||
    window.location.hostname === "localhost" ||
      window.location.hostname.includes("127.0.0.1");

      if (IS_DEV && !window.__SUGER_LOADED__) {
        window.__SUGER_LOADED__ = true;

          window.addEventListener("DOMContentLoaded", () => {
              const script = document.createElement("script");
                  script.src = "https://suger-cdn.vercel.app/suger-dev.js";

                      script.onload = () => {
                            if (window.SugerDevtool) {
                                    window.SugerDevtool.init();
                                            console.log("✅ Suger Devtool aktif (DEV MODE)");
                            }
                      };

                          document.body.appendChild(script);
          });
      }