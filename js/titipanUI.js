window.TitipanUI = {

  showMainList(){
    const judul = document.getElementById("judul")
    const searchBox = document.getElementById("searchBox")
    const listArea = document.getElementById("listArea")
    const formArea = document.getElementById("formArea")
    const aksiArea = document.getElementById("aksiArea")

    if(judul) judul.style.display = "block"
    if(searchBox) searchBox.style.display = "block"
    if(listArea) listArea.style.display = "block"
    if(formArea) formArea.style.display = "none"
    if(aksiArea) aksiArea.style.display = "none"
  },

  hideMainList(){
    const judul = document.getElementById("judul")
    const searchBox = document.getElementById("searchBox")
    const listArea = document.getElementById("listArea")
    const formArea = document.getElementById("formArea")
    const aksiArea = document.getElementById("aksiArea")

    if(judul) judul.style.display = "none"
    if(searchBox) searchBox.style.display = "none"
    if(listArea) listArea.style.display = "none"
    if(formArea) formArea.style.display = "none"
    if(aksiArea) aksiArea.style.display = "none"
  },

  renderList(){

    this.showMainList()

    const listArea = document.getElementById("listArea")
    const searchBox = document.getElementById("searchBox")
    if(!listArea || !searchBox) return

    const cari = searchBox.value.toLowerCase()
    const data = TitipanCore.state.data || []

    const hasil = data.filter(i =>
      (i.nama_item || "").toLowerCase().includes(cari) ||
      (i.nama_penitip || "").toLowerCase().includes(cari)
    )

    let html = ""

    if(hasil.length === 0){
      html = "<div class='box'>Tidak ada data</div>"
      listArea.innerHTML = html
      return
    }

    hasil.forEach(i=>{
      const warna = Number(i.qty || 0) <= 0 ? "#ffd6d6" : "#fff"

      html += `
        <div class="item" style="background:${warna}">
          <div style="flex:1;min-width:0">
            <div class="nama">${i.nama_item || "-"}</div>
            <div class="kecil">${i.nama_penitip || "-"}</div>
            <div class="kecil">
              Jual Rp ${Number(i.harga_jual || 0).toLocaleString('id-ID')}
            </div>
          </div>

          <div class="qty">${i.qty || 0}</div>

          <div class="listActionBtns">
            <button class="blue" onclick="TitipanUI.formAksi('${i.id}')">📥</button>
            ${
              TitipanCore.isAdmin()
              ? `<button class="red" onclick="TitipanCore.hapusBarang('${i.id}','${TitipanCore.escapeJS(i.nama_item)}','${TitipanCore.escapeJS(i.nama_penitip)}')">🗑</button>`
              : ""
            }
          </div>
        </div>
      `
    })

    listArea.innerHTML = html
  },

  formTambah(){

    this.hideMainList()

    const formArea = document.getElementById("formArea")
    if(!formArea) return

    formArea.style.display = "block"
    formArea.innerHTML = `
      <div class="box">
        <h3>Tambah Barang</h3>

        <input id="t_nama" placeholder="Nama barang">
        <input id="t_penitip" placeholder="Nama penitip">
        <input id="t_qty" type="number" placeholder="Jumlah titip">
        <input id="t_jual" type="number" placeholder="Harga jual">
        <input id="t_pen" type="number" placeholder="Harga penitip">

        <div class="kecilBox" style="margin:8px 0 12px">
          Kalau nama barang + penitip sama sudah ada, sistem akan menawarkan penggabungan agar tidak dobel.
        </div>

        <div class="rowBtn">
          <button class="green" onclick="TitipanCore.simpanTambah()">Simpan</button>
          <button class="red" onclick="TitipanUI.renderList()">Batal</button>
        </div>
      </div>
    `
  },

  formAksi(id){

    const item = (TitipanCore.state.data || []).find(x=>x.id === id)
    if(!item) return

    TitipanCore.state.current = item
    this.hideMainList()

    const aksiArea = document.getElementById("aksiArea")
    if(!aksiArea) return

    aksiArea.style.display = "block"
    aksiArea.innerHTML = `
      <div class="box">
        <h3 style="margin-bottom:16px">${item.nama_item || "-"}</h3>

        <div class="aksiItem">
          <div class="aksiHead">
            <label class="aksiCheck">
              <input type="checkbox" id="c_ambil" onchange="TitipanUI.toggleAksi()">
              <span>Ambil</span>
            </label>
          </div>

          <div id="boxAmbil" class="aksiPanel">
            <input id="laku" type="number" placeholder="Barang terjual">
            <input id="bayar" readonly placeholder="Bayar penitip">
          </div>
        </div>

        <div class="aksiItem">
          <div class="aksiHead">
            <label class="aksiCheck">
              <input type="checkbox" id="c_harga" onchange="TitipanUI.toggleAksi()">
              <span>Update Harga</span>
            </label>
          </div>

          <div id="boxHarga" class="aksiPanel">
            <input id="u_jual" type="number" value="${Number(item.harga_jual || 0)}" placeholder="Harga jual">
            <input id="u_pen" type="number" value="${Number(item.harga_penitip || 0)}" placeholder="Harga penitip">
          </div>
        </div>

        <div class="aksiItem">
          <div class="aksiHead">
            <label class="aksiCheck">
              <input type="checkbox" id="c_nitip" onchange="TitipanUI.toggleAksi()">
              <span>Nitip Lagi</span>
            </label>
          </div>

          <div id="boxNitip" class="aksiPanel">
            <input id="n_qty" type="number" placeholder="Qty baru">
          </div>
        </div>

        ${
          TitipanCore.isAdmin()
          ? `
          <div style="margin:12px 0 8px">
            <button class="red" style="width:100%" onclick="TitipanCore.hapusBarang('${item.id}','${TitipanCore.escapeJS(item.nama_item)}','${TitipanCore.escapeJS(item.nama_penitip)}')">
              Hapus Barang
            </button>
          </div>
          `
          : ""
        }

        <div class="rowBtn">
          <button class="green" onclick="TitipanCore.prosesAksi()">✓</button>
          <button class="red" onclick="TitipanUI.renderList()">Batal</button>
        </div>
      </div>
    `

    const laku = document.getElementById("laku")
    const bayar = document.getElementById("bayar")

    if(laku && bayar){
      laku.oninput = function(){
        const val = parseInt(laku.value || 0)
        bayar.value = "Rp " + (val * Number(item.harga_penitip || 0)).toLocaleString('id-ID')
      }
    }

    this.toggleAksi()
  },

  toggleAksi(){
    const ambil = document.getElementById("c_ambil")?.checked
    const harga = document.getElementById("c_harga")?.checked
    const nitip = document.getElementById("c_nitip")?.checked

    const boxAmbil = document.getElementById("boxAmbil")
    const boxHarga = document.getElementById("boxHarga")
    const boxNitip = document.getElementById("boxNitip")

    if(boxAmbil) boxAmbil.style.display = ambil ? "block" : "none"
    if(boxHarga) boxHarga.style.display = harga ? "block" : "none"
    if(boxNitip) boxNitip.style.display = nitip ? "block" : "none"
  },

  showLogView(){
    this.hideMainList()
    const aksiArea = document.getElementById("aksiArea")
    if(aksiArea) aksiArea.style.display = "block"
  }
}
