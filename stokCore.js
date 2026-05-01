window.StokCore = {

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
}

}