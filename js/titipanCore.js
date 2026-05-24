window.TitipanCore = {
  state: {
    data: [],
    current: null,
    saveLock: false,
    dashboardLoaded: false
  },

  isAdmin(){
    return localStorage.getItem("adminLogin") === "true"
  },

  normalizeText(str){
    return String(str || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
  },

  escapeJS(str){
    return String(str || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
  },

  nowWIB(){
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    )
  },

  async loadDashboard(){

    let today = this.nowWIB()
    today.setHours(0,0,0,0)

    const { data, error } = await window.supabaseClient
      .from("titipan_log")
      .select("qty, total, created_at, jenis")
      .eq("jenis", "ambil")
      .gte("created_at", today.toISOString())

    if(error){
      console.log(error)
      return
    }

    let qty = 0
    let total = 0

    ;(data || []).forEach(i=>{
      qty += Number(i.qty || 0)
      total += Number(i.total || 0)
    })

    const qtyEl = document.getElementById("dashQty")
    const totalEl = document.getElementById("dashTotal")

    if(qtyEl) qtyEl.innerText = qty + " pcs"
    if(totalEl) totalEl.innerText = "Rp " + total.toLocaleString("id-ID")

    this.state.dashboardLoaded = true
  },

  async loadData(){

    if(this.isAdmin()){
      await this.loadDashboard()
    }else{
      const qtyEl = document.getElementById("dashQty")
      const totalEl = document.getElementById("dashTotal")
      const dash = document.querySelector(".dashboard")

      if(dash) dash.style.display = "none"
      if(qtyEl) qtyEl.innerText = "0 pcs"
      if(totalEl) totalEl.innerText = "Rp 0"
    }

    const { data, error } = await window.supabaseClient
      .from("barang_titipan")
      .select("*")
      .order("nama_item", { ascending: true })

    if(error){
      alert(error.message)
      return
    }

    this.state.data = data || []

    if(window.TitipanUI && typeof window.TitipanUI.renderList === "function"){
      window.TitipanUI.renderList()
    }
  },

  findDuplicate(nama, penitip){

    const keyNama = this.normalizeText(nama)
    const keyPenitip = this.normalizeText(penitip)

    return this.state.data.find(item =>
      this.normalizeText(item.nama_item) === keyNama &&
      this.normalizeText(item.nama_penitip) === keyPenitip
    ) || null
  },

  async simpanTambah(){

    if(this.state.saveLock) return
    this.state.saveLock = true

    try{
      const nama = document.getElementById("t_nama").value.trim().replace(/\s+/g, " ")
      const penitip = document.getElementById("t_penitip").value.trim().replace(/\s+/g, " ")
      const qty = parseInt(document.getElementById("t_qty").value || 0)
      const jual = parseInt(document.getElementById("t_jual").value || 0)
      const pen = parseInt(document.getElementById("t_pen").value || 0)

      if(!nama || !penitip || qty <= 0){
        alert("Lengkapi data")
        return
      }

      if(jual < 0 || pen < 0){
        alert("Harga tidak valid")
        return
      }

      const duplicate = this.findDuplicate(nama, penitip)

      if(duplicate){
        const gabung = confirm(
          "Barang dengan nama dan penitip yang sama sudah ada.\n\n" +
          "Gabungkan qty ke data yang sudah ada?"
        )

        if(!gabung){
          alert("Simpan dibatalkan supaya tidak membuat duplikat.")
          return
        }

        const updateQty = Number(duplicate.qty || 0) + qty

        const { error: updateError } = await window.supabaseClient
          .from("barang_titipan")
          .update({
            qty: updateQty,
            harga_jual: jual,
            harga_penitip: pen,
            updated_at: new Date().toISOString()
          })
          .eq("id", duplicate.id)

        if(updateError){
          alert(updateError.message)
          return
        }

        await window.supabaseClient
          .from("titipan_log")
          .insert({
            item_id: duplicate.id,
            jenis: "masuk",
            qty: qty,
            total: 0
          })

        await this.loadData()
        return
      }

      const { data, error } = await window.supabaseClient
        .from("barang_titipan")
        .insert({
          nama_item: nama,
          nama_penitip: penitip,
          qty: qty,
          harga_jual: jual,
          harga_penitip: pen,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if(error){
        alert(error.message)
        return
      }

      await window.supabaseClient
        .from("titipan_log")
        .insert({
          item_id: data.id,
          jenis: "masuk",
          qty: qty,
          total: 0
        })

      await this.loadData()

    } finally {
      this.state.saveLock = false
    }
  },

  async prosesAksi(){

    if(this.state.saveLock) return
    this.state.saveLock = true

    try{
      const current = this.state.current
      if(!current) return

      const ambil = !!document.getElementById("c_ambil")?.checked
      const harga = !!document.getElementById("c_harga")?.checked
      const nitip = !!document.getElementById("c_nitip")?.checked

      if(!ambil && !harga && !nitip){
        alert("Pilih aksi dulu")
        return
      }

      let updateData = {}
      let logs = []

      if(ambil){
        const lakuEl = document.getElementById("laku")
        const terjual = parseInt(lakuEl?.value || 0)

        if(terjual <= 0){
          alert("Isi jumlah terjual")
          return
        }

        if(terjual > Number(current.qty || 0)){
          alert("Melebihi stok")
          return
        }

        const totalBayarPenitip =
          terjual * Number(current.harga_penitip || 0)

        logs.push({
          item_id: current.id,
          jenis: "ambil",
          qty: terjual,
          total: totalBayarPenitip
        })

        if(!nitip){
          updateData.qty = Number(current.qty || 0) - terjual
        }
      }

      if(nitip){
        const qEl = document.getElementById("n_qty")
        const q = parseInt(qEl?.value || 0)

        if(q <= 0){
          alert("Isi qty baru")
          return
        }

        updateData.qty = q

        logs.push({
          item_id: current.id,
          jenis: "masuk",
          qty: q,
          total: 0
        })
      }

      if(harga){
        const ujual = parseInt(document.getElementById("u_jual")?.value || 0)
        const upen = parseInt(document.getElementById("u_pen")?.value || 0)

        updateData.harga_jual = ujual
        updateData.harga_penitip = upen
        updateData.updated_at = new Date().toISOString()

        logs.push({
          item_id: current.id,
          jenis: "harga",
          qty: 0,
          total: 0
        })
      } else {
        updateData.updated_at = new Date().toISOString()
      }

      const { error } = await window.supabaseClient
        .from("barang_titipan")
        .update(updateData)
        .eq("id", current.id)

      if(error){
        alert(error.message)
        return
      }

      for(const log of logs){
        const { error: logError } = await window.supabaseClient
          .from("titipan_log")
          .insert(log)

        if(logError){
          console.log(logError)
        }
      }

      await this.loadData()

    } finally {
      this.state.saveLock = false
    }
  },

  async hapusBarang(id, nama, penitip){

    if(!this.isAdmin()) return

    const ok = confirm(
      "Hapus barang titipan ini?\n\n" +
      (nama || "-") + "\n" +
      (penitip || "-") +
      "\n\nSemua log milik item ini juga akan ikut dihapus."
    )

    if(!ok) return

    const { error: logError } = await window.supabaseClient
      .from("titipan_log")
      .delete()
      .eq("item_id", id)

    if(logError){
      alert("Gagal hapus log: " + logError.message)
      return
    }

    const { error } = await window.supabaseClient
      .from("barang_titipan")
      .delete()
      .eq("id", id)

    if(error){
      alert("Gagal hapus barang: " + error.message)
      return
    }

    if(this.state.current && this.state.current.id === id){
      this.state.current = null
      if(window.TitipanUI && typeof window.TitipanUI.showMainList === "function"){
        window.TitipanUI.showMainList()
      }
    }

    await this.loadData()
  },

  async showLog(mode="today"){

    if(window.TitipanUI && typeof window.TitipanUI.showLogView === "function"){
      window.TitipanUI.showLogView()
    }

    const container = document.getElementById("aksiArea")
    if(!container) return

    container.innerHTML = "<div class='box'>Loading...</div>"

    const { data, error } = await window.supabaseClient
      .from("titipan_log")
      .select("*")
      .order("created_at", { ascending:false })
      .limit(200)

    if(error){
      container.innerHTML = "<div class='box'>Gagal load log</div>"
      return
    }

    const now = new Date()
    let totalHari = 0
    let trxHari = 0

    let html = `
      <div class="box">
        <h3>Riwayat</h3>

        <div class="rowBtn">
          <button class="blue" onclick="TitipanCore.showLog('today')">Hari Ini</button>
          <button class="orange" onclick="TitipanCore.showLog('week')">7 Hari</button>
          <button class="green" onclick="TitipanCore.showLog('all')">Semua</button>
        </div>
    `

    ;(data || []).forEach(i=>{
      const t = new Date(i.created_at)
      const diff = (now - t) / 86400000

      if(mode === "today" && t.toDateString() !== now.toDateString()) return
      if(mode === "week" && diff > 7) return

      if(t.toDateString() === now.toDateString()){
        trxHari++
        if(i.jenis === "ambil"){
          totalHari += Number(i.total || 0)
        }
      }

      const item = this.state.data.find(x=>x.id == i.item_id)

      const nama = item ? item.nama_item : "-"
      const penitip = item ? item.nama_penitip : "-"

      let cls = "logMasuk"
      let icon = "🟢"

      if(i.jenis === "ambil"){
        cls = "logAmbil"
        icon = "🔴"
      }

      if(i.jenis === "harga"){
        cls = "logHarga"
        icon = "🟡"
      }

      html += `
        <div class="box ${cls}">
          <b>${icon} ${i.jenis}</b><br>
          ${nama} - ${penitip}<br>
          Qty: ${i.qty || 0} |
          Rp ${Number(i.total || 0).toLocaleString('id-ID')}<br>
          <span class="kecil">${t.toLocaleString('id-ID')}</span>
        </div>
      `
    })

    html += `
        <div class="box">
          <b>Total bayar penitip hari ini</b><br>
          Rp ${totalHari.toLocaleString('id-ID')}<br><br>

          <b>Total transaksi hari ini</b><br>
          ${trxHari}
        </div>

        <button class="red" onclick="TitipanUI.renderList()">Kembali</button>
      </div>
    `

    container.innerHTML = html
  }
}
