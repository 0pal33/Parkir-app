window.StokCore = {

saveOrder(){
localStorage.setItem("STOK.LAST_ORDER",JSON.stringify(STOK.LAST_ORDER))
},

loadOrder(){
let x=localStorage.getItem("STOK.LAST_ORDER")

if(x){
try{
STOK.LAST_ORDER=JSON.parse(x)||[]
}catch(e){
STOK.LAST_ORDER=[]
}
}
},

clearOrder(){
STOK.LAST_ORDER=[]
localStorage.removeItem("STOK.LAST_ORDER")
},

rupiah(n){
return "Rp " + Number(n||0).toLocaleString("id-ID")
},

nowWIB(){
return new Date(
new Date().toLocaleString("en-US",{timeZone:"Asia/Jakarta"})
)
},

sameDay(a,b){
return a.getFullYear()===b.getFullYear() &&
a.getMonth()===b.getMonth() &&
a.getDate()===b.getDate()
},

async loadData(){

const {data,error}=await window.supabaseClient
.from("stok_barang")
.select("*")
.order("urutan",{ascending:true})
.order("nama_item",{ascending:true})

if(error){
alert(error.message)
return
}

STOK.DATA = data || []

StokUI.renderList()
this.loadDashboard()
},

async loadDashboard(){

const {data}=await window.supabaseClient
.from("stok_log")
.select("*")
.order("created_at",{ascending:false})
.limit(500)

let masuk=0
let keluar=0
let now=this.nowWIB()

;(data||[]).forEach(i=>{
let t=new Date(i.created_at)

if(!this.sameDay(now,new Date(t.toLocaleString("en-US",{timeZone:"Asia/Jakarta"})))) return

if(i.jenis==="jual") masuk+=Number(i.total||0)
if(i.jenis==="pesan") keluar+=Number(i.total||0)
})

pendapatan.innerText=this.rupiah(masuk)
pengeluaran.innerText=this.rupiah(keluar)
},

setFilter(mode){
STOK.FILTER_MODE=mode
renderList()
},

initSortable(){

let el = document.getElementById("listArea")

if(STOK.sortableInstance){
STOK.sortableInstance.destroy()
}

STOK.sortableInstance = Sortable.create(el,{
animation:150,
handle:".menuDots",
delay:100,
delayOnTouchOnly:true,
ghostClass:"dragging",
fallbackOnBody: true,
swapThreshold: 0.65,
forceFallback: true,
touchStartThreshold: 5,

onStart: function(){
  STOK.isDragging = true
},

onEnd: function () {

  setTimeout(()=> STOK.isDragging = false, 100)

  clearTimeout(dragSaveTimeout)

  dragSaveTimeout = setTimeout(async ()=>{

    let items = [...document.querySelectorAll(".item")]
    let newOrder = items.map(el => el.dataset.id)

    STOK.DATA.sort((a,b)=>{
      return newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
    })

    let updates = STOK.DATA.map((item, index) => ({
      id: item.id,
      urutan: index + 1
    }))

    await window.supabaseClient
    .from("stok_barang")
    .upsert(updates, { onConflict: 'id' })

    await loadData()

  },300) // delay 300ms
}
})
},

async editNama(id,nama){

let baru=prompt("Nama item:",nama)
if(!baru) return

await window.supabaseClient
.from("stok_barang")
.update({
nama_item:baru,
updated_at:new Date().toISOString()
})
.eq("id",id)

this.loadData()
},

async editJual(id,harga){

let baru=prompt("Harga jual:",harga)
if(baru===null){
  window.loadingAction = false
  return
}

baru=parseInt(baru||0)

await window.supabaseClient
.from("stok_barang")
.update({
harga_jual:baru,
updated_at:new Date().toISOString()
})
.eq("id",id)

this.loadData()
},

async editQty(id,qtyLama,hargaJual,dihitung){
  
if(window.loadingAction) return
window.loadingAction = true

let teks = dihitung ? "Stok baru:" : "Jumlah terjual:"
let baru=prompt(teks,qtyLama)

if(baru===null){
  window.loadingAction = false
  return
}

baru=parseInt(baru)
if(isNaN(baru) || baru < 0){
  alert("Input tidak valid")
  window.loadingAction = false
  return
}

let item = STOK.DATA.find(x=>x.id==id)

let qtyBaru=baru
let qtyJual=0

/* =====================
BARANG STOK
===================== */
if(dihitung){

if(qtyBaru > qtyLama){
  alert("Barang stok tidak boleh melebihi stok saat ini")
  window.loadingAction = false
  return
}

qtyJual = qtyLama - qtyBaru
if(qtyJual < 0) qtyJual=0

}

/* =====================
BARANG NONSTOK
===================== */
else{

qtyJual = qtyBaru
qtyBaru = qtyBaru

}

let totalMasuk = qtyJual * hargaJual

STOK.LAST_UNDO={
id:id,
qty:qtyLama,
harga_jual:hargaJual,
harga_beli:item ? item.harga_beli : 0,
log_qty:qtyJual,
log_total:totalMasuk
}

await window.supabaseClient
.from("stok_barang")
.update({
qty:qtyBaru,
updated_at:new Date().toISOString()
})
.eq("id",id)

if(qtyJual>0){

await window.supabaseClient
.from("stok_log")
.insert({
item_id:id,
jenis:"jual",
qty:qtyJual,
total:totalMasuk
})

}

this.loadData()
window.loadingAction = false
},

async undoItem(id){

if(!STOK.LAST_UNDO || STOK.LAST_UNDO.id!==id){
return // diam saja
}

await window.supabaseClient
.from("stok_barang")
.update({
qty:STOK.LAST_UNDO.qty,
harga_jual:STOK.LAST_UNDO.harga_jual,
harga_beli:STOK.LAST_UNDO.harga_beli,
updated_at:new Date().toISOString()
})
.eq("id",id)

/* hapus log jual terakhir */

if(STOK.LAST_UNDO.log_qty>0){

const {data}=await window.supabaseClient
.from("stok_log")
.select("id")
.eq("item_id",id)
.eq("jenis","jual")
.eq("qty",STOK.LAST_UNDO.log_qty)
.eq("total",STOK.LAST_UNDO.log_total)
.order("created_at",{ascending:false})
.limit(1)

if(data && data.length){

await window.supabaseClient
.from("stok_log")
.delete()
.eq("id",data[0].id)

}

}

STOK.LAST_UNDO=null
this.loadData()
},

klikDots(e,el){

  if(STOK.isDragging) return

  clearTimeout(clickTimeout)

  clickTimeout = setTimeout(()=>{
    hapusItem(
      el.dataset.id,
      el.dataset.nama
    )
  },150) // delay kecil
},

async hapusItem(id,nama){

if(isDeleting) return
isDeleting = true

let ok=confirm("Hapus item:\n"+nama+" ?")
if(!ok){
  isDeleting = false
  return
}

await window.supabaseClient
.from("stok_barang")
.delete()
.eq("id",id)

isDeleting = false
this.loadData()
},

formTambah(){

judul.style.display="none"
searchBox.style.display="none"
listArea.style.display="none"
pesanArea.style.display="none"
auditArea.style.display="none"
formArea.style.display="block"

formArea.innerHTML=`

<div class="box">

<h3>Tambah Barang</h3>

<input id="f_nama" placeholder="Nama barang">
<input id="f_beli" type="number" placeholder="Harga beli">
<input id="f_awal" type="number" placeholder="Masukkan stok barang saat ini">

<div class="checkLine">
<input type="checkbox" id="f_dihitung" checked onchange="toggleHitung()">
<span>Barang dihitung</span>
</div>

<div id="boxHitung">
<input id="f_jual" type="number" placeholder="Harga jual">
<input id="f_qtypesan" type="number" placeholder="Jumlah tiap restok">
</div>

<div class="rowBtn">
<button class="green" onclick="simpanBarang()">Simpan</button>
<button class="red" onclick="renderList()">Batal</button>
</div>

</div>
`

toggleHitung()
},

toggleHitung(){
boxHitung.style.display=f_dihitung.checked?"block":"none"
},

async simpanBarang(){
  
if(window.loadingSimpan) return
window.loadingSimpan = true

let nama=f_nama.value.trim()
let beli=parseInt(f_beli.value||0)
let awal=parseInt(f_awal.value||0)
let dihitung=f_dihitung.checked

let jual=0
let qtypesan=1

if(dihitung){
jual=parseInt(f_jual.value||0)
qtypesan=parseInt(f_qtypesan.value||1)
}

if(!nama){
  alert("Nama wajib")
  window.loadingSimpan = false
  return
}

if(awal < 0 || beli < 0){
  alert("Harga / stok tidak boleh minus")
  window.loadingSimpan = false
  return
}

if(dihitung && jual < 0){
  alert("Harga jual tidak valid")
  window.loadingSimpan = false
  return
}

const {error}=await window.supabaseClient
.from("stok_barang")
.insert({
nama_item:nama,
urutan: STOK.DATA.length+1,
qty:awal,
harga_beli:beli,
harga_jual:jual,
qty_pesan:qtypesan,
barang_dihitung:dihitung,
updated_at:new Date().toISOString()
})

if(error){
  alert(error.message)
  window.loadingSimpan = false
  return
}

window.loadingSimpan = false
this.loadData()
},

openPesan(){

judul.style.display="none"
searchBox.style.display="none"
listArea.style.display="none"
formArea.style.display="none"
auditArea.style.display="none"
pesanArea.style.display="block"

let html=`<div class="box">
<h3>Pesan Barang</h3>

<div class="tableWrap">
<table class="tbl">
<tr>
<th>✔</th>
<th>Nama Barang</th>
<th>Harga Beli</th>
<th>Tambah</th>
<th>Stok</th>
</tr>
`

STOK.DATA.forEach((i,idx)=>{

if(i.barang_dihitung!==true) return

html+=`
<tr>
<td>
<input type="checkbox" data-index="${idx}">
</td>

<td style="text-align:left">
${i.nama_item}
</td>

<td>
<input inputmode="numeric" id="beli_${idx}" value="${i.harga_beli||0}">
</td>

<td>
<input inputmode="numeric" id="qty_${idx}" value="${i.qty_pesan||1}">
</td>

<td>${i.qty}</td>
</tr>
`
})

html+=`
</table>
</div>

<div class="rowBtn">
<button class="blue" onclick="tambahManual()">Tambah</button>
<button class="green" onclick="kirimPesan()">Kirim WA</button>
<button class="red" onclick="renderList()">Batal</button>
</div>

</div>
`

pesanArea.innerHTML=html
},

async kirimPesan(){

if(window.loadingPesan) return
window.loadingPesan = true

try{

let ada=false
let checks=pesanArea.querySelectorAll("input[type=checkbox]")
let text="Pesan barang:%0A"
STOK.LAST_ORDER=[]

for(let el of checks){

  if(!el.checked) continue
  ada=true

  let idx=el.dataset.index
  let i=STOK.DATA[idx]

  let beli=parseInt(document.getElementById("beli_"+idx).value||0)
  let tambah=parseInt(document.getElementById("qty_"+idx).value||1)

  let dasar=parseInt(i.qty_pesan||1)
  if(dasar<=0) dasar=1

  let biaya = (beli / dasar) * tambah
  biaya = Math.round(biaya)

  text += "- "+i.nama_item+"%0A"

  await window.supabaseClient
  .from("stok_barang")
  .update({
    qty:i.qty+tambah,
    harga_beli:beli,
    updated_at:new Date().toISOString()
  })
  .eq("id",i.id)

  await window.supabaseClient
  .from("stok_log")
  .insert({
    item_id:i.id,
    jenis:"pesan",
    qty:tambah,
    total:biaya
  })

  STOK.LAST_ORDER.push({
    id:i.id,
    nama:i.nama_item,
    qty:tambah,
    beli:beli,
    dasar:dasar
  })

}

if(!ada){
  alert("Pilih barang dulu")
  return
}

this.saveOrder()
window.open("https://wa.me/6282132517947?text="+text)
this.loadData()

} finally {
  window.loadingPesan = false
}
},

async tambahManual(){

if(window.loadingTambah) return
window.loadingTambah=true

try{

let checks=pesanArea.querySelectorAll("input[type=checkbox]")
let ada=false

for(let el of checks){

if(!el.checked) continue
ada=true

let idx=el.dataset.index
let i=STOK.DATA[idx]

let beli=parseInt(document.getElementById("beli_"+idx).value||0)
let tambah=parseInt(document.getElementById("qty_"+idx).value||1)

let dasar=parseInt(i.qty_pesan||1)
if(dasar<=0) dasar=1

let biaya=(beli/dasar)*tambah
biaya=Math.round(biaya)

await window.supabaseClient
.from("stok_barang")
.update({
qty:i.qty+tambah,
harga_beli:beli,
updated_at:new Date().toISOString()
})
.eq("id",i.id)

await window.supabaseClient
.from("stok_log")
.insert({
item_id:i.id,
jenis:"pesan",
qty:tambah,
total:biaya
})

}

if(!ada){
alert("Pilih barang dulu")
return
}

this.loadData()
StokUI.renderList()
alert("Stok berhasil ditambah")

} finally {
window.loadingTambah=false
}
},

showAuditRestok(){

judul.style.display="none"
searchBox.style.display="none"
listArea.style.display="none"
formArea.style.display="none"
pesanArea.style.display="none"
auditArea.style.display="block"

let html=`<div class="box"><h3>Audit Restok</h3>`

if(STOK.LAST_ORDER.length===0){
html+=`Tidak ada pesanan terakhir`
}else{

STOK.LAST_ORDER.forEach((i,idx)=>{

html+=`
<div class="item">

<div style="flex:1">
<div class="nama">${i.nama}</div>
</div>

<input class="smallInput" id="restok_${idx}" value="${i.qty}">
<button class="red" onclick="stokKosong(${idx})">✖</button>

</div>
`
})

html+=`
<button class="green" onclick="simpanAuditRestok()">Simpan Audit</button>
`
}

html+=`
<button class="gray" onclick="renderList()">Kembali</button>
</div>
`

auditArea.innerHTML=html
},

stokKosong(idx){

let ok=confirm("Yakin stok datang = 0 ?")

if(!ok) return

document.getElementById("restok_"+idx).value=0
},

async simpanAuditRestok(){

for(let x=0;x<STOK.LAST_ORDER.length;x++){

let row = STOK.LAST_ORDER[x]
let real = parseInt(document.getElementById("restok_"+x).value||0)
let pesan = row.qty

if(real < 0) real = 0

let selisih = pesan - real

if(selisih !== 0){

let item = STOK.DATA.find(a=>a.id==row.id)

if(item){

/* ===================
PERBAIKI STOK
=================== */

await window.supabaseClient
.from("stok_barang")
.update({
qty:item.qty-selisih,
updated_at:new Date().toISOString()
})
.eq("id",row.id)

/* ===================
PERBAIKI LOG PESAN
=================== */

let dasar = parseInt(row.dasar||1)
if(dasar <= 0) dasar = 1

let beli = Number(row.beli||0)

/* biaya real datang */
let totalBaru = Math.round((beli / dasar) * real)

/* cari log pesan terakhir */
const {data} = await window.supabaseClient
.from("stok_log")
.select("id")
.eq("item_id",row.id)
.eq("jenis","pesan")
.order("created_at",{ascending:false})
.limit(1)

if(data && data.length){

await window.supabaseClient
.from("stok_log")
.update({
qty:real,
total:totalBaru
})
.eq("id",data[0].id)

}

}

}

}

this.clearOrder()
this.loadData()
StokUI.renderList()
},

async batalPesanan(){

if(STOK.LAST_ORDER.length===0){
alert("Tidak ada pesanan terakhir")
return
}

let ok=confirm("Batalkan pesanan terakhir?")
if(!ok) return

for(let row of STOK.LAST_ORDER){

let item=STOK.DATA.find(x=>x.id==row.id)

if(item){

await window.supabaseClient
.from("stok_barang")
.update({
qty:item.qty-row.qty,
updated_at:new Date().toISOString()
})
.eq("id",row.id)

const {data}=await window.supabaseClient
.from("stok_log")
.select("id")
.eq("item_id",row.id)
.eq("jenis","pesan")
.order("created_at",{ascending:false})
.limit(1)

if(data && data.length){

await window.supabaseClient
.from("stok_log")
.delete()
.eq("id",data[0].id)

}

}

}

this.clearOrder()
this.loadData()
StokUI.renderList()

alert("Pesanan terakhir dibatalkan")
}


}