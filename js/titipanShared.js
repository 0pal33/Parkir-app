window.TitipanShared = {

  nowWIB(){
    return new Date(
      new Date().toLocaleString("en-US",{timeZone:"Asia/Jakarta"})
    )
  },

  formatRupiah(n){
    return "Rp " + Number(n || 0).toLocaleString("id-ID")
  },

  formatJam(dateString){
    const d = new Date(dateString)
    return d.toLocaleTimeString("id-ID",{
      hour:"2-digit",
      minute:"2-digit",
      second:"2-digit",
      hour12:false,
      timeZone:"Asia/Jakarta"
    })
  },

  formatTanggal(dateString){
    const [year,month,day] = String(dateString || "").split("-")
    const d = new Date(Number(year), Number(month)-1, Number(day))
    return d.toLocaleDateString("id-ID",{
      day:"numeric",
      month:"long",
      year:"numeric"
    })
  },

  isAdmin(){
    return localStorage.getItem("adminLogin") === "true"
  },

  uid(){
    if(window.crypto && typeof window.crypto.randomUUID === "function"){
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

  normalizeText(str){
    return String(str || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
  },

  rekomendasiHargaJual(hargaPenitip){
    const p = Number(hargaPenitip || 0)
    const kelipatan = Math.ceil(p / 1000) + 1
    return Math.max(2, kelipatan) * 1000
  },

  bindAutoHarga(penitipInput, jualInput){

    if(!penitipInput || !jualInput) return

    const applyAuto = () => {
      if(jualInput.dataset.manual === "1") return
      const rekom = TitipanShared.rekomendasiHargaJual(penitipInput.value)
      jualInput.value = rekom || ""
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

  groupByTanggal(data, key="created_at"){
    const grouped = {}
    ;(data || []).forEach(item=>{
      const value = item?.[key]
      if(!value) return
      const wibDate = new Date(
        new Date(value).toLocaleString("en-US",{
          timeZone:"Asia/Jakarta"
        })
      )
      const dateKey = wibDate.toISOString().split("T")[0]
      if(!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(item)
    })
    return grouped
  },

  groupBySession(data){
    const grouped = {}
    ;(data || []).forEach(item=>{
      const key = item.session_id || `single-${item.id}`
      if(!grouped[key]) grouped[key] = []
      grouped[key].push(item)
    })
    return grouped
  },

  sortByCreatedAtAsc(items){
    return [...(items || [])].sort((a,b)=>{
      return new Date(a.created_at || 0) - new Date(b.created_at || 0)
    })
  },

  sortByCreatedAtDesc(items){
    return [...(items || [])].sort((a,b)=>{
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  },

  recommendedLabel(hargaPenitip){
    const h = Number(hargaPenitip || 0)
    if(!h) return "Rekomendasi otomatis akan muncul di sini"
    return "Rekomendasi: Rp " + TitipanShared.rekomendasiHargaJual(h).toLocaleString("id-ID")
  },

  clampQty(n){
    const x = parseInt(n || 0)
    if(isNaN(x) || x < 0) return 0
    return x
  }

}
