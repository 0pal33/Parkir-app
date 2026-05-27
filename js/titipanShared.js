window.TitipanShared = {
  nowWIB(){
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    )
  },

  formatRupiah(n){
    return "Rp " + Number(n || 0).toLocaleString("id-ID")
  },

  formatJam(dateString){
    const d = new Date(dateString)
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
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
    const d = new Date(dateString)
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    })
  },

  formatHari(dateString){
    const d = new Date(dateString)
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      timeZone: "Asia/Jakarta"
    })
  },

  formatJamWIB(dateString){
    const d = new Date(dateString)
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
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

  if(!h){
    return "Rekomendasi otomatis akan muncul di sini"
  }

  const rekom =
  TitipanShared.rekomendasiHargaJual(h)

  return `Rekomendasi: Rp ${Number(rekom || 0)
    .toLocaleString("id-ID")}`
},

  bindAutoHarga(penitipInput, jualInput, labelEl){
    if (!penitipInput || !jualInput) return

    const applyAuto = () => {
      if (jualInput.dataset.manual === "1") {
        if (labelEl) {
          const rekom = TitipanShared.rekomendasiHargaJual(penitipInput.value)
          labelEl.innerHTML = `Rekomendasi: Rp ${Number(rekom || 0).toLocaleString("id-ID")}`
        }
        return
      }

      const rekom = TitipanShared.rekomendasiHargaJual(penitipInput.value)
      jualInput.value = rekom || ""
      jualInput.dataset.manual = "0"
      jualInput.style.color = "#999"

      if (labelEl) {
        labelEl.innerHTML = `Rekomendasi: Rp ${Number(rekom || 0).toLocaleString("id-ID")}`
      }
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
      return `<div class="kecilBox">Terakhir masuk: -</div>`
    }

    const qty = Number(log.qty || 0)
    const hari = TitipanShared.formatHari(log.created_at)
    const tanggal = TitipanShared.formatTanggalPendek(log.created_at)
    const jam = TitipanShared.formatJamWIB(log.created_at)

    return `
      <div class="kecilBox" style="margin-top:4px;line-height:1.45">
        <div><b>Terakhir masuk</b></div>
        <div>${qty} pcs</div>
        <div>${hari}</div>
        <div>${tanggal}</div>
        <div>${jam} WIB</div>
      </div>
    `
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