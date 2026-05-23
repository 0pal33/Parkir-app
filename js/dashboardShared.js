window.dashboardShared = {

  /* =========================
     MASTER MAP
  ========================= */

  createMap(data = []){

    const map = {}

    data.forEach(item=>{
      map[item.id] = item
    })

    return map
  },

  /* =========================
     FORMAT
  ========================= */

  formatRupiah(n){
    return Number(n || 0).toLocaleString("id-ID")
  },

  formatJam(dateString){

    const d = new Date(dateString)

    return d.toLocaleTimeString(
      "id-ID",
      {
        hour:"2-digit",
        minute:"2-digit",
        second:"2-digit",
        hour12:false,
        timeZone:"Asia/Jakarta"
      }
    )
  },

  formatTanggal(dateString){

    const [year,month,day] =
    String(dateString).split("-")

    const d = new Date(
      Number(year),
      Number(month)-1,
      Number(day)
    )

    return d.toLocaleDateString(
      "id-ID",
      {
        day:"numeric",
        month:"long",
        year:"numeric"
      }
    )
  },

  groupByTanggal(
    data,
    key="created_at"
  ){

    const grouped = {}

    ;(data || []).forEach(item=>{

      const value = item?.[key]
      if(!value) return

      const wibDate =
      new Date(
        new Date(value)
        .toLocaleString(
          "en-US",
          {
            timeZone:"Asia/Jakarta"
          }
        )
      )

      const dateKey =
      wibDate
      .toISOString()
      .split("T")[0]

      if(!grouped[dateKey]){
        grouped[dateKey] = []
      }

      grouped[dateKey].push(item)

    })

    return grouped
  },

  /* =========================
     PERIOD LABEL
  ========================= */

  formatPeriodLabel(dates){

    if(!dates || dates.length===0){
      return "Hari ini"
    }

    const bulan = [
      "Jan","Feb","Mar",
      "Apr","Mei","Jun",
      "Jul","Agu","Sep",
      "Okt","Nov","Des"
    ]

    const sorted = [...dates].sort((a,b)=>a-b)

    const a = sorted[0]
    const b = sorted[sorted.length - 1]

    const d1 = a.getDate()
    const m1 = bulan[a.getMonth()]
    const y1 = String(a.getFullYear()).slice(-2)

    const d2 = b.getDate()
    const m2 = bulan[b.getMonth()]
    const y2 = String(b.getFullYear()).slice(-2)

    const sameDay =
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

    const sameMonthYear =
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth()

    const sameYear =
      a.getFullYear() === b.getFullYear()

    if(sameDay){
      return `${d1} ${m1} ${y1}`
    }

    if(sameMonthYear){
      return `${d1} - ${d2} ${m2} ${y2}`
    }

    if(sameYear){
      return `${d1} ${m1} - ${d2} ${m2} ${y2}`
    }

    return `${d1} ${m1} ${y1} - ${d2} ${m2} ${y2}`
  },

  /* =========================
     PARKIR / BULANAN
  ========================= */

  calcParkirIncome(log){

    if(log?.total_bayar !== null && log?.total_bayar !== undefined){
      return Number(log.total_bayar || 0)
    }

    if(
      typeof hitungTarifParkir === "function" &&
      typeof hitungDurasiParkir === "function" &&
      log?.checkin_at &&
      log?.checkout_at
    ){
      return Number(
        hitungTarifParkir(
          hitungDurasiParkir(
            new Date(log.checkin_at),
            new Date(log.checkout_at)
          )
        ) || 0
      )
    }

    return 0
  },

  calcBulananIncome(log){
    return Number(log?.last_paid_amount || 0)
  },

  /* =========================
     STOK
     - gunakan log.total sebagai sumber utama
     - fallback ke harga × qty hanya kalau total kosong
  ========================= */

  calcStokIncome(log, barang){

    const total = Number(log?.total || 0)
    if(total > 0) return total

    const qty = Number(log?.qty || 0)
    const hargaJual = Number(barang?.harga_jual || 0)

    return hargaJual * qty
  },

  calcStokExpense(log, barang){

    const total = Number(log?.total || 0)
    if(total > 0) return total

    const qty = Number(log?.qty || 0)
    const hargaBeli = Number(barang?.harga_beli || 0)

    return hargaBeli * qty
  },

  /* =========================
     TITIPAN
     - gunakan log.total sebagai sumber utama
     - fallback ke harga × qty kalau perlu
  ========================= */

  calcTitipanIncome(log, barang){

    const total = Number(log?.total || 0)
    if(total > 0) return total

    const qty = Number(log?.qty || 0)
    const hargaJual = Number(barang?.harga_jual || 0)

    return hargaJual * qty
  },

  calcTitipanExpense(log, barang){

    const total = Number(log?.total || 0)
    if(total > 0) return total

    const qty = Number(log?.qty || 0)
    const hargaPenitip = Number(barang?.harga_penitip || 0)

    return hargaPenitip * qty
  }

}