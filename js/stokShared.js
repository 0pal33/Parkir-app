window.StokShared = {

  nowWIB(){
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    )
  },

  wibDateKey(date = null){
    const d = date ? new Date(date) : this.nowWIB()

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(d)
  },

  formatRupiah(n){
    return "Rp " + Number(n || 0).toLocaleString("id-ID")
  },

  sameDay(a, b){
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate()
  },

  normalizeText(str){
    return String(str || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
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
  }

}