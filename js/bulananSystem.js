/* ===== BULANAN MENU ===== */

window.showBulanan = function(){

hideAll();

document.getElementById("resultBox").innerHTML=`
<h3>Layanan Bulanan</h3>

<button class="green" onclick="formTambah()">Tambah</button>

<button class="orange" onclick="listBayar()">Bayar</button>
`;

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showHome()">Kembali</button>
`;

}

/* ===== FORM TAMBAH ===== */

window.formTambah = function(){

hideAll();

document.getElementById("resultBox").innerHTML=`

<h3>Tambah Pelanggan</h3>

<input id="namaBulanan" placeholder="Nama" autocapitalize="words"><br>

<input id="motorBulanan" placeholder="Motornya apa?" autocapitalize="words"><br>

<select id="tempoBulanan" style="width:220px;height:40px;font-size:16px">

<option value="">Tanggal jatuh tempo</option>

<option value="1">1</option>
<option value="2">2</option>
<option value="3">3</option>
<option value="4">4</option>
<option value="5">5</option>
<option value="6">6</option>
<option value="7">7</option>
<option value="8">8</option>
<option value="9">9</option>
<option value="10">10</option>
<option value="11">11</option>
<option value="12">12</option>
<option value="13">13</option>
<option value="14">14</option>
<option value="15">15</option>
<option value="16">16</option>
<option value="17">17</option>
<option value="18">18</option>
<option value="19">19</option>
<option value="20">20</option>
<option value="21">21</option>
<option value="22">22</option>
<option value="23">23</option>
<option value="24">24</option>
<option value="25">25</option>
<option value="26">26</option>
<option value="27">27</option>
<option value="28">28</option>
<option value="29">29</option>
<option value="30">30</option>
<option value="31">31</option>

</select><br><br><br>

<button class="green" onclick="simpanBulanan()">Simpan</button>

`;

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showBulanan()">Kembali</button>
`;

}

/* ===== SIMPAN ===== */

window.simpanBulanan = async function(){

let nama=document.getElementById("namaBulanan").value.trim()
let motor=document.getElementById("motorBulanan").value
let tempo=parseInt(document.getElementById("tempoBulanan").value)

if(!nama || !tempo){
alert("Nama dan jatuh tempo wajib")
return
}

if(tempo < 1 || tempo > 31){
alert("Tanggal harus 1 - 31")
return
}

const { error } = await supabase.from('bulanan').insert({

nama:nama,
motor:motor,
jatuh_tempo:tempo,
status:'aktif'

})

if(error){
alert("Gagal simpan: "+error.message)
return
}

alert("Pelanggan berhasil ditambah")

document.getElementById("namaBulanan").value=""
document.getElementById("motorBulanan").value=""
document.getElementById("tempoBulanan").value=""

showBulanan()

}

/* ===== LIST BAYAR ===== */

window.listBayar = async function(){

hideAll();

document.getElementById("resultBox").innerHTML="Loading..."

const {data}=await supabase
.from('bulanan')
.select('*')
.eq('status','aktif')
.order('jatuh_tempo')

let html="<h3>Daftar Pelanggan ("+(data ? data.length : 0)+")</h3>"

let now = new Date()
let year = now.getFullYear()
let month = now.getMonth()

if(!data || data.length===0){
document.getElementById("resultBox").innerHTML="<h3>Belum ada pelanggan</h3>";

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showBulanan()">Kembali</button>
`;

return;
}

data.forEach(p=>{

let expired=false

if(p.paid_until){
let todayDate=new Date()
let paid=new Date(p.paid_until)
if(todayDate>paid) expired=true
}

let bg = expired ? "#ffd6d6" : "#ffffff"

let tempoDate

if(p.paid_until){
tempoDate = new Date(p.paid_until)
}else{
tempoDate = new Date(year,month,p.jatuh_tempo)
}

let tanggalLengkap = tempoDate.toLocaleDateString('id-ID',{
day:'numeric',
month:'long',
year:'numeric'
})

html+=`
<div style="
display:flex;
align-items:center;
justify-content:space-between;
margin:8px 10px;
padding:10px;
border:1px solid #ccc;
border-radius:10px;
background:${bg};
font-size:14px
">

<div style="
display:flex;
gap:12px;
align-items:center;
font-size:14px
">

<b style="min-width:80px">${p.nama}</b>

<span style="min-width:80px">
${p.motor || "-"}
</span>

<span style="display:flex;flex-direction:column;font-size:13px">
<b>Jatuh Tempo</b>
${tanggalLengkap}
</span>

</div>

<button class="green"
style="padding:6px 14px;font-size:13px"
onclick="bayarBulanan('${p.id}')">
Bayar
</button>

</div>
`
})

document.getElementById("resultBox").innerHTML=html

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showBulanan()">Kembali</button>
`

}

/* ===== BAYAR ===== */

window.bayarBulanan = async function(id){

if(!confirm("Konfirmasi pembayaran pelanggan ini?")){
return
}

const today = new Date()

const nextMonth = new Date(today)
nextMonth.setMonth(today.getMonth()+1)
nextMonth.setDate(Math.min(today.getDate(),28))

const {error}=await supabase
.from('bulanan')
.update({
paid_until:nextMonth,
last_paid_at:new Date()
})
.eq('id',id)

if(error){
alert("Gagal bayar")
return
}

alert("Pembayaran berhasil sampai "+nextMonth.toLocaleDateString())

listBayar()

}