window.TitipanUI = {
  setAdminView(isAdmin){
    const dash = document.getElementById("dashboardBox")
    const adminOnly = document.querySelectorAll(".adminOnly")

    if (dash) {
      dash.style.display = isAdmin ? "grid" : "none"
    }

    adminOnly.forEach(el => {
      el.style.display = isAdmin ? "" : "none"
    })
  },

  renderHome(){
    const judul = document.getElementById("judul")
    const search = document.getElementById("searchBox")
    const listArea = document.getElementById("listArea")
    const formArea = document.getElementById("formArea")
    const aksiArea = document.getElementById("aksiArea")

    if (judul) judul.style.display = "block"
    if (search) search.style.display = "block"
    if (listArea) listArea.style.display = "block"
    if (formArea) formArea.style.display = "none"
    if (aksiArea) aksiArea.style.display = "none"
  },

  showSection(section){
    const listArea = document.getElementById("listArea")
    const formArea = document.getElementById("formArea")
    const aksiArea = document.getElementById("aksiArea")
    const judul = document.getElementById("judul")
    const search = document.getElementById("searchBox")

    if (listArea) listArea.style.display = section === "list" ? "block" : "none"
    if (formArea) formArea.style.display = section === "form" ? "block" : "none"
    if (aksiArea) aksiArea.style.display = section === "aksi" ? "block" : "none"

    if (judul) judul.style.display = "block"
    if (search) search.style.display = section === "list" ? "block" : "none"
  },

  renderList(rows){
    const listArea = document.getElementById("listArea")
    if (!listArea) return

    if (!rows || rows.length === 0) {
      listArea.innerHTML = `<div class="box">Tidak ada data</div>`
      return
    }

    let html = ""

    rows.forEach(item => {
      const fotoBarang = item.foto_barang || item.foto_penitip || ""
      const thumbHtml = fotoBarang
        ? `<img src="${fotoBarang}" alt="foto">`
        : `<span>📷</span>`

      const outerClick = TitipanShared.isAdmin()
        ? `TitipanCore.openPenitipPhoto('${TitipanShared.escapeJs(item.id)}')`
        : `TitipanCore.openBarangPhoto('${TitipanShared.escapeJs(item.id)}')`

      html += `
        <div class="item" onclick="${outerClick}">
          <div
            class="thumb"
            onclick="event.stopPropagation(); TitipanCore.openBarangPhoto('${TitipanShared.escapeJs(item.id)}')"
          >
            ${thumbHtml}
          </div>

          <div style="flex:1;min-width:0">
            <div class="nama">${TitipanShared.escapeHtml(item.nama_item || "-")}</div>
            <div class="kecil">${TitipanShared.escapeHtml(item.nama_penitip || "-")}</div>
            <div class="kecil">
              Jual Rp ${Number(item.harga_jual || 0).toLocaleString("id-ID")}
            </div>
            ${TitipanShared.formatLastMasuk(window.LAST_MASUK_MAP?.[item.id])}
          </div>

          <div class="qty">${Number(item.qty || 0)}</div>

          <div class="listActionBtns" onclick="event.stopPropagation()">
            <button
              class="blue"
              title="Kedatangan"
              onclick="TitipanCore.startArrivalFlow('${TitipanShared.escapeJs(item.nama_penitip || "")}', '${TitipanShared.escapeJs(item.id)}')"
            >📥</button>

            <button
              class="green"
              title="Nitip Lagi"
              onclick="TitipanCore.startTambahFlow('${TitipanShared.escapeJs(item.nama_penitip || "")}')"
            >＋</button>

            <button
              class="orange"
              title="Update Harga"
              onclick="TitipanCore.openUpdateHarga('${TitipanShared.escapeJs(item.id)}')"
            >✎</button>

            ${TitipanShared.isAdmin() ? `
              <button
                class="red"
                title="Hapus"
                onclick="TitipanCore.hapusBarang('${TitipanShared.escapeJs(item.id)}')"
              >🗑</button>
            ` : ""}
          </div>
        </div>
      `
    })

    listArea.innerHTML = html
  },

  renderTambahForm({ draft }){
    const formArea = document.getElementById("formArea")
    if (!formArea) return

    const fotoThumb = draft?.foto_penitip
      ? `<img src="${draft.foto_penitip}" alt="foto penitip" class="photoThumb">`
      : `<div class="photoThumb placeholder">📷</div>`

    const itemsCount = draft?.items?.length || 0
    const lastPenitip = draft?.penitip || ""
    const penReadOnly = draft?.lockPenitip || false

    formArea.innerHTML = `
      <div class="box">
        <h3>Tambah Barang</h3>

        <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
          ${fotoThumb}
          <div style="flex:1;text-align:left">
            <div class="kecilBox">foto penitip</div>
            <div class="kecilBox">${TitipanShared.escapeHtml(lastPenitip || "Belum diisi")}</div>
          </div>
        </div>

        <input
          id="t_penitip"
          placeholder="Nama penitip"
          value="${TitipanShared.escapeHtml(lastPenitip)}"
          ${penReadOnly ? "readonly" : ""}
        >

        <input id="t_nama" placeholder="Nama barang">
        <input id="t_qty" type="number" placeholder="Jumlah titip">
        <input id="t_pen" type="number" placeholder="Harga penitip">
        <input id="t_jual" type="number" placeholder="Harga jual" style="color:#999">

        <div class="kecilBox" id="t_rekomLabel" style="margin:6px 0 12px">
          ${TitipanShared.recommendedLabel(document.getElementById("t_penitip")?.value || "")}
        </div>

        <div class="rowBtn">
          <button class="green" onclick="TitipanCore.saveTambahItem()">Simpan</button>
          <button class="red" onclick="TitipanCore.renderList()">Batal</button>
        </div>

        <div class="kecilBox" style="margin-top:10px">
          Draft barang tersimpan: ${itemsCount}
        </div>
      </div>
    `

    const penInput = document.getElementById("t_pen")
    const jualInput = document.getElementById("t_jual")
    const labelEl = document.getElementById("t_rekomLabel")
    TitipanShared.bindAutoHarga(penInput, jualInput, labelEl)
  },

  renderArrivalForm({ draft }){
  const formArea = document.getElementById("formArea")
  if (!formArea) return

  const fotoThumb = draft?.foto_bukti
    ? `<img src="${draft.foto_bukti}" alt="foto bukti" class="photoThumb">`
    : `<div class="photoThumb placeholder">📷</div>`

  const penValue = draft?.penitip || ""
  const penReadOnly = draft?.lockPenitip || false

  const selectedIds = new Set((draft?.items || []).map(x => x.item_id))

  const filteredItems = (TitipanState.data || []).filter(item =>
    TitipanShared.normalizeText(item.nama_penitip || "") === TitipanShared.normalizeText(penValue) &&
    !selectedIds.has(item.id)
  )

  const options = filteredItems.map(item => {
    return `<option value="${item.id}">${TitipanShared.escapeHtml(item.nama_item)} | stok ${Number(item.qty || 0)}</option>`
  }).join("")

  formArea.innerHTML = `
    <div class="box">
      <h3>Kedatangan Penitip</h3>

      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
        ${fotoThumb}
        <div style="flex:1;text-align:left">
          <div class="kecilBox">foto bukti transaksi</div>
          <div class="kecilBox">${TitipanShared.escapeHtml(penValue || "Belum diisi")}</div>
        </div>
      </div>

      <input
        id="a_penitip"
        placeholder="Nama penitip"
        value="${TitipanShared.escapeHtml(penValue)}"
        ${penReadOnly ? "readonly" : ""}
      >

      <select
        id="a_barang"
        style="width:100%;padding:12px;border-radius:10px;border:1px solid #ccc;font-size:16px;margin-bottom:10px"
      >
        <option value="">Pilih barang</option>
        ${options}
      </select>

      <input id="a_qty" type="number" placeholder="Barang terjual">
      
      <div class="check">
        <input type="checkbox" id="a_nitip_lagi">
        <span id="a_nitip_label">Nitip lagi</span>
      </div>

      <div id="boxNitipBaru" style="display:none">
        <input id="a_qty_baru" type="number" placeholder="berapa barang?">
      </div>

      <input id="a_bayar" readonly placeholder="Bayar penitip">

      <div class="kecilBox" style="margin:6px 0 12px">
        Daftar barang otomatis terfilter berdasarkan penitip yang sama.
      </div>

      <div class="rowBtn">
        <button class="green" onclick="TitipanCore.saveArrivalItem()">Simpan</button>
        <button class="red" onclick="TitipanCore.renderList()">Batal</button>
      </div>
    </div>
  `

  const penInput = document.getElementById("a_penitip")
  const barangSelect = document.getElementById("a_barang")
  const qtyInput = document.getElementById("a_qty")
  const bayarInput = document.getElementById("a_bayar")
  const nitipCheck = document.getElementById("a_nitip_lagi")
  const nitipLabel = document.getElementById("a_nitip_label")
  const boxNitipBaru = document.getElementById("boxNitipBaru")
  const qtyBaruInput = document.getElementById("a_qty_baru")

  const refreshBayar = () => {
    const selectedId = barangSelect.value
    const item = (TitipanState.data || []).find(x => x.id === selectedId)
    const qty = TitipanShared.clampQty(qtyInput.value)
    const bayar = Number(item?.harga_penitip || 0) * qty
    bayarInput.value = TitipanShared.formatRupiah(bayar)
  }

  const refreshMode = () => {
    const selectedId = barangSelect.value
    const item = (TitipanState.data || []).find(x => x.id === selectedId)
    const canSell = Number(item?.qty || 0) > 0

    nitipLabel.textContent = canSell ? "Nitip lagi" : "Hanya titip"

    if (!canSell) {
      qtyInput.value = 0
      qtyInput.disabled = true
    } else {
      qtyInput.disabled = false
    }

    boxNitipBaru.style.display = nitipCheck.checked ? "block" : "none"
    refreshBayar()
  }

  const refreshOptions = () => {
    const pen = TitipanShared.normalizeText(penInput.value)
    const filtered = (TitipanState.data || []).filter(item =>
      TitipanShared.normalizeText(item.nama_penitip) === pen &&
      !selectedIds.has(item.id)
    )

    barangSelect.innerHTML = `<option value="">Pilih barang</option>` + filtered.map(item => {
      return `<option value="${item.id}">${TitipanShared.escapeHtml(item.nama_item)} | stok ${Number(item.qty || 0)}</option>`
    }).join("")

    if (draft?.preselectItemId && filtered.some(x => x.id === draft.preselectItemId)) {
      barangSelect.value = draft.preselectItemId
    }

    refreshMode()
  }

  penInput.addEventListener("input", refreshOptions)
  barangSelect.addEventListener("change", refreshMode)
  qtyInput.addEventListener("input", refreshBayar)
  nitipCheck.addEventListener("change", () => {
    boxNitipBaru.style.display = nitipCheck.checked ? "block" : "none"
  })
  qtyBaruInput.addEventListener("input", () => {})

  refreshOptions()
},

  renderLoading(text){
    const aksiArea = document.getElementById("aksiArea")
    if (aksiArea) aksiArea.innerHTML = `<div class="box">${TitipanShared.escapeHtml(text)}</div>`
  },

  openSummary({ title, body, buttons }){
    const card = document.getElementById("modalCard")
    const overlay = document.getElementById("modalOverlay")
    if (!card || !overlay) return

    overlay.style.display = "flex"

    card.innerHTML = `
      <div class="modalTitle">${TitipanShared.escapeHtml(title || "")}</div>
      <div class="modalBody">${body || ""}</div>
      <div class="rowBtn" style="margin-top:12px">
        ${(buttons || []).map((btn, idx) => `
          <button class="${btn.className || "blue"}" data-btn-index="${idx}">
            ${TitipanShared.escapeHtml(btn.label)}
          </button>
        `).join("")}
      </div>
    `

    const btnEls = card.querySelectorAll("button[data-btn-index]")
    btnEls.forEach((el, idx) => {
      const meta = buttons[idx]
      el.onclick = meta && meta.onClick ? meta.onClick : null
    })
  },

  openCamera({ title, subtitle, confirmLabel = "✓", backLabel = "Kembali" }){
    const card = document.getElementById("modalCard")
    const overlay = document.getElementById("modalOverlay")
    if (!card || !overlay) return

    overlay.style.display = "flex"
    card.innerHTML = `
      <div class="modalTitle">${TitipanShared.escapeHtml(title || "")}</div>
      <div class="modalSub">${TitipanShared.escapeHtml(subtitle || "")}</div>
      <div class="cameraWrap">
        <video id="cameraVideo" autoplay playsinline></video>
      </div>
      <div class="rowBtn">
        <button class="green" onclick="TitipanCore.captureCameraPhoto()">
          ${TitipanShared.escapeHtml(confirmLabel)}
        </button>
        <button class="red" onclick="TitipanCore.cameraBack()">
          ${TitipanShared.escapeHtml(backLabel)}
        </button>
      </div>
    `
  },

  openPhotoOverlay({ title, subtitle, src }){
    const card = document.getElementById("modalCard")
    const overlay = document.getElementById("modalOverlay")
    if (!card || !overlay) return

    overlay.style.display = "flex"
    card.innerHTML = `
      <div class="modalTitle">${TitipanShared.escapeHtml(title || "")}</div>
      <div class="modalSub">${TitipanShared.escapeHtml(subtitle || "")}</div>
      <img src="${src}" alt="foto" class="photoBig">
      <div class="rowBtn" style="margin-top:12px">
        <button class="red" onclick="TitipanUI.closeModal()">Tutup</button>
      </div>
    `
  },

  openUpdateHarga({ item }){
    const rekom = TitipanShared.rekomendasiHargaJual(item.harga_penitip)
    const card = document.getElementById("modalCard")
    const overlay = document.getElementById("modalOverlay")
    if (!card || !overlay) return

    overlay.style.display = "flex"
    card.innerHTML = `
      <div class="modalTitle">Update Harga</div>
      <div class="modalSub">${TitipanShared.escapeHtml(item.nama_item || "")}</div>

      <input id="u_item_id" type="hidden" value="${item.id}">
      <input id="u_penitip" type="number" value="${Number(item.harga_penitip || 0)}" placeholder="Harga penitip">
      <input
        id="u_jual"
        type="number"
        value="${Number(item.harga_jual || rekom)}"
        placeholder="Harga jual"
        style="color:${Number(item.harga_jual || 0) === rekom ? "#999" : "#111"}"
      >

      <div class="kecilBox" style="margin:6px 0 12px" id="u_rekomLabel">
        Rekomendasi: Rp ${rekom.toLocaleString("id-ID")}
      </div>

      <div class="rowBtn">
        <button class="green" onclick="TitipanCore.saveUpdateHarga()">Simpan</button>
        <button class="red" onclick="TitipanUI.closeModal()">Batal</button>
      </div>
    `
    TitipanShared.bindAutoHarga(
      document.getElementById("u_penitip"),
      document.getElementById("u_jual"),
      document.getElementById("u_rekomLabel")
    )
  },

  closeModal(){
    const overlay = document.getElementById("modalOverlay")
    if (overlay) overlay.style.display = "none"
    TitipanCore.stopCamera()
  },

  showToast(text){
    const toast = document.getElementById("toast")
    if (!toast) return

    toast.innerText = text
    toast.style.display = "block"

    clearTimeout(window.__titipanToastTimeout)
    window.__titipanToastTimeout = setTimeout(() => {
      toast.style.display = "none"
    }, 1800)
  },

  renderLogNormal(rows){
    const aksiArea = document.getElementById("aksiArea")
    if (!aksiArea) return

    const sorted = TitipanShared.sortByCreatedAtDesc(rows)

    let html = `
      <div class="box">
        <div class="rowBtn">
          <button class="blue" onclick="TitipanCore.showLog('today')">Hari Ini</button>
          <button class="orange" onclick="TitipanCore.showLog('week')">7 Hari</button>
          <button class="green" onclick="TitipanCore.showLog('all')">Semua</button>
          <button class="red" onclick="TitipanCore.renderList()">Kembali</button>
        </div>
    `

    sorted.forEach(row => {
      const item = (TitipanState.data || []).find(x => x.id === row.item_id) || {}
      const label =
        row.jenis === "ambil" ? "Ambil" :
        row.jenis === "masuk" ? "Masuk" :
        row.jenis === "harga" ? "Harga" : row.jenis

      const cls =
        row.jenis === "ambil" ? "logAmbil" :
        row.jenis === "masuk" ? "logMasuk" : "logHarga"

      html += `
        <div class="box ${cls}">
          <b>${label}</b><br>
          ${TitipanShared.escapeHtml(item.nama_item || "-")} - ${TitipanShared.escapeHtml(item.nama_penitip || row.nama_penitip || "-")}<br>
          Qty: ${Number(row.qty || 0)} | Rp ${Number(row.total || 0).toLocaleString("id-ID")}<br>
          <span class="kecil">${TitipanShared.formatJam(row.created_at)}</span>
        </div>
      `
    })

    html += `</div>`
    aksiArea.innerHTML = html
  },

  renderLogAdmin(rows){
    const aksiArea = document.getElementById("aksiArea")
    if (!aksiArea) return

    const grouped = TitipanShared.groupBySession(rows)
    const keys = Object.keys(grouped).sort((a, b) => {
      const aa = grouped[a][0]
      const bb = grouped[b][0]
      return new Date(bb.created_at || 0) - new Date(aa.created_at || 0)
    })

    let html = `
      <div class="box">
        <div class="rowBtn">
          <button class="blue" onclick="TitipanCore.showLog('today')">Hari Ini</button>
          <button class="orange" onclick="TitipanCore.showLog('week')">7 Hari</button>
          <button class="green" onclick="TitipanCore.showLog('all')">Semua</button>
          <button class="red" onclick="TitipanCore.renderList()">Kembali</button>
        </div>
    `

    keys.forEach(key => {
      const group = TitipanShared.sortByCreatedAtAsc(grouped[key])
      const head = group[0] || {}
      const photo = head.foto_bukti || head.foto_penitip || ""
      const penName = head.nama_penitip || "-"

      html += `
        <div class="groupCard">
          <div class="groupHead">
            <div class="groupPhoto">
              ${photo ? `<img src="${photo}" alt="foto">` : `<span>📷</span>`}
            </div>
            <div style="flex:1;min-width:0">
              <div class="nama">${TitipanShared.escapeHtml(penName)}</div>
              <div class="kecil">${TitipanShared.formatJam(head.created_at)}</div>
            </div>
          </div>
      `

      group.forEach(row => {
        const it = (TitipanState.data || []).find(x => x.id === row.item_id) || {}
        const label =
          row.jenis === "ambil" ? "Ambil" :
          row.jenis === "masuk" ? "Masuk" :
          row.jenis === "harga" ? "Harga" : row.jenis

        const cls =
          row.jenis === "ambil" ? "logAmbil" :
          row.jenis === "masuk" ? "logMasuk" : "logHarga"

        html += `
          <div class="box ${cls}" style="margin-top:10px">
            <b>${label}</b><br>
            ${TitipanShared.escapeHtml(it.nama_item || "-")}<br>
            Qty: ${Number(row.qty || 0)} | Rp ${Number(row.total || 0).toLocaleString("id-ID")}<br>
            <span class="kecil">${TitipanShared.formatJam(row.created_at)}</span>
          </div>
        `
      })

      html += `</div>`
    })

    html += `</div>`
    aksiArea.innerHTML = html
  }
}