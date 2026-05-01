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

rows.forEach(i=>{
html+=`
<div class="item">
<div>${i.nama_item}</div>
<div>${i.qty}</div>
</div>
`
})

listArea.innerHTML=html
}

}