window.StokUI = {

setFilter(mode){
STOK.FILTER_MODE = mode
this.renderList()
},

renderList(){

formArea.style.display="none"
pesanArea.style.display="none"
auditArea.style.display="none"
listArea.style.display="block"

let cari=searchBox.value.toLowerCase()
let html=""

let rows=STOK.DATA.filter(i=>{

let cocok=(i.nama_item||"").toLowerCase().includes(cari)
if(!cocok) return false

if(STOK.FILTER_MODE==="hitung") return i.barang_dihitung===true
if(STOK.FILTER_MODE==="tidak") return i.barang_dihitung===false

return true
})

if(rows.length===0){
html="<div class='box'>Tidak ada data</div>"
}

/* =========================
RENDER ITEM
========================= */
rows.forEach(i=>{

let merah = i.qty <= 0 ? "redbg" : ""

html+=`
<div class="item ${merah}" data-id="${i.id}" data-nama="${i.nama_item}">

  <!-- GARIS 3 (DRAG) -->
  <div class="menuDots">☰</div>

  <!-- NAMA -->
  <div style="flex:1">
    <div class="nama"
      onclick="StokCore.editNama('${i.id}','${i.nama_item}')">
      ${i.nama_item}
    </div>

    <div class="kecil"
      onclick="StokCore.editJual('${i.id}',${i.harga_jual||0})">
      ${StokCore.rupiah(i.harga_jual||0)}
    </div>
  </div>

  <!-- QTY -->
  <div class="qty"
    onclick="StokCore.editQty('${i.id}',${i.qty},${i.harga_jual||0},${i.barang_dihitung})">
    ${i.qty}
  </div>

  <!-- UNDO -->
  <button class="gray"
    onclick="StokCore.undoItem('${i.id}')">
    ↺
  </button>

  <!-- HAPUS -->
  <div class="menuDots"
    onclick="StokCore.klikDots(event,this.parentElement)">
    ⋮
  </div>

</div>
`
})

listArea.innerHTML=html

/* aktifkan drag */
StokCore.initSortable()

}

}