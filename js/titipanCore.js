window.TitipanState = {
  data: [],
  current: null,
  logMode: "today",
  addDraft: null,
  arrivalDraft: null,
  camera: {
    stream: null,
    onCapture: null,
    onBack: null
  }
}

window.TitipanCore = {

  async init(){
    const isAdmin = await TitipanShared.isAdmin()
    TitipanUI.setAdminView(isAdmin)

    await this.loadData()
    await this.renderDashboard()

    TitipanUI.renderHome()
    this.bindTopButtons()
  },

  bindTopButtons(){
    const kedatanganBtn = document.getElementById("btnKedatangan")
    const logBtn = document.getElementById("btnLog")
    const homeBtn = document.getElementById("btnHome")

    if (kedatanganBtn) {
      kedatanganBtn.onclick = () => TitipanCore.startArrivalFlow()
    }

    if (logBtn) {
      logBtn.onclick = () => TitipanCore.showLog("today")
    }

    if (homeBtn) {
      homeBtn.onclick = () => { location.href = "index.html" }
    }
  },

  async loadData(){
    const [{ data: barang }, { data: logs }] = await Promise.all([
      window.supabaseClient
        .from("barang_titipan")
        .select(`
          id,
          nama_item,
          nama_penitip,
          qty,
          harga_jual,
          harga_penitip,
          foto_penitip,
          foto_barang,
          foto_penitip_path,
          foto_barang_path,
          updated_at,
          created_at
        `)
        .order("nama_item", { ascending: true }),

      window.supabaseClient
        .from("titipan_log")
        .select(`
          item_id,
          qty,
          created_at,
          foto_penitip,
          foto_bukti,
          foto_penitip_path,
          foto_bukti_path,
          session_id,
          nama_penitip,
          jenis,
          total
        `)
        .eq("jenis", "masuk")
        .order("created_at", { ascending: false })
        .limit(1000)
    ])

    TitipanState.data = barang || []

    window.LAST_MASUK_MAP = {}
    ;(logs || []).forEach(log => {
      if (!window.LAST_MASUK_MAP[log.item_id]) {
        window.LAST_MASUK_MAP[log.item_id] = log
      }
    })

    this.renderList()
  },

  async renderDashboard(){
    const dash = document.getElementById("dashboardBox")
    if (!dash) return

    const isAdmin = await TitipanShared.isAdmin()

    if (!isAdmin) {
      dash.style.display = "none"
      return
    }

    dash.style.display = "grid"

    const { startDB, endDB } = TitipanShared.getWibDayRange(new Date())

    const { data, error } = await window.supabaseClient
      .from("titipan_log")
      .select("qty,total,created_at,jenis")
      .eq("jenis", "ambil")
      .gte("created_at", startDB)
      .lte("created_at", endDB)

    if (error) {
      dash.innerHTML = `
        <div class="card">
          <div class="cardTitle">Dashboard</div>
          <div class="cardValue">Gagal</div>
        </div>
      `
      return
    }

    let qty = 0
    let total = 0

    ;(data || []).forEach(i => {
      qty += Number(i.qty || 0)
      total += Number(i.total || 0)
    })

    dash.innerHTML = `
      <div class="card">
        <div class="cardTitle">Terjual Hari Ini</div>
        <div class="cardValue" id="dashQty">${qty} pcs</div>
      </div>
      <div class="card">
        <div class="cardTitle">Bayar Penitip</div>
        <div class="cardValue" id="dashTotal">${TitipanShared.formatRupiah(total)}</div>
      </div>
    `
  },

  renderList(){
    TitipanUI.renderHome()

    const search = document.getElementById("searchBox")
    const term = TitipanShared.normalizeText(search ? search.value : "")

    const rows = (TitipanState.data || []).filter(item => {
      const nama = TitipanShared.normalizeText(item.nama_item)
      const pen = TitipanShared.normalizeText(item.nama_penitip)
      return !term || nama.includes(term) || pen.includes(term)
    })

    TitipanUI.renderList(rows)
  },

  openBarangPhoto(id){
    const item = (TitipanState.data || []).find(x => x.id === id)
    if (!item) return

    const src = TitipanShared.resolveImageSrc(
      item.foto_barang_path ||
      item.foto_barang ||
      item.foto_penitip_path ||
      item.foto_penitip ||
      "",
      ""
    )

    if (!src) {
      TitipanUI.showToast("Foto belum ada")
      return
    }

    TitipanUI.openPhotoOverlay({
      title: item.nama_item || "Foto barang",
      subtitle: item.nama_penitip || "",
      src
    })
  },

  openPenitipPhoto(id){
    const item = (TitipanState.data || []).find(x => x.id === id)
    if (!item) return

    const src = TitipanShared.resolveImageSrc(
      item.foto_penitip_path ||
      item.foto_penitip ||
      item.foto_barang_path ||
      item.foto_barang ||
      "",
      ""
    )

    if (!src) {
      TitipanUI.showToast("Foto penitip belum ada")
      return
    }

    TitipanUI.openPhotoOverlay({
      title: item.nama_penitip || "Foto penitip",
      subtitle: item.nama_item || "",
      src
    })
  },

  /* =========================================================
     TAMBAH TITIPAN
     ========================================================= */

  startTambahFlow(prefillPenitip = ""){
    TitipanState.addDraft = {
      session_id: TitipanShared.uid(),
      foto_penitip: null,
      penitip: prefillPenitip || "",
      lockPenitip: !!prefillPenitip,
      items: []
    }

    this.openCameraStep({
      title: "foto penitip",
      subtitle: "Arahkan kamera ke foto penitip, lalu klik centang.",
      confirmLabel: "✓",
      backLabel: "Kembali",
      onCapture: (dataUrl) => {
        TitipanState.addDraft.foto_penitip = dataUrl
        TitipanCore.renderTambahForm()
      },
      onBack: () => {
        TitipanState.addDraft = null
        TitipanCore.renderList()
      }
    })
  },

  renderTambahForm(){
    TitipanUI.showSection("form")
    TitipanUI.renderTambahForm({ draft: TitipanState.addDraft })
  },

  async saveTambahItem(){
    const draft = TitipanState.addDraft
    if (!draft) {
      alert("Draft belum ada")
      return
    }

    const nama = document.getElementById("t_nama")?.value.trim().replace(/\s+/g, " ")
    const penitip = document.getElementById("t_penitip")?.value.trim().replace(/\s+/g, " ")
    const qty = TitipanShared.clampQty(document.getElementById("t_qty")?.value)
    const hargaPenitip = TitipanShared.clampQty(document.getElementById("t_pen")?.value)
    let hargaJual = TitipanShared.clampQty(document.getElementById("t_jual")?.value)

    if (!nama || !penitip || qty <= 0) {
      alert("Nama barang, nama penitip, dan qty wajib diisi")
      return
    }

    if (hargaPenitip <= 0) {
      alert("Harga penitip tidak valid")
      return
    }

    if (hargaJual <= 0) {
      hargaJual = TitipanShared.rekomendasiHargaJual(hargaPenitip)
    }

    if (!draft.penitip) {
      draft.penitip = penitip
    }

    draft.lockPenitip = true

    if (TitipanShared.normalizeText(draft.penitip) !== TitipanShared.normalizeText(penitip)) {
      alert("Nama penitip harus sama untuk satu sesi")
      return
    }

    const existing = draft.items.find(x =>
      TitipanShared.normalizeText(x.nama_item) === TitipanShared.normalizeText(nama)
    )

    if (existing) {
      const merge = confirm("Nama barang ini sudah ada di draft. Gabungkan qty?")
      if (merge) {
        existing.qty += qty
        existing.harga_penitip = hargaPenitip
        existing.harga_jual = hargaJual
      } else {
        return
      }
    } else {
      draft.items.push({
        tmp_id: TitipanShared.uid(),
        nama_item: nama,
        nama_penitip: penitip,
        qty,
        harga_penitip: hargaPenitip,
        harga_jual: hargaJual,
        foto_barang: null
      })
    }

    TitipanCore.showAddSummary()
  },

  showAddSummary(){
    const draft = TitipanState.addDraft
    if (!draft) return

    const totalQty = draft.items.reduce((a, b) => a + Number(b.qty || 0), 0)

    TitipanUI.openSummary({
      title: "Ringkasan titipan",
      body: `
        <div class="summaryText">
          ${draft.items.map(i => `${TitipanShared.escapeHtml(i.nama_item)} ${Number(i.qty || 0)}`).join("<br>")}
        </div>
        <div class="summaryTotal">Total ${totalQty}</div>
        <div class="summaryQuestion">apakah penitip memiliki barang lain untuk dititipkan?</div>
      `,
      buttons: [
        { label: "Ya", className: "blue", onClick: () => TitipanCore.continueTambah() },
        {
          label: "Tidak",
          className: "green",
          onClick: () => TitipanCore.beginAddPhotoSequence(0)
        },
        {
          label: "Batal",
          className: "red",
          onClick: () => {
            TitipanUI.closeModal()
            TitipanCore.renderTambahForm()
          }
        }
      ]
    })
  },

  continueTambah(){
    TitipanUI.closeModal()
    TitipanCore.renderTambahForm()
  },

  beginAddPhotoSequence(index = 0){
    const draft = TitipanState.addDraft
    if (!draft) return

    if (index >= draft.items.length) {
      this.commitAddDraft()
      return
    }

    const item = draft.items[index]

    this.openCameraStep({
      title: `foto ${item.nama_item}`,
      subtitle: "Ambil foto barang ini, lalu klik centang.",
      confirmLabel: "✓",
      backLabel: "Kembali",
      onCapture: (dataUrl) => {
        item.foto_barang = dataUrl
        TitipanCore.beginAddPhotoSequence(index + 1)
      },
      onBack: () => {
        if (index === 0) {
          TitipanCore.showAddSummary()
        } else {
          TitipanCore.beginAddPhotoSequence(index - 1)
        }
      }
    })
  },

  async commitAddDraft(){
    const draft = TitipanState.addDraft
    if (!draft) return

    try {
      let fotoPenitipPath = null

      if (draft.foto_penitip) {
        fotoPenitipPath = await TitipanShared.uploadDataUrlToStorage(
          draft.foto_penitip,
          `titipan/${draft.session_id}/penitip`
        )
      }

      for (const item of draft.items) {
        const now = TitipanShared.formatDbTimestampWIB(new Date())

        let fotoBarangPath = null

        if (item.foto_barang) {
          fotoBarangPath = await TitipanShared.uploadDataUrlToStorage(
            item.foto_barang,
            `titipan/${draft.session_id}/barang`
          )
        }

        const payload = {
          session_id: draft.session_id,
          nama_item: item.nama_item,
          nama_penitip: item.nama_penitip,
          qty: item.qty,
          harga_jual: item.harga_jual,
          harga_penitip: item.harga_penitip,
          foto_penitip_path: fotoPenitipPath,
          foto_barang_path: fotoBarangPath,
          foto_penitip: null,
          foto_barang: null,
          created_at: now,
          updated_at: now
        }

        const { data: inserted, error: insertError } =
          await window.supabaseClient
            .from("barang_titipan")
            .insert(payload)
            .select("id")
            .single()

        if (insertError) throw insertError

        const { error: logError } =
          await window.supabaseClient
            .from("titipan_log")
            .insert({
              session_id: draft.session_id,
              item_id: inserted.id,
              jenis: "masuk",
              qty: item.qty,
              total: 0,
              nama_penitip: item.nama_penitip,
              foto_penitip_path: fotoPenitipPath,
              foto_bukti_path: fotoBarangPath || fotoPenitipPath,
              foto_penitip: null,
              foto_bukti: null,
              created_at: now
            })

        if (logError) throw logError
      }

      TitipanState.addDraft = null
      TitipanUI.closeModal()

      await this.loadData()
      await this.renderDashboard()

      TitipanUI.showToast("Barang berhasil ditambahkan")

    } catch (err) {
      alert("Gagal simpan titipan: " + err.message)
    }
  },

  /* =========================================================
     KEDATANGAN PENITIP
     ========================================================= */

  startArrivalFlow(prefillPenitip = "", preselectItemId = null){
    TitipanState.arrivalDraft = {
      session_id: TitipanShared.uid(),
      foto_bukti: null,
      penitip: prefillPenitip || "",
      lockPenitip: !!prefillPenitip,
      items: [],
      preselectItemId: preselectItemId || null,
      editingTmpId: null
    }

    TitipanUI.showSection("form")
    TitipanUI.renderArrivalForm({
      draft: TitipanState.arrivalDraft
    })
  },

  renderArrivalForm(){
    TitipanUI.showSection("form")
    TitipanUI.renderArrivalForm({
      draft: TitipanState.arrivalDraft
    })
  },

  getRemainingArrivalItems(){
    const draft = TitipanState.arrivalDraft
    if (!draft) return []

    const pen = TitipanShared.normalizeText(draft.penitip || "")
    const chosen = new Set((draft.items || []).map(x => x.item_id))

    return (TitipanState.data || []).filter(item =>
      TitipanShared.normalizeText(item.nama_penitip || "") === pen &&
      !chosen.has(item.id)
    )
  },

  editArrivalItem(tmpId){
    const draft = TitipanState.arrivalDraft
    if (!draft) return

    const item = draft.items.find(x => x.tmp_id === tmpId)
    if (!item) return

    draft.editingTmpId = item.tmp_id
    draft.preselectItemId = item.item_id

    TitipanUI.closeModal()
    TitipanCore.renderArrivalForm()

    const barangEl = document.getElementById("a_barang")
    const qtyEl = document.getElementById("a_qty")
    const nitipLagiEl = document.getElementById("a_nitip_lagi")
    const qtyBaruEl = document.getElementById("a_qty_baru")

    if (barangEl) barangEl.value = item.item_id
    if (qtyEl) qtyEl.value = Number(item.qty || 0)

    if (nitipLagiEl) {
      nitipLagiEl.checked = Number(item.qty_baru || 0) > 0
    }

    if (qtyBaruEl) {
      qtyBaruEl.value = Number(item.qty_baru || 0)
    }

    if (nitipLagiEl) {
      nitipLagiEl.dispatchEvent(new Event("change", { bubbles: true }))
    }
  },

  deleteArrivalItem(tmpId){
    const draft = TitipanState.arrivalDraft
    if (!draft) return

    const index = draft.items.findIndex(x => x.tmp_id === tmpId)
    if (index < 0) return

    const item = draft.items[index]

    const ok = confirm(
      `Hapus "${item.nama_item}" dari draft kedatangan?`
    )

    if (!ok) return

    draft.items.splice(index, 1)
    draft.editingTmpId = null
    draft.preselectItemId = null

    if (draft.items.length === 0) {
      TitipanUI.closeModal()
      TitipanCore.renderArrivalForm()
      return
    }

    TitipanCore.showArrivalSummary()
  },

  addAnotherArrivalItem(){
    const draft = TitipanState.arrivalDraft
    if (!draft) return

    draft.editingTmpId = null
    draft.preselectItemId = null

    TitipanUI.closeModal()
    TitipanCore.renderArrivalForm()
  },

  cancelArrivalDraft(){
    const draft = TitipanState.arrivalDraft
    if (!draft) return

    const ok = confirm(
      "Batalkan seluruh kedatangan penitip?\n\n" +
      "Semua item yang masih ada di draft akan dibuang."
    )

    if (!ok) return

    TitipanState.arrivalDraft = null
    TitipanUI.closeModal()
    TitipanCore.renderList()
  },

  async saveArrivalItem(){
    const draft = TitipanState.arrivalDraft

    if (!draft) {
      alert("Draft kedatangan belum ada")
      return
    }

    const penitip = document.getElementById("a_penitip")?.value.trim().replace(/\s+/g, " ")
    const itemId = document.getElementById("a_barang")?.value
    const qtyTerjualInput = TitipanShared.clampQty(document.getElementById("a_qty")?.value)
    const nitipLagi = document.getElementById("a_nitip_lagi")?.checked === true
    const qtyBaru = nitipLagi
      ? TitipanShared.clampQty(document.getElementById("a_qty_baru")?.value)
      : 0

    if (!penitip || !itemId) {
      alert("Lengkapi penitip dan barang")
      return
    }

    const item = (TitipanState.data || []).find(x => x.id === itemId)

    if (!item) {
      alert("Barang tidak ditemukan")
      return
    }

    if (!draft.penitip) draft.penitip = penitip
    draft.lockPenitip = true

    if (
      TitipanShared.normalizeText(item.nama_penitip) !==
      TitipanShared.normalizeText(penitip)
    ) {
      alert("Barang yang dipilih harus milik penitip yang sama")
      return
    }

    const canSell = Number(item.qty || 0) > 0
    const qtyTerjual = canSell ? qtyTerjualInput : 0

    if (canSell && qtyTerjual <= 0) {
      alert("Isi jumlah barang terjual")
      return
    }

    if (canSell && qtyTerjual > Number(item.qty || 0)) {
      alert("Qty terjual melebihi stok")
      return
    }

    if (nitipLagi && qtyBaru <= 0) {
      alert("Isi jumlah barang titip baru")
      return
    }

    const bayarPenitip =
      Number(item.harga_penitip || 0) * qtyTerjual

    const editingTmpId = draft.editingTmpId

    if (editingTmpId) {
      const editingIndex = draft.items.findIndex(
        x => x.tmp_id === editingTmpId
      )

      if (editingIndex < 0) {
        draft.editingTmpId = null
      } else {
        const duplicate = draft.items.find(
          x =>
            x.tmp_id !== editingTmpId &&
            x.item_id === item.id
        )

        if (duplicate) {
          alert("Barang ini sudah ada di baris lain.")
          return
        }

        draft.items[editingIndex] = {
          tmp_id: editingTmpId,
          item_id: item.id,
          nama_item: item.nama_item,
          nama_penitip: penitip,
          qty: qtyTerjual,
          total: bayarPenitip,
          qty_baru: qtyBaru,
          harga_penitip: Number(item.harga_penitip || 0),
          harga_jual: Number(item.harga_jual || 0),
          foto_penitip:
            item.foto_penitip ||
            item.foto_penitip_path ||
            null
        }

        draft.editingTmpId = null
        draft.preselectItemId = null

        TitipanCore.showArrivalSummary()
        return
      }
    }

    const existsSame = draft.items.find(
      x => x.item_id === item.id
    )

    if (existsSame) {
      const merge = confirm(
        "Barang ini sudah ada di sesi kedatangan. Tambah qty ke baris yang sama?"
      )

      if (!merge) return

      existsSame.qty += qtyTerjual
      existsSame.total += bayarPenitip
      existsSame.qty_baru =
        Number(existsSame.qty_baru || 0) + qtyBaru

    } else {
      draft.items.push({
        tmp_id: TitipanShared.uid(),
        item_id: item.id,
        nama_item: item.nama_item,
        nama_penitip: penitip,
        qty: qtyTerjual,
        total: bayarPenitip,
        qty_baru: qtyBaru,
        harga_penitip: Number(item.harga_penitip || 0),
        harga_jual: Number(item.harga_jual || 0),
        foto_penitip:
          item.foto_penitip ||
          item.foto_penitip_path ||
          null
      })
    }

    draft.preselectItemId = null

    TitipanCore.showArrivalSummary()
  },

  showArrivalSummary(){

  const draft = TitipanState.arrivalDraft
  if (!draft) return

  if (!draft.items.length) {
    TitipanUI.closeModal()
    TitipanCore.renderArrivalForm()
    return
  }

  const totalQtyJual = draft.items.reduce(
    (a, b) => a + Number(b.qty || 0),
    0
  )

  const totalBayar = draft.items.reduce(
    (a, b) => a + Number(b.total || 0),
    0
  )

  const totalQtyTitip = draft.items.reduce(
    (a, b) => a + Number(b.qty_baru || 0),
    0
  )

  /*
    ======================================================
    DAFTAR ITEM
    ======================================================

    Jangan gunakan class "summaryText" sebagai pembungkus
    daftar item karena CSS lama summaryText dapat membuat
    jarak vertikal menjadi sangat besar.
  */

  const itemLines = draft.items.map(item => {

    const nama =
      TitipanShared.escapeHtml(
        item.nama_item || "-"
      )

    const qty =
      Number(item.qty || 0)

    const qtyBaru =
      Number(item.qty_baru || 0)

    const total =
      TitipanShared.formatRupiah(
        item.total || 0
      )

    const tmpId =
      TitipanShared.escapeJs(
        item.tmp_id
      )

    return `
      <div
        style="
          border:1px solid #ddd;
          border-radius:12px;
          padding:12px;
          margin:0 0 10px 0;
          box-sizing:border-box;
          background:#fff;
        "
      >

        <!-- NAMA BARANG -->
        <div
          style="
            font-size:17px;
            font-weight:700;
            line-height:1.3;
            margin-bottom:10px;
          "
        >
          ${nama}
        </div>

        <!-- TERJUAL -->
        <div
          style="
            font-size:14px;
            line-height:1.4;
            margin-bottom:5px;
          "
        >
          Terjual:
          <strong>${qty}</strong>
          <span style="margin-left:6px">
            ${total}
          </span>
        </div>

        <!-- TITIP BARU -->
        ${
          qtyBaru > 0
            ? `
              <div
                style="
                  font-size:14px;
                  line-height:1.4;
                  margin-bottom:10px;
                "
              >
                Titip baru:
                <strong>${qtyBaru}</strong>
              </div>
            `
            : ""
        }

        <!-- TOMBOL ITEM -->
        <div
          style="
            display:flex;
            gap:8px;
            width:100%;
            margin-top:8px;
          "
        >

          <button
            type="button"
            class="blue"
            style="
              flex:1;
              min-width:0;
              min-height:42px;
              padding:9px 10px;
              border-radius:8px;
              box-sizing:border-box;
            "
            onclick="
              TitipanCore.editArrivalItem('${tmpId}')
            "
          >
            Edit
          </button>

          <button
            type="button"
            class="red"
            style="
              flex:1;
              min-width:0;
              min-height:42px;
              padding:9px 10px;
              border-radius:8px;
              box-sizing:border-box;
            "
            onclick="
              TitipanCore.deleteArrivalItem('${tmpId}')
            "
          >
            Hapus
          </button>

        </div>

      </div>
    `
  }).join("")

  /*
    ======================================================
    ISI RINGKASAN
    ======================================================
  */

  let body = `

    <div
      style="
        margin-bottom:12px;
        font-size:17px;
        font-weight:700;
        line-height:1.3;
      "
    >
      Penitip:
      ${TitipanShared.escapeHtml(
        draft.penitip || "-"
      )}
    </div>

    <!-- LIST ITEM -->
    <div
      style="
        display:block;
        width:100%;
        margin:0;
        padding:0;
        height:auto;
        min-height:0;
      "
    >
      ${itemLines}
    </div>

    <!-- TOTAL TERJUAL -->
    <div
      style="
        margin-top:12px;
        padding-top:10px;
        border-top:1px solid #eee;
        font-size:15px;
        font-weight:700;
        line-height:1.5;
      "
    >
      Total terjual:
      ${totalQtyJual}
      ${TitipanShared.formatRupiah(totalBayar)}
    </div>
  `

  /*
    ======================================================
    TOTAL TITIP BARU
    ======================================================
  */

  if (totalQtyTitip > 0) {

    body += `

      <div
        style="
          margin-top:5px;
          font-size:15px;
          font-weight:700;
          line-height:1.5;
        "
      >
        Total titip baru:
        ${totalQtyTitip}
      </div>

    `
  }

  /*
    ======================================================
    MODAL BUTTON
    ======================================================
  */

  TitipanUI.openSummary({

    title:
      "Ringkasan kedatangan",

    body,

    buttons: [

      {
        label:
          "+ Tambah Barang",

        className:
          "blue",

        onClick: () =>
          TitipanCore.addAnotherArrivalItem()
      },

      {
        label:
          "Lanjut Foto Bukti",

        className:
          "green",

        onClick: () =>
          TitipanCore.beginArrivalPhotoStep()
      },

      {
        label:
          "Batalkan Seluruh Kedatangan",

        className:
          "red",

        onClick: () =>
          TitipanCore.cancelArrivalDraft()
      }

    ]
  })
},

  continueArrival(){
    TitipanUI.closeModal()
    TitipanCore.addAnotherArrivalItem()
  },

  beginArrivalPhotoStep(){
    const draft = TitipanState.arrivalDraft
    if (!draft) return

    if (!draft.items.length) {
      alert("Belum ada barang dalam draft kedatangan.")
      return
    }

    this.openCameraStep({
      title: `foto bukti transaksi dengan ${draft.penitip}`,
      subtitle: "Ambil foto bukti transaksi, lalu klik centang.",
      confirmLabel: "✓",
      backLabel: "Kembali",

      onCapture: (dataUrl) => {
        draft.foto_bukti = dataUrl
        TitipanCore.commitArrivalDraft()
      },

      onBack: () => {
        TitipanCore.showArrivalSummary()
      }
    })
  },

  async commitArrivalDraft(){
    const draft = TitipanState.arrivalDraft
    if (!draft) return

    try {
      let fotoBuktiPath = null

      if (draft.foto_bukti) {
        fotoBuktiPath =
          await TitipanShared.uploadDataUrlToStorage(
            draft.foto_bukti,
            `titipan/${draft.session_id}/bukti`
          )
      }

      for (const row of draft.items) {
        const { data, error } =
          await window.supabaseClient.rpc(
            "proses_kedatangan_titipan",
            {
              p_item_id: row.item_id,
              p_qty_terjual: Number(row.qty || 0),
              p_qty_titip_baru: Number(row.qty_baru || 0),
              p_session_id: draft.session_id,
              p_nama_penitip: row.nama_penitip,
              p_foto_bukti_path: fotoBuktiPath
            }
          )

        if (error) throw error

        if (!data?.success) {
          throw new Error("Proses kedatangan gagal")
        }
      }

      TitipanState.arrivalDraft = null

      TitipanUI.closeModal()

      await this.loadData()
      await this.renderDashboard()

      TitipanUI.showToast(
        "Kedatangan penitip berhasil disimpan"
      )

    } catch (err) {
      console.error("commitArrivalDraft error:", err)

      alert(
        "Gagal simpan kedatangan: " +
        err.message
      )
    }
  },

  /* =========================================================
     UPDATE HARGA
     ========================================================= */

  openUpdateHarga(itemId){
    const item = (TitipanState.data || []).find(x => x.id === itemId)
    if (!item) return

    TitipanState.current = item
    TitipanUI.openUpdateHarga({ item })
  },

  async saveUpdateHarga(){

    const itemId =
      document.getElementById("u_item_id")?.value

    const hargaPenitip =
      TitipanShared.clampQty(
        document.getElementById("u_penitip")?.value
      )

    let hargaJual =
      TitipanShared.clampQty(
        document.getElementById("u_jual")?.value
      )

    const isAdmin =
      await TitipanShared.isAdmin()

    const namaItemEl =
      document.getElementById("u_nama_item")

    const namaPenitipEl =
      document.getElementById("u_nama_penitip")

    if (!itemId || hargaPenitip <= 0) {
      alert("Harga tidak valid")
      return
    }

    if (hargaJual <= 0) {
      hargaJual =
        TitipanShared.rekomendasiHargaJual(
          hargaPenitip
        )
    }

    let namaItem = null
    let namaPenitip = null

    if (isAdmin) {
      namaItem =
        namaItemEl?.value
          .trim()
          .replace(/\s+/g, " ")

      namaPenitip =
        namaPenitipEl?.value
          .trim()
          .replace(/\s+/g, " ")

      if (!namaItem || !namaPenitip) {
        alert(
          "Nama barang dan nama penitip wajib diisi"
        )
        return
      }
    }

    const { data, error } =
      await window.supabaseClient.rpc(
        "update_harga_titipan",
        {
          p_item_id: itemId,
          p_harga_penitip: hargaPenitip,
          p_harga_jual: hargaJual,
          p_nama_item: namaItem,
          p_nama_penitip: namaPenitip
        }
      )

    if (error) {
      console.error(
        "update_harga_titipan error:",
        error
      )

      alert(
        "Gagal update harga: " +
        error.message
      )

      return
    }

    if (!data?.success) {
      alert("Update harga gagal")
      return
    }

    TitipanUI.closeModal()

    await this.loadData()
    await this.renderDashboard()

    TitipanUI.showToast(
      "Data berhasil diperbarui"
    )
  },

  /* =========================================================
     HAPUS BARANG
     ========================================================= */

  async hapusBarang(id){

    const isAdmin =
      await TitipanShared.isAdmin()

    if (!isAdmin) return

    const item =
      (TitipanState.data || [])
        .find(x => x.id === id)

    if (!item) return

    const ok =
      confirm(
        "Hapus barang titipan ini?\n\n" +
        `${item.nama_item}\n` +
        `${item.nama_penitip}\n\n` +
        "Semua log item ini juga akan ikut dihapus."
      )

    if (!ok) return

    const { error: logError } =
      await window.supabaseClient
        .from("titipan_log")
        .delete()
        .eq("item_id", id)

    if (logError) {
      alert(
        "Gagal hapus log: " +
        logError.message
      )
      return
    }

    const { error } =
      await window.supabaseClient
        .from("barang_titipan")
        .delete()
        .eq("id", id)

    if (error) {
      alert(
        "Gagal hapus barang: " +
        error.message
      )
      return
    }

    await this.loadData()
    await this.renderDashboard()

    TitipanUI.showToast(
      "Barang berhasil dihapus"
    )
  },

  /* =========================================================
     LOG
     ========================================================= */

  async showLog(mode = "today"){

    TitipanState.logMode = mode

    TitipanUI.showSection("aksi")
    TitipanUI.renderLoading("Loading...")

    const now =
      TitipanShared.nowWIB()

    let query =
      window.supabaseClient
        .from("titipan_log")
        .select(`
          id,
          item_id,
          session_id,
          nama_penitip,
          foto_penitip,
          foto_bukti,
          foto_penitip_path,
          foto_bukti_path,
          qty,
          total,
          created_at,
          jenis
        `)
        .order("created_at", {
          ascending: false
        })
        .limit(500)

    if (mode === "today") {

      const range =
        TitipanShared.getWibDayRange(now)

      query =
        query
          .gte(
            "created_at",
            range.startDB
          )
          .lte(
            "created_at",
            range.endDB
          )
    }

    if (mode === "week") {

      const start =
        new Date(now)

      start.setDate(
        start.getDate() - 6
      )

      start.setHours(
        0,
        0,
        0,
        0
      )

      const end =
        new Date(now)

      end.setHours(
        23,
        59,
        59,
        999
      )

      query =
        query
          .gte(
            "created_at",
            TitipanShared.formatDbTimestampWIB(start)
          )
          .lte(
            "created_at",
            TitipanShared.formatDbTimestampWIB(end)
          )
    }

    const { data, error } =
      await query

    if (error) {
      TitipanUI.renderLoading(
        "Gagal load log"
      )
      return
    }

    const rows = data || []

    const isAdmin =
      await TitipanShared.isAdmin()

    if (isAdmin) {
      TitipanUI.renderLogAdmin(rows)
    } else {
      TitipanUI.renderLogNormal(rows)
    }
  },

  /* =========================================================
     CAMERA
     ========================================================= */

  async openCameraStep({
    title,
    subtitle,
    confirmLabel = "✓",
    backLabel = "Kembali",
    onCapture,
    onBack
  }){

    TitipanUI.openCamera({
      title,
      subtitle,
      confirmLabel,
      backLabel
    })

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment"
          },
          audio: false
        })

      TitipanState.camera.stream =
        stream

      TitipanState.camera.onCapture =
        onCapture

      TitipanState.camera.onBack =
        onBack

      const video =
        document.getElementById(
          "cameraVideo"
        )

      if (video) {
        video.srcObject = stream
        await video.play()
      }

    } catch (err) {

      TitipanUI.closeModal()

      alert(
        "Kamera tidak bisa dibuka: " +
        err.message
      )
    }
  },

  stopCamera(){

    const stream =
      TitipanState.camera.stream

    if (stream) {
      stream
        .getTracks()
        .forEach(t => t.stop())
    }

    TitipanState.camera.stream = null
    TitipanState.camera.onCapture = null
    TitipanState.camera.onBack = null
  },

  captureCameraPhoto(){

    const video =
      document.getElementById(
        "cameraVideo"
      )

    if (
      !video ||
      !TitipanState.camera.onCapture
    ) {

      alert(
        "Kamera belum siap"
      )

      return
    }

    const canvas =
      document.createElement("canvas")

    canvas.width =
      video.videoWidth || 1280

    canvas.height =
      video.videoHeight || 720

    const ctx =
      canvas.getContext("2d")

    if (!ctx) {
      alert("Gagal ambil foto")
      return
    }

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const dataUrl =
      canvas.toDataURL(
        "image/jpeg",
        0.88
      )

    const cb =
      TitipanState.camera.onCapture

    this.stopCamera()
    TitipanUI.closeModal()

    if (typeof cb === "function") {
      cb(dataUrl)
    }
  },

  cameraBack(){

    const cb =
      TitipanState.camera.onBack

    this.stopCamera()
    TitipanUI.closeModal()

    if (typeof cb === "function") {
      cb()
    }
  }
}
