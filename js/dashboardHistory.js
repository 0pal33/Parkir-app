window.dashboardHistoryOpen = false

function hideDashboardForHistory(){

  dashboardHistoryOpen = true

  document.querySelector(".slider").style.display = "none"
  document.getElementById("menuContainer").style.display = "none"

  document.getElementById("historyFullscreen")
  .style.display = "block"
}

function showDashboardAgain(){

  dashboardHistoryOpen = false

  document.querySelector(".slider").style.display = "block"
  document.getElementById("menuContainer").style.display = "flex"

  document.getElementById("historyFullscreen")
  .style.display = "none"

  document.getElementById("historyContent")
  .innerHTML = ""
}

async function showDashboardHistory(type){

  hideDashboardForHistory()

  const titleEl =
  document.getElementById("historyTitle")

  const content =
  document.getElementById("historyContent")

  content.innerHTML = "Loading..."

  let today = nowWIB()

  let start,end

  if(!window.isCustom || window.selectedDates.length===0){

    start = new Date(today)
    start.setHours(0,0,0,0)

    end = new Date(today)
    end.setHours(23,59,59,999)

  }else{

    start = new Date(window.selectedDates[0])
    start.setHours(0,0,0,0)

    end = new Date(
      window.selectedDates[1] ||
      window.selectedDates[0]
    )

    end.setHours(23,59,59,999)
  }

  const startISO = start.toISOString()
  const endISO = end.toISOString()

  let data = []

  /* ===== PARKIR ===== */

  if(type === "parkir"){

    titleEl.innerText = "Riwayat Parkir"

    const { data: parkir } =
    await window.supabaseClient
    .from("parkir")
    .select(`
      kode,
      total_bayar,
      checkin_at,
      checkout_at
    `)
    .eq("status","off")
    .gte("checkout_at",startISO)
    .lte("checkout_at",endISO)
    .order("checkout_at",{
      ascending:false
    })

    data = parkir || []

    renderHistoryTable({
      data,
      content,
      dateKey:"checkout_at",
      columns:[
        "Nama",
        "Masuk",
        "Waktu"
      ],
      row:item=>`
      <tr>
        <td>${item.kode || "-"}</td>
        <td>Rp ${window.dashboardShared.formatRupiah(
          window.dashboardShared.calcParkirIncome(item)
        )}</td>
        <td>${window.dashboardShared.formatJam(item.checkout_at)}</td>
      </tr>
      `
    })

    return
  }

  /* ===== BULANAN ===== */

  if(type === "bulanan"){

    titleEl.innerText = "Riwayat Bulanan"

    const { data: bulanan } =
    await window.supabaseClient
    .from("bulanan")
    .select(`
      nama,
      motor,
      last_paid_amount,
      last_paid_at
    `)
    .gte("last_paid_at",startISO)
    .lte("last_paid_at",endISO)
    .order("last_paid_at",{
      ascending:false
    })

    data = bulanan || []

    renderHistoryTable({
      data,
      content,
      dateKey:"last_paid_at",
      columns:[
        "Nama",
        "Motor",
        "Masuk",
        "Waktu"
      ],
      row:item=>`
      <tr>
        <td>${item.nama || "-"}</td>
        <td>${item.motor || "-"}</td>
        <td>
          Rp ${window.dashboardShared.formatRupiah(
            window.dashboardShared.calcBulananIncome(item)
          )}
        </td>
        <td>
          ${window.dashboardShared.formatJam(item.last_paid_at)}
        </td>
      </tr>
      `
    })

    return
  }

  /* ===== STOK ===== */

  if(type === "stok-income" ||
     type === "stok-expense"){

    let mode =
      type === "stok-income"
      ? "jual"
      : "pesan"

    titleEl.innerText =
      type === "stok-income"
      ? "Riwayat Stok Masuk"
      : "Riwayat Stok Keluar"

    const {
      data: stokLog,
      error: logError
    } = await window.supabaseClient
    .from("stok_log")
    .select(`
      item_id,
      qty,
      total,
      created_at,
      jenis
    `)
    .eq("jenis", mode)
    .gte("created_at",startISO)
    .lte("created_at",endISO)
    .order("created_at",{
      ascending:false
    })

    if(logError){
      console.log(logError)
      content.innerHTML = "Gagal mengambil data"
      return
    }

    if(!stokLog?.length){
      content.innerHTML = "<p>Tidak ada data</p>"
      return
    }

    const {
      data: stokBarang,
      error: barangError
    } = await window.supabaseClient
    .from("stok_barang")
    .select(`
      id,
      nama_item,
      harga_beli,
      harga_jual
    `)

    if(barangError){
      console.log(barangError)
      content.innerHTML = "Gagal mengambil data"
      return
    }

    const stokMap = window.dashboardShared.createMap(stokBarang)

    data = stokLog.map(log=>({
      ...log,
      barang: stokMap[log.item_id] || null
    }))

    renderHistoryTable({
      data,
      content,
      dateKey:"created_at",
      columns:[
        "Nama",
        "Total",
        type==="stok-income" ? "Masuk" : "Keluar",
        "Waktu"
      ],

      row:item=>`
      <tr>
        <td>
          ${item.barang?.nama_item || "-"}
        </td>

        <td>
          ${item.qty || 0}
        </td>

        <td>
          Rp ${window.dashboardShared.formatRupiah(
            type==="stok-income"
            ? window.dashboardShared.calcStokIncome(item, item.barang)
            : window.dashboardShared.calcStokExpense(item, item.barang)
          )}
        </td>

        <td>
          ${window.dashboardShared.formatJam(item.created_at)}
        </td>
      </tr>
      `
    })

    return
  }

  /* ===== TITIPAN ===== */

  if(type === "titipan-income" ||
     type === "titipan-expense"){

    titleEl.innerText =
      type === "titipan-income"
      ? "Riwayat Titipan Masuk"
      : "Riwayat Titipan Keluar"

    const {
      data: titipanLog,
      error: logError
    } = await window.supabaseClient
    .from("titipan_log")
    .select(`
      item_id,
      qty,
      total,
      created_at,
      jenis
    `)
    .eq("jenis","ambil")
    .gte("created_at", startISO)
    .lte("created_at", endISO)
    .order("created_at",{
      ascending:false
    })

    if(logError){
      console.log(logError)
      content.innerHTML = "Gagal mengambil data"
      return
    }

    if(!titipanLog?.length){
      content.innerHTML = "<p>Tidak ada data</p>"
      return
    }

    const {
      data: barangTitipan,
      error: barangError
    } = await window.supabaseClient
    .from("barang_titipan")
    .select(`
      id,
      nama_item,
      nama_penitip,
      harga_jual,
      harga_penitip
    `)

    if(barangError){
      console.log(barangError)
      content.innerHTML = "Gagal mengambil data"
      return
    }

    const titipanMap = window.dashboardShared.createMap(barangTitipan)

    data = titipanLog.map(log=>({
      ...log,
      barang: titipanMap[log.item_id] || null
    }))

    renderHistoryTable({
      data,
      content,
      dateKey:"created_at",
      columns:[
        "Nama",
        "Penitip",
        type==="titipan-income" ? "Masuk" : "Keluar",
        "Waktu"
      ],

      row:item=>{

        const barang =
        item.barang || {}

        const masuk =
        window.dashboardShared.calcTitipanIncome(item, barang)

        const keluar =
        window.dashboardShared.calcTitipanExpense(item, barang)

        return `
        <tr>
          <td>
            ${barang.nama_item || "-"}
          </td>

          <td>
            ${barang.nama_penitip || "-"}
          </td>

          <td>
            Rp ${
              window.dashboardShared.formatRupiah(
                type==="titipan-income"
                ? masuk
                : keluar
              )
            }
          </td>

          <td>
            ${window.dashboardShared.formatJam(item.created_at)}
          </td>
        </tr>
        `
      }
    })

    return
  }
}

function renderHistoryTable({
  data,
  content,
  dateKey,
  columns,
  row
}){

  if(!data.length){
    content.innerHTML = "<p>Tidak ada data</p>"
    return
  }

  const grouped =
  window.dashboardShared.groupByTanggal(data,dateKey)

  let html = ""

  Object.keys(grouped)
  .sort((a,b)=>
    new Date(b) - new Date(a)
  )
  .forEach(date=>{

    html += `
    <div class="historyDate">
      ${window.dashboardShared.formatTanggal(date)}
    </div>

    <table class="historyTable">
      <thead>
        <tr>
          ${columns.map(c=>`
          <th>${c}</th>
          `).join("")}
        </tr>
      </thead>
      <tbody>
        ${
          grouped[date]
          .map(row)
          .join("")
        }
      </tbody>
    </table>
    `
  })

  content.innerHTML = html
}