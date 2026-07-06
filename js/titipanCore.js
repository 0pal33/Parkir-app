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
    TitipanUI.setAdminView(TitipanShared.isAdmin())
    await this.loadData()
    await this.renderDashboard()
    TitipanUI.renderHome()
    this.bindTopButtons()
  },

  bindTopButtons(){
    const kedatanganBtn = document.getElementById("btnKedatangan")
    const logBtn = document.getElementById("btnLog")
    const homeBtn = document.getElementById("btnHome")

    if (kedatanganBtn) kedatanganBtn.onclick = () => TitipanCore.startArrivalFlow()
    if (logBtn) logBtn.onclick = () => TitipanCore.showLog("today")
    if (homeBtn) homeBtn.onclick = () => { location.href = "index.html" }
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

    if (!TitipanShared.isAdmin()) {
      dash.style.display = "none"
      return
    }

    dash.style.display = "grid"

    const { startDB } = TitipanShared.getWibDayRange(new Date())

const { data, error } = await window.supabaseClient
  .from("titipan_log")
  .select("qty,total,created_at,jenis")
  .eq("jenis", "ambil")
  .gte("created_at", startDB)

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

    const src = item.foto_barang || item.foto_penitip || ""
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

    const src = item.foto_penitip || item.foto_barang || ""
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
  if(!draft) return

  try{
    let fotoPenitipPath = null

    if(draft.foto_penitip){
      fotoPenitipPath = await TitipanShared.uploadDataUrlToStorage(
        draft.foto_penitip,
        `titipan/${draft.session_id}/penitip`
      )
    }

    for(const item of draft.items){
      const now = TitipanShared.formatDbTimestampWIB(new Date())

      let fotoBarangPath = null
      if(item.foto_barang){
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

      const { data: inserted, error: insertError } = await window.supabaseClient
        .from("barang_titipan")
        .insert(payload)
        .select("id")
        .single()

      if(insertError) throw insertError

      const { error: logError } = await window.supabaseClient
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

      if(logError) throw logError
    }

    TitipanState.addDraft = null
    TitipanUI.closeModal()
    await this.loadData()
    await this.renderDashboard()
    TitipanUI.showToast("Barang berhasil ditambahkan")
  }catch(err){
    alert("Gagal simpan titipan: " + err.message)
  }
},

  startArrivalFlow(prefillPenitip = "", preselectItemId = null){
    TitipanState.arrivalDraft = {
      session_id: TitipanShared.uid(),
      foto_bukti: null,
      penitip: prefillPenitip || "",
      lockPenitip: !!prefillPenitip,
      items: [],
      preselectItemId: preselectItemId || null
    }

    TitipanUI.showSection("form")
    TitipanUI.renderArrivalForm({ draft: TitipanState.arrivalDraft })
  },

  renderArrivalForm(){
    TitipanUI.showSection("form")
    TitipanUI.renderArrivalForm({ draft: TitipanState.arrivalDraft })
  },

  getRemainingArrivalItems(){
    const draft = TitipanState.arrivalDraft
    if (!draft) return []

    const pen = TitipanShared.normalizeText(draft.penitip || "")
    const chosen = new Set((draft.items || []).map(x => x.item_id))

    return (TitipanState.data || []).filter(item =>
      TitipanShared.normalizeText(item.nama_penitip || "") === pen &&
      Number(item.qty || 0) > 0 &&
      !chosen.has(item.id)
    )
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
  const qtyBaru = nitipLagi ? TitipanShared.clampQty(document.getElementById("a_qty_baru")?.value) : 0

  if (!penitip || !itemId) {
    alert("Lengkapi penitip dan barang")
    return
  }

  const item = (TitipanState.data || []).find(x => x.id === itemId)
  if (!item) {
    alert("Barang tidak ditemukan")
    return
  }

  if (!draft.penitip) {
    draft.penitip = penitip
  }

  draft.lockPenitip = true

  if (TitipanShared.normalizeText(item.nama_penitip) !== TitipanShared.normalizeText(penitip)) {
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

  const bayarPenitip = Number(item.harga_penitip || 0) * qtyTerjual

  const existsSame = draft.items.find(x => x.item_id === item.id)
  if (existsSame) {
    const merge = confirm("Barang ini sudah ada di sesi kedatangan. Tambah qty ke baris yang sama?")
    if (merge) {
      existsSame.qty += qtyTerjual
      existsSame.total += bayarPenitip
      existsSame.qty_baru = Number(existsSame.qty_baru || 0) + qtyBaru
    } else {
      return
    }
  } else {
    draft.items.push({
      item_id: item.id,
      nama_item: item.nama_item,
      nama_penitip: penitip,
      qty: qtyTerjual,
      total: bayarPenitip,
      qty_baru: qtyBaru,
      harga_penitip: Number(item.harga_penitip || 0),
      harga_jual: Number(item.harga_jual || 0),
      foto_penitip: item.foto_penitip || null
    })
  }

  const remaining = TitipanCore.getRemainingArrivalItems()

  if (remaining.length > 0) {
    TitipanCore.showArrivalSummary()
  } else {
    TitipanCore.beginArrivalPhotoStep()
  }
},

  showArrivalSummary(){
  const draft = TitipanState.arrivalDraft
  if (!draft) return

  const totalQtyJual = draft.items.reduce((a, b) => a + Number(b.qty || 0), 0)
  const totalBayar = draft.items.reduce((a, b) => a + Number(b.total || 0), 0)
  const totalQtyTitip = draft.items.reduce((a, b) => a + Number(b.qty_baru || 0), 0)

  const jualLines = draft.items
    .filter(i => Number(i.qty || 0) > 0)
    .map(i => `${TitipanShared.escapeHtml(i.nama_item)} ${Number(i.qty || 0)} ${TitipanShared.formatRupiah(i.total)}`)
    .join("<br>")

  const titipLines = draft.items
    .filter(i => Number(i.qty_baru || 0) > 0)
    .map(i => `${TitipanShared.escapeHtml(i.nama_item)} ${Number(i.qty_baru || 0)}`)
    .join("<br>")

  let body = `
    <div class="summaryText">
      ${jualLines || "-"}
    </div>
    <div class="summaryTotal">
      Total ${totalQtyJual} ${TitipanShared.formatRupiah(totalBayar)}
    </div>
  `

  if (totalQtyTitip > 0) {
    body += `
      <div class="summaryQuestion" style="margin-top:14px;font-weight:bold">Titip baru :</div>
      <div class="summaryText">
        ${titipLines || "-"}
      </div>
      <div class="summaryTotal">
        Total ${totalQtyTitip}
      </div>
    `
  }

  body += `
    <div class="summaryQuestion">apakah penitip datang untuk barang lainnya?</div>
  `

  TitipanUI.openSummary({
    title: "Ringkasan kedatangan",
    body,
    buttons: [
      { label: "Ya", className: "blue", onClick: () => TitipanCore.continueArrival() },
      { label: "Tidak", className: "green", onClick: () => TitipanCore.beginArrivalPhotoStep() },
      {
        label: "Batal",
        className: "red",
        onClick: () => {
          TitipanUI.closeModal()
          TitipanCore.renderArrivalForm()
        }
      }
    ]
  })
},

  continueArrival(){
  TitipanUI.closeModal()
  TitipanCore.renderArrivalForm()
},

  beginArrivalPhotoStep(){
  const draft = TitipanState.arrivalDraft
  if (!draft) return

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
  if(!draft) return

  try{
    let fotoBuktiPath = null

    if(draft.foto_bukti){
      fotoBuktiPath = await TitipanShared.uploadDataUrlToStorage(
        draft.foto_bukti,
        `titipan/${draft.session_id}/bukti`
      )
    }

    for(const row of draft.items){
      const { data: item, error: fetchError } = await window.supabaseClient
        .from("barang_titipan")
        .select("*")
        .eq("id", row.item_id)
        .single()

      if(fetchError) throw fetchError

      const now = TitipanShared.formatDbTimestampWIB(new Date())
      const qtyTerjual = Number(row.qty || 0)
      const qtyTitipBaru = Number(row.qty_baru || 0)
      const oldQty = Number(item.qty || 0)

      if(qtyTerjual > oldQty){
        throw new Error("Qty terjual melebihi stok")
      }

      // Satu row aktif saja:
      // stok setelah penitip datang = qty titip baru
      // kalau tidak titip lagi, qty jadi 0
      const { error: updError } = await window.supabaseClient
        .from("barang_titipan")
        .update({
          qty: qtyTitipBaru,
          updated_at: now,
          session_id: draft.session_id
        })
        .eq("id", row.item_id)

      if(updError) throw updError

      // log barang yang diambil / terjual
      const { error: logAmbilError } = await window.supabaseClient
        .from("titipan_log")
        .insert({
          session_id: draft.session_id,
          item_id: row.item_id,
          jenis: "ambil",
          qty: qtyTerjual,
          total: row.total,
          nama_penitip: row.nama_penitip,
          foto_penitip_path: item.foto_penitip_path || null,
          foto_bukti_path: fotoBuktiPath,
          foto_penitip: null,
          foto_bukti: null,
          created_at: now
        })

      if(logAmbilError) throw logAmbilError

      // kalau penitip nitip lagi, cukup catat log masuk pada item yang sama
      if(qtyTitipBaru > 0){
        const { error: logMasukError } = await window.supabaseClient
          .from("titipan_log")
          .insert({
            session_id: draft.session_id,
            item_id: row.item_id,
            jenis: "masuk",
            qty: qtyTitipBaru,
            total: 0,
            nama_penitip: row.nama_penitip,
            foto_penitip_path: item.foto_penitip_path || null,
            foto_bukti_path: fotoBuktiPath,
            foto_penitip: null,
            foto_bukti: null,
            created_at: now
          })

        if(logMasukError) throw logMasukError
      }
    }

    TitipanState.arrivalDraft = null
    TitipanUI.closeModal()
    await this.loadData()
    await this.renderDashboard()
    TitipanUI.showToast("Kedatangan penitip berhasil disimpan")
  }catch(err){
    alert("Gagal simpan kedatangan: " + err.message)
  }
},

  openUpdateHarga(itemId){
    const item = (TitipanState.data || []).find(x => x.id === itemId)
    if (!item) return
    TitipanState.current = item
    TitipanUI.openUpdateHarga({ item })
  },

  async saveUpdateHarga(){
  const itemId = document.getElementById("u_item_id")?.value
  const hargaPenitip = TitipanShared.clampQty(document.getElementById("u_penitip")?.value)
  let hargaJual = TitipanShared.clampQty(document.getElementById("u_jual")?.value)

  const isAdmin = TitipanShared.isAdmin()
  const namaItemEl = document.getElementById("u_nama_item")
  const namaPenitipEl = document.getElementById("u_nama_penitip")

  if(!itemId || hargaPenitip <= 0){
    alert("Harga tidak valid")
    return
  }

  if(hargaJual <= 0){
    hargaJual = TitipanShared.rekomendasiHargaJual(hargaPenitip)
  }

  const payload = {
    harga_penitip: hargaPenitip,
    harga_jual: hargaJual,
    updated_at: TitipanShared.formatDbTimestampWIB(new Date())
  }

  if(isAdmin){
    const namaItem = namaItemEl?.value.trim().replace(/\s+/g, " ")
    const namaPenitip = namaPenitipEl?.value.trim().replace(/\s+/g, " ")

    if(!namaItem || !namaPenitip){
      alert("Nama barang dan nama penitip wajib diisi")
      return
    }

    payload.nama_item = namaItem
    payload.nama_penitip = namaPenitip
  }

  const { error } = await window.supabaseClient
    .from("barang_titipan")
    .update(payload)
    .eq("id", itemId)

  if(error){
    alert(error.message)
    return
  }

  TitipanUI.closeModal()
  await this.loadData()
  await this.renderDashboard()
  TitipanUI.showToast("Data berhasil diperbarui")
},

  async hapusBarang(id){
    if (!TitipanShared.isAdmin()) return

    const item = (TitipanState.data || []).find(x => x.id === id)
    if (!item) return

    const ok = confirm(
      "Hapus barang titipan ini?\n\n" +
      `${item.nama_item}\n${item.nama_penitip}\n\n` +
      "Semua log item ini juga akan ikut dihapus."
    )

    if (!ok) return

    const { error: logError } = await window.supabaseClient
      .from("titipan_log")
      .delete()
      .eq("item_id", id)

    if (logError) {
      alert("Gagal hapus log: " + logError.message)
      return
    }

    const { error } = await window.supabaseClient
      .from("barang_titipan")
      .delete()
      .eq("id", id)

    if (error) {
      alert("Gagal hapus barang: " + error.message)
      return
    }

    await this.loadData()
    await this.renderDashboard()
    TitipanUI.showToast("Barang berhasil dihapus")
  },

  async showLog(mode = "today"){
  TitipanState.logMode = mode
  TitipanUI.showSection("aksi")
  TitipanUI.renderLoading("Loading...")

  const now = TitipanShared.nowWIB()
  let query = window.supabaseClient
    .from("titipan_log")
    .select(`
      id,
      item_id,
      session_id,
      nama_penitip,
      foto_penitip,
      foto_bukti,
      qty,
      total,
      created_at,
      jenis
    `)
    .order("created_at", { ascending: false })
    .limit(500)

  if(mode === "today"){
    const range = TitipanShared.getWibDayRange(now)
query = query.gte("created_at", range.startDB).lte("created_at", range.endDB)
  }

  if(mode === "week"){
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    start.setHours(0,0,0,0)

    const end = new Date(now)
    end.setHours(23,59,59,999)

    query = query.gte("created_at", TitipanShared.formatDbTimestampWIB(start))
             .lte("created_at", TitipanShared.formatDbTimestampWIB(end))
  }

  const { data, error } = await query

  if(error){
    TitipanUI.renderLoading("Gagal load log")
    return
  }

  const rows = data || []

  if(!rows.length){
    TitipanUI.renderLoading("Tidak ada data")
    return
  }

  if(TitipanShared.isAdmin()){
    TitipanUI.renderLogAdmin(rows)
  }else{
    TitipanUI.renderLogNormal(rows)
  }
},

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

    try{
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      })

      TitipanState.camera.stream = stream
      TitipanState.camera.onCapture = onCapture
      TitipanState.camera.onBack = onBack

      const video = document.getElementById("cameraVideo")
      if (video) {
        video.srcObject = stream
        await video.play()
      }
    }catch(err){
      TitipanUI.closeModal()
      alert("Kamera tidak bisa dibuka: " + err.message)
    }
  },

  stopCamera(){
    const stream = TitipanState.camera.stream
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }
    TitipanState.camera.stream = null
    TitipanState.camera.onCapture = null
    TitipanState.camera.onBack = null
  },

  captureCameraPhoto(){
    const video = document.getElementById("cameraVideo")
    if (!video || !TitipanState.camera.onCapture) {
      alert("Kamera belum siap")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      alert("Gagal ambil foto")
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88)

    const cb = TitipanState.camera.onCapture
    this.stopCamera()
    TitipanUI.closeModal()

    if (typeof cb === "function") {
      cb(dataUrl)
    }
  },

  cameraBack(){
    const cb = TitipanState.camera.onBack
    this.stopCamera()
    TitipanUI.closeModal()
    if (typeof cb === "function") cb()
  }
}