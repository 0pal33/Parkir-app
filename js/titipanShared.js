window.TitipanShared = {
  parseDbDate(value){
  if(!value) return null
  if(value instanceof Date) return value

  const s = String(value).trim()

  // Kalau sudah ada timezone info, biarkan browser yang baca
  if(/Z$|[+-]\d{2}:\d{2}$/.test(s)){
    return new Date(s)
  }

  // Format timestamp tanpa timezone: 2026-05-29 12:39:00 / 2026-05-29T12:39:00
  return new Date(s.replace(" ", "T"))
},

getWibDayRange(date = new Date()){
  const d = new Date(date)
  d.setHours(0,0,0,0)

  const start = new Date(d)
  const end = new Date(d)
  end.setHours(23,59,59,999)

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString()
  }
},

nowWIB(){
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    )
  },

  formatRupiah(n){
    return "Rp " + Number(n || 0).toLocaleString("id-ID")
  },

  formatJam(dateString){
  const d = TitipanShared.parseDbDate(dateString)
  if(!d || isNaN(d.getTime())) return "-"
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta"
  })
},

formatJamWIB(dateString){
  const d = TitipanShared.parseDbDate(dateString)
  if(!d || isNaN(d.getTime())) return "-"
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta"
  })
},

formatHari(dateString){
  const d = TitipanShared.parseDbDate(dateString)
  if(!d || isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    timeZone: "Asia/Jakarta"
  })
},

  formatTanggal(dateString){
    const [year, month, day] = String(dateString || "").split("-")
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  },

  formatTanggalPendek(dateString){
  const d = TitipanShared.parseDbDate(dateString)
  if(!d || isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  })
},

  isAdmin(){
    return localStorage.getItem("adminLogin") === "true"
  },

  uid(){
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID()
    }

    return "xxxxxx-xxxx-4xxx-yxxx-xxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c === "x" ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  escapeHtml(str){
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  },

  escapeJs(str){
    return String(str ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
  },

  normalizeText(str){
    return String(str || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
  },
  
  storageBucket: "titipan-images",

resolveImageSrc(pathOrBase64, fallback = ""){
  const v = String(pathOrBase64 || "").trim()

  if(!v){
    return fallback || ""
  }

  if(v.startsWith("data:image/")){
    return v
  }

  if(v.startsWith("http://") || v.startsWith("https://")){
    return v
  }

  if(window.supabaseClient){
    const { data } = window.supabaseClient
      .storage
      .from("titipan-images")
      .getPublicUrl(v)

    return data?.publicUrl || fallback || ""
  }

  return fallback || ""
},

async uploadDataUrlToStorage(dataUrl, folder){
  if(!dataUrl || !dataUrl.startsWith("data:image/")){
    return null
  }

  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const mime = blob.type || "image/jpeg"
  const ext = mime.split("/")[1] || "jpg"

  const path = `${folder}/${Date.now()}-${TitipanShared.uid()}.${ext}`

  const { error } = await window.supabaseClient
    .storage
    .from("titipan-images")
    .upload(path, blob, {
      contentType: mime,
      upsert: false
    })

  if(error){
    throw error
  }

  return path
},
  
  formatNamaBaris(str, maxWordsPerLine = 3){
  const words = String(str || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if(words.length === 0) return "-"

  const lines = []
  for(let i = 0; i < words.length; i += maxWordsPerLine){
    lines.push(words.slice(i, i + maxWordsPerLine).join(" "))
  }

  return lines.map(line => TitipanShared.escapeHtml(line)).join("<br>")
},

  clampQty(n){
    const x = parseInt(n || 0)
    if (isNaN(x) || x < 0) return 0
    return x
  },

  rekomendasiHargaJual(hargaPenitip){
    const p = Number(hargaPenitip || 0)
    const step = Math.ceil(p / 1000) + 1
    return Math.max(2, step) * 1000
  },

  recommendedLabel(hargaPenitip){
    const h = Number(hargaPenitip || 0)
    if (!h) return "Rekomendasi otomatis akan muncul di sini"
    return "Rekomendasi: Rp " + TitipanShared.rekomendasiHargaJual(h).toLocaleString("id-ID")
  },

  bindAutoHarga(penitipInput, jualInput, labelEl){
    if (!penitipInput || !jualInput) return

    const applyAuto = () => {
      const p = TitipanShared.clampQty(penitipInput.value)
      const rekom = p > 0 ? TitipanShared.rekomendasiHargaJual(p) : 0

      if (labelEl) {
        labelEl.textContent = p > 0
          ? "Rekomendasi: Rp " + rekom.toLocaleString("id-ID")
          : "Rekomendasi otomatis akan muncul di sini"
      }

      if (jualInput.dataset.manual === "1") {
        jualInput.style.color = "#111"
        return
      }

      if (p > 0) {
        jualInput.value = rekom
      } else {
        jualInput.value = ""
      }

      jualInput.dataset.manual = "0"
      jualInput.style.color = "#999"
    }

    penitipInput.addEventListener("input", applyAuto)

    jualInput.addEventListener("input", () => {
      jualInput.dataset.manual = "1"
      jualInput.style.color = "#111"
    })

    applyAuto()
  },

  formatLastMasuk(log){
  if (!log) {
    return `
      <div class="lastMasukBlock">
        <div class="judul">Terakhir masuk</div>
        <div class="nilai">-</div>
      </div>
    `
  }

  const qty = Number(log.qty || 0)
  const hari = TitipanShared.formatHari(log.created_at)
  const tanggal = TitipanShared.formatTanggalPendek(log.created_at)
  const jam = TitipanShared.formatJamWIB(log.created_at)

  return `
    <div class="lastMasukBlock">
      <div class="judul">Terakhir masuk</div>
      <div class="nilai">${qty} pcs</div>
      <div class="nilai">${hari}</div>
      <div class="nilai">${tanggal}</div>
      <div class="nilai">${jam} WIB</div>
    </div>
  `
},
  isSameWIBDay(a, b){
    const d1 = new Date(
      new Date(a).toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    )

    const d2 = new Date(
      new Date(b).toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    )

    return d1.getFullYear() === d2.getFullYear()
      && d1.getMonth() === d2.getMonth()
      && d1.getDate() === d2.getDate()
  },

  groupByTanggal(data, key = "created_at"){
    const grouped = {}
    ;(data || []).forEach(item => {
      const value = item?.[key]
      if (!value) return

      const wibDate = new Date(
        new Date(value).toLocaleString("en-US", {
          timeZone: "Asia/Jakarta"
        })
      )

      const dateKey = wibDate.toISOString().split("T")[0]

      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(item)
    })
    return grouped
  },

  groupBySession(data){
    const grouped = {}
    ;(data || []).forEach(item => {
      const key = item.session_id || `single-${item.id}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(item)
    })
    return grouped
  },

  sortByCreatedAtAsc(items){
    return [...(items || [])].sort((a, b) => {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0)
    })
  },

  sortByCreatedAtDesc(items){
    return [...(items || [])].sort((a, b) => {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  }
}