let logMode = null

function escapeHtml(text){
  return String(text ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[m]))
}

function rupiah(n){
  n = Number(n) || 0
  return "Rp " + n.toLocaleString("id-ID")
}

function getWibParts(value){
  const d = new Date(value)

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(d)

  const pick = (type) => parts.find(p => p.type === type)?.value || "00"

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(d)

  return {
    dateKey: `${pick("year")}-${pick("month")}-${pick("day")}`,
    dateLabel,
    timeLabel: `${pick("hour")}.${pick("minute")}.${pick("second")}`
  }
}

function getSectionConfig(section){
  const rows = window.dashboardRows || {}

  return {
    parkir: {
      title: "Parkir",
      timeField: "checkout_at",
      rows: () => rows.parkir || [],
      label: (row) => {
        let tarif = 0
        try{
          tarif = hitungTarifParkir(
            hitungDurasiParkir(
              new Date(row.checkin_at),
              new Date(row.checkout_at)
            )
          )
        }catch(e){}

        return `Checkout • ${rupiah(tarif)}`
      }
    },

    bulanan: {
      title: "Bulanan",
      timeField: "last_paid_at",
      rows: () => rows.bulanan || [],
      label: (row) => {
        return `${escapeHtml(row.nama || "-")} • ${rupiah(row.last_paid_amount || 0)}`
      }
    },

    stok: {
      title: "Stok",
      timeField: "created_at",
      rows: () => rows.stok || [],
      label: (row) => {
        const tipe = row.jenis === "jual"
          ? "Jual"
          : row.jenis === "pesan"
            ? "Pesan"
            : "Stok"

        return `${tipe} • ${escapeHtml(row.nama_item || "-")} • ${rupiah(row.total || 0)}`
      }
    },

    titipan: {
      title: "Titip Jajan",
      timeField: "created_at",
      rows: () => rows.titipan || [],
      label: (row) => {
        const tipe = row.jenis === "ambil"
          ? "Ambil"
          : row.jenis || "Titipan"

        return `${tipe} • ${escapeHtml(row.nama_item || "-")} • ${rupiah(row.total || 0)}`
      }
    }
  }[section]
}

window.toggleBreakdownDetail = function(section){
  logMode = logMode === section ? null : section
  renderBreakdownDetail()
}

window.renderBreakdownDetail = function(){
  const box = document.getElementById("breakdownDetailBox")
  if(!box) return

  if(!breakdownMode || !logMode){
    box.innerHTML = ""
    return
  }

  const cfg = getSectionConfig(logMode)
  if(!cfg){
    box.innerHTML = ""
    return
  }

  const rows = cfg.rows()
  if(!rows.length){
    box.innerHTML = `
      <div class="card" style="margin-top:12px">
        <b>${cfg.title}</b><br><br>
        Kosong
      </div>
    `
    return
  }

  const groups = new Map()

  rows.forEach((row) => {
    const ts = row[cfg.timeField]
    if(!ts) return

    const meta = getWibParts(ts)

    if(!groups.has(meta.dateKey)){
      groups.set(meta.dateKey, {
        label: meta.dateLabel,
        items: []
      })
    }

    groups.get(meta.dateKey).items.push({
      timeLabel: meta.timeLabel,
      ts: new Date(ts).getTime(),
      text: cfg.label(row)
    })
  })

  const sortedGroups = [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))

  if(sortedGroups.length === 0){
    box.innerHTML = `
      <div class="card" style="margin-top:12px">
        <b>${cfg.title}</b><br><br>
        Tidak ada log dengan waktu yang bisa dibaca
      </div>
    `
    return
  }

  let html = `
    <div class="card" style="margin-top:12px;text-align:left">
      <div style="font-weight:700;text-align:center;margin-bottom:12px">${cfg.title} • Riwayat</div>
  `

  sortedGroups.forEach(([, group]) => {
    group.items.sort((a, b) => b.ts - a.ts)

    html += `
      <div style="margin-bottom:14px">
        <div style="font-weight:700;margin-bottom:8px">${group.label}</div>
    `

    group.items.forEach((item) => {
      html += `
        <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid #eee;border-radius:10px;margin-bottom:8px;background:#fafafa">
          <div style="min-width:0;flex:1">${item.text}</div>
          <div style="white-space:nowrap;color:#666">${item.timeLabel}</div>
        </div>
      `
    })

    html += `</div>`
  })

  html += `</div>`
  box.innerHTML = html
}