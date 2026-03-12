window.showManual=function(){
showManualState();
document.getElementById("manualInput").value="";
document.getElementById("manualInput").focus();
scanLocked=false;
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
scanLocked=false;
onScan("Parkir-"+val);
}

/* ===== SCAN RESULT ===== */

window.onScan = async function(text){

if(scanLocked) return;
if(!text.startsWith("Parkir-")) return;

scanLocked=true;

if(scanner){
await scanner.stop().catch(()=>{});
scanner.clear();
scanner = null;
}

hideAll();

document.getElementById("resultBox").innerHTML="Memproses...";

let kode=text;

const {data,error}=await supabase
.from('parkir')
.select('*')
.eq('kode',kode)
.eq('status','on')
.maybeSingle();

if(error){
document.getElementById("resultBox").innerHTML="Koneksi bermasalah";
scanLocked=false;
return;
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
`;

showResult();
scanLocked=false;
return;
}

window.scanUlang = async function(){
scanLocked=false;

if(scanner){
await scanner.stop().catch(()=>{});
scanner.clear();
scanner = null;
}

startScan();
}

window.checkin=async function(k){

const { error } = await supabase.from('parkir').insert({
kode:k,
status:'on',
checkin_at:new Date()
});

if(error){
alert("Gagal checkin");
return;
}

hideAll();

document.getElementById("resultBox").innerHTML = `
<div style="
font-size:20px;
font-weight:bold;
color:#2ecc71;
">
Checkin berhasil ✓
</div>
`;

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="scanUlang()">Scan Ulang</button>
<button class="blue" onclick="showManual()">Ketik Manual</button>
<button class="green" onclick="showBulanan()">Bulanan</button>
`;

scanLocked=false;
}

window.checkout=async function(k){
const { error } = await supabase.from('parkir')
.update({status:'off',checkout_at:new Date()})
.eq('kode',k)
.eq('status','on');

if(error){
alert("Gagal checkout");
return;
}

scanLocked=false;
await onScan(k);
}

window.cancelParkir=async function(k){

const {data,error}=await supabase
.from('parkir')
.select('*')
.eq('kode',k)
.eq('status','on')
.maybeSingle();

if(error){
alert("Koneksi bermasalah");
scanLocked=false;
return;
}

if(!data){
scanLocked=false;
await onScan(k);
return;
}

let start=new Date(data.checkin_at);
let wStart=new Date(start.toLocaleString("en-US",{timeZone:"Asia/Jakarta"}));

if(wStart.getHours()<21){

const { error } = await supabase
.from('parkir')
.delete()
.eq('kode',k)
.eq('status','on');

if(error){
alert("Gagal batal parkir");
return;
}

}else{
alert("Tidak bisa dibatalkan setelah 21:00");
}

scanLocked=false;
await onScan(k);
}