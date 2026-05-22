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
     STOK
  ========================= */

  calcStokIncome(log, barang){

    const qty =
    Number(log?.qty || 0)

    const hargaJual =
    Number(
      barang?.harga_jual || 0
    )

    return hargaJual * qty
  },

  calcStokExpense(log, barang){

    const qty =
    Number(log?.qty || 0)

    const hargaBeli =
    Number(
      barang?.harga_beli || 0
    )

    return hargaBeli * qty
  },

  /* =========================
     TITIPAN
  ========================= */

  calcTitipanIncome(log, barang){

    const qty =
    Number(log?.qty || 0)

    const hargaJual =
    Number(
      barang?.harga_jual || 0
    )

    return hargaJual * qty
  },

  calcTitipanExpense(log, barang){

    const qty =
    Number(log?.qty || 0)

    const hargaPenitip =
    Number(
      barang?.harga_penitip || 0
    )

    return hargaPenitip * qty
  }

}