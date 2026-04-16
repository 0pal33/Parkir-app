const IS_DEV =
  (
    location.hostname.includes("pages.dev") &&
    !location.hostname.startsWith("parkir-webapp.pages.dev")
  ) ||
  location.hostname === "localhost" ||
  location.hostname.includes("127.0.0.1")

  const CONFIG = {
    DEV: {
        URL: "https://vvfaeybdbgsvhifxfzsg.supabase.co",
            KEY: "sb_publishable_rFwZ8m11ImicxfYHCwiGnw_l3qKXdvL"
    },
      PROD: {
          URL: "https://ktpvkmmuugjcoscxbfja.supabase.co",
              KEY: "sb_publishable_1SJL-5yxWSAC3osTXiEdMw_3Q-060K2"
      }
  }

  const CURRENT = IS_DEV ? CONFIG.DEV : CONFIG.PROD

  const supabase = window.supabase.createClient(
    CURRENT.URL,
      CURRENT.KEY
  )

  console.log("MODE:", IS_DEV ? "DEV" : "PROD")