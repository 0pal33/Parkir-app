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