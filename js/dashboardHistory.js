window.dashboardHistoryOpen = false

function formatRupiah(n){
  return Number(n || 0).toLocaleString("id-ID")
}

function formatJam(dateString){
  let d = new Date(dateString)

  return d.toLocaleTimeString("id-ID",{
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit",
    hour12:false,
    timeZone:"Asia/Jakarta"
  })
}

function formatTanggal(dateString){

  let d = new Date(dateString)

  return d.toLocaleDateString("id-ID",{
    day:"numeric",
    month:"long",
    year:"numeric",
    timeZone:"Asia/Jakarta"
  })
}

function groupByTanggal(data,key="created_at"){

  const grouped = {}

  data.forEach(item=>{

    const dateKey = new Date(item[key])
    .toLocaleDateString("sv-SE",{
      timeZone:"Asia/Jakarta"
    })

    if(!grouped[dateKey]){
      grouped[dateKey] = []
    }

    grouped[dateKey].push(item)

  })

  return grouped
}

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
  let mode = "income"

  /* ===== PARKIR ===== */

  if(type === "parkir"){

    titleEl.innerText = "Riwayat Parkir"

    const { data: parkir } =
    await window.supabaseClient
    .from("parkir")
    .select(`
      kode,
      total_bayar,
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
        <td>Rp ${formatRupiah(item.total_bayar)}</td>
        <td>${formatJam(item.checkout_at)}</td>
      </tr>
      `
    })

    return
  }

  /* ===== BULANAN ===== */

  if(type === "bulanan"){

    titleEl.innerText =
    "Riwayat Bulanan"

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
          Rp ${formatRupiah(
            item.last_paid_amount
          )}
        </td>
        <td>
          ${formatJam(item.last_paid_at)}
        </td>
      </tr>
      `
    })

    return
  }

  /* ===== STOK ===== */

  if(type === "stok-income" ||
     type === "stok-expense"){

    mode =
    type === "stok-income"
    ? "jual"
    : "pesan"

    titleEl.innerText =
    type === "stok-income"
    ? "Riwayat Stok Masuk"
    : "Riwayat Stok Keluar"

    const { data: stok } =
    await window.supabaseClient
    .from("stok_log")
    .select(`
      qty,
      total,
      created_at,
      jenis,
      stok_barang(
        nama_item
      )
    `)
    .eq("jenis",mode)
    .gte("created_at",startISO)
    .lte("created_at",endISO)
    .order("created_at",{
      ascending:false
    })

    data = stok || []

    renderHistoryTable({
      data,
      content,
      dateKey:"created_at",
      columns:[
        "Nama",
        "Total",
        type==="stok-income"
        ? "Masuk"
        : "Keluar",
        "Waktu"
      ],
      row:item=>`
      <tr>
        <td>
          ${
            item.stok_barang
            ?.nama_item || "-"
          }
        </td>
        <td>${item.qty || 0}</td>
        <td>
          Rp ${formatRupiah(
            item.total
          )}
        </td>
        <td>
          ${formatJam(
            item.created_at
          )}
        </td>
      </tr>
      `
    })

    return
  }

/* ===== TITIPAN ===== */

if(
  type === "titipan-income" ||
  type === "titipan-expense"
){

  titleEl.innerText =
  type === "titipan-income"
  ? "Riwayat Titipan Masuk"
  : "Riwayat Titipan Keluar"

  const { data: titipan, error } =
  await window.supabaseClient
  .from("titipan_log")
  .select(`
    qty,
    total,
    created_at,
    jenis,
    barang_titipan!inner(
      nama_item,
      nama_penitip,
      harga_jual,
      harga_penitip
    )
  `)
  .eq("jenis","ambil")
  .gte("created_at", startISO)
  .lte("created_at", endISO)
  .order("created_at",{
    ascending:false
  })

  if(error){
    console.log(error)
    content.innerHTML =
    "Gagal mengambil data"
    return
  }

  data = titipan || []

  renderHistoryTable({
    data,
    content,
    dateKey:"created_at",
    columns:[
      "Nama",
      "Penitip",
      type==="titipan-income"
      ? "Masuk"
      : "Keluar",
      "Waktu"
    ],
    row:item=>{

      const titipanData =
      Array.isArray(item.barang_titipan)
      ? item.barang_titipan[0]
      : item.barang_titipan

      const masuk =
      Number(item.total || 0)

      const keluar =
      Number(
        titipanData?.harga_penitip || 0
      ) * Number(item.qty || 0)

      return `
      <tr>
        <td>
          ${titipanData?.nama_item || "-"}
        </td>

        <td>
          ${
            titipanData
            ?.nama_penitip || "-"
          }
        </td>

        <td>
          Rp ${
            formatRupiah(
              type==="titipan-income"
              ? masuk
              : keluar
            )
          }
        </td>

        <td>
          ${formatJam(
            item.created_at
          )}
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
    content.innerHTML =
    "<p>Tidak ada data</p>"
    return
  }

  const grouped =
  groupByTanggal(data,dateKey)

  let html = ""

  Object.keys(grouped)
  .reverse()
  .forEach(date=>{

    html += `
    <div class="historyDate">
      ${formatTanggal(date)}
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