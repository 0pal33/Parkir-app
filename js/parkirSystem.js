const beep = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
let lastScanTime = 0
window.showManual=function(){
showManualState();
document.getElementById("manualInput").value="";
document.getElementById("manualInput").focus();
window.scanLocked = false;
}

window.cancelManual=function(){
showHome();
}

window.manualAgain=function(){
showManualState();
}

window.manualOK=function(){

let val=document.getElementById("manualInput").value.replace(/\D/g,'');
if(val.length!==3){
alert("3 digit");
return;
}

document.getElementById("manualInput").value="";
window.scanLocked = false;
window.onScan("Parkir-"+val);
}

/* ===== SCAN RESULT ===== */

window.onScan = async function(text){

if(!text || typeof text !== "string") return;
if(!text.startsWith("Parkir-")) return;
if(window.scanLocked) return;

beep.play().catch(()=>{})

let nowScan = Date.now()
if(nowScan - lastScanTime < 1500) return
lastScanTime = nowScan

beep.play().catch(()=>{})

window.scanLocked = true

try{

if(window.scanner){
await window.scanner.stop().catch(()=>{})
window.scanner.clear()
window.scanner=null
}

hideAll()

document.getElementById("resultBox").innerHTML="Memproses..."

let kode=text

const {data,error}=await supabase
.from('parkir')
.select('*')
.eq('kode',kode)
.eq('status','on')
.maybeSingle()

if(error){
document.getElementById("resultBox").innerHTML="Koneksi bermasalah"
return
}

if(!data){

document.getElementById("resultBox").innerHTML=`
<div style="font-size:32px;font-weight:bold;margin-bottom:20px">
${kode}
</div>

<button class="green"
style="font-size:22px;padding:20px;width:260px"
onclick="checkin('${kode}')">
CHECK-IN
</button>
`

showResult()
return

}

/* ===== HITUNG DURASI ===== */

let start = new Date(data.checkin_at)
let now = new Date()

let durasi = hitungDurasiParkir(start, now)
let tarif = hitungTarifParkir(durasi)

document.getElementById("resultBox").innerHTML=`

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

<button class="orange" style="width:100%;font-size:20px;padding:18px"
onclick="checkout('${kode}')">
Checkout
</button>

<button class="red" style="width:100%;font-size:18px;padding:16px"
onclick="cancelParkir('${kode}')">
Batal Parkir
</button>

</div>
`

showResult()

}
finally{
window.scanLocked=false
}

}