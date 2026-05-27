const beep = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
beep.preload = "auto"

let lastScanTime = 0

window.showManual=function(){

showManualState()

let inp=document.getElementById("manualInput")

if(inp){
inp.value=""
inp.focus()
}

window.scanLocked=false

}

window.cancelManual=function(){
showHome()
}

window.manualAgain=function(){
showManual()
}

window.manualOK=function(){

let inp=document.getElementById("manualInput")
if(!inp) return

let val=inp.value.replace(/\D/g,'')

if(val.length!==3){
alert("3 digit")
return
}

inp.value=""

window.scanLocked=false

window.onScan("Parkir-"+val)

}

/* ======================
SCAN RESULT
====================== */

window.onScan = async function(text){

if(!text || typeof text !== "string") return
if(!text.startsWith("Parkir-")) return
if(window.scanLocked) return

let nowScan = Date.now()

if(nowScan-lastScanTime < 1500) return

lastScanTime = nowScan

beep.play().catch(()=>{})

window.scanLocked=true

try{

if(window.scanner){
try{
await window.scanner.stop()
}catch(e){}

window.scanner.clear()
window.scanner=null
}

hideAll()

let result=document.getElementById("resultBox")
if(result) result.innerHTML="Memproses..."

let kode=text

const {data,error}=await window.supabaseClient
.from("parkir")
.select("*")
.eq("kode",kode)
.eq("status","on")
.order("created_at",{ascending:false})
.limit(1)
.maybeSingle()

if(error){

if(result) result.innerHTML="Koneksi bermasalah"
return

}

/* ======================
BELUM PARKIR
====================== */

if(!data){

if(result){
result.innerHTML=`
<div style="font-size:32px;font-weight:bold;margin-bottom:20px">
${kode}
</div>

<button class="green"
style="font-size:22px;padding:20px;width:260px"
onclick="checkin('${kode}')">
CHECK-IN
</button>
`
}

showResult()
return

}

/* ======================
SUDAH PARKIR
====================== */

let start = new Date(data.checkin_at)
let now = new Date()

let durasi = hitungDurasiParkir(start, now)
let tarif = hitungTarifParkir(durasi)

if(result){
result.innerHTML=`

<div style="font-size:32px;font-weight:bold;margin-bottom:10px">
${kode}
</div>

<div style="font-size:18px;margin-bottom:5px">
Mulai: ${start.toLocaleString('id-ID')}
</div>

<div style="font-size:22px;font-weight:bold">
Durasi: ${durasi} Hari
</div>

<div style="font-size:26px;font-weight:bold;color:#e67e22;margin:10px 0">
Rp ${formatRupiah(tarif)}
</div>

<div style="width:90%;max-width:420px">

<button class="orange"
style="width:100%;font-size:20px;padding:18px"
onclick="checkout('${kode}')">
Checkout
</button>

<button class="red"
style="width:100%;font-size:18px;padding:16px"
onclick="cancelParkir('${kode}')">
Batal Parkir
</button>

</div>
`
}

showResult()

}
finally{
window.scanLocked=false
}

}

/* ======================
SCAN ULANG
====================== */

window.scanUlang = async function(){

window.scanLocked=false

if(window.scanner){

try{
await window.scanner.stop()
}catch(e){}

window.scanner.clear()
window.scanner=null

}

startScan()

}

/* ======================
CHECKIN
====================== */

window.checkin = async function(k){

const {error}=await window.supabaseClient
.from("parkir")
.insert({
kode:k,
status:"on",
checkin_at:new Date()
})

if(error){
alert("Gagal checkin")
return
}

hideAll()

let result=document.getElementById("resultBox")

if(result){
result.innerHTML=`
<div style="font-size:20px;font-weight:bold;color:#2ecc71">
Checkin berhasil ✓
</div>
`
}

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="scanUlang()">Scan Ulang</button>
<button class="blue" onclick="showManual()">Ketik Manual</button>
<button class="green" onclick="showMenuLain()">Menu Lainnya</button>
`

}

/* ======================
CHECKOUT
====================== */

window.checkout = async function(k){

try{

/* AMBIL DATA PARKIR AKTIF */
const {data,error} = await window.supabaseClient
.from("parkir")
.select("*")
.eq("kode",k)
.eq("status","on")
.order("created_at",{ascending:false})
.limit(1)
.maybeSingle()

if(error){
alert("Koneksi bermasalah")
return
}

if(!data){
alert("Data parkir tidak ditemukan")
window.scanLocked=false
await window.onScan(k)
return
}

/* HITUNG TARIF */
let start = new Date(data.checkin_at)
let now = new Date()

let durasi = hitungDurasiParkir(start, now)
let tarif = hitungTarifParkir(durasi)

/* JALANKAN RPC */
const {error:checkoutError} =
await window.supabaseClient.rpc(
"checkout_parkir",
{
p_parkir_id: data.id,
p_checkout_at: now.toISOString(),
p_total_bayar: tarif
}
)

if(checkoutError){
console.error(checkoutError)
alert("Gagal checkout: " + checkoutError.message)
return
}

/* SUCCESS */
hideAll()

let result=document.getElementById("resultBox")

if(result){
result.innerHTML=`
<div style="font-size:20px;font-weight:bold;color:#2ecc71">
Checkout berhasil ✓
</div>

<div style="font-size:18px;margin-top:10px">
${k}
</div>

<div style="font-size:24px;font-weight:bold;color:#e67e22;margin-top:12px">
Rp ${formatRupiah(tarif)}
</div>
`
}

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="scanUlang()">Scan Ulang</button>
<button class="blue" onclick="showManual()">Ketik Manual</button>
<button class="green" onclick="showMenuLain()">Menu Lainnya</button>
`

}catch(err){

console.error(err)
alert("Checkout gagal: " + err.message)

}

window.scanLocked=false

}

/* ======================
BATAL PARKIR
====================== */

window.cancelParkir = async function(k){

const {data,error}=await window.supabaseClient
.from("parkir")
.select("*")
.eq("kode",k)
.eq("status","on")
.order("created_at",{ascending:false})
.limit(1)
.maybeSingle()

if(error){
alert("Koneksi bermasalah")
return
}

if(!data){
await window.onScan(k)
return
}

if(!confirm("Batalkan parkir ini?")) return

const {error:errDelete}=await window.supabaseClient
.from("parkir")
.delete()
.eq("kode",k)
.eq("status","on")

if(errDelete){
alert("Gagal batal parkir")
return
}

window.scanLocked=false

await window.onScan(k)

}