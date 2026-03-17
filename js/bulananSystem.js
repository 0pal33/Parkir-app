/* ===== BULANAN MENU ===== */

window.showBulanan = async function(){

hideAll()

await listBayar()
document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showHome()">Kembali</button>
`


let f=document.querySelector(".floatingTambah")
if(f) f.remove()

/* buat tombol + floating */
let btn=document.createElement("button")
btn.innerText="+"
btn.className="floatingTambah"
btn.onclick=formTambah
document.body.appendChild(btn)

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

document.getElementById("resultBox").innerHTML="Loading..."

const {data,error}=await supabase
.from('bulanan')
.select('*')
.eq('status','aktif')
.order('jatuh_tempo')

if(error){
document.getElementById("resultBox").innerHTML="Gagal mengambil data"
return
}

let html="<h3>Daftar Pelanggan ("+((data||[]).length)+")</h3>"

let today = new Date()
let year = today.getFullYear()
let month = today.getMonth()

if((data || []).length === 0){
document.getElementById("resultBox").innerHTML="<h3>Belum ada pelanggan</h3>";

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showHome()">Kembali</button>
`;

return;
}

(data || []).forEach(p=>{

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

<div style="display:flex;flex-direction:column">  <b>${p.nama}</b>  <span style="font-size:12px;color:#666"> Tarif: Rp ${Number(p.last_paid_amount || 0).toLocaleString('id-ID')} </span>  </div>

<span style="min-width:80px">
${p.motor || "-"}
</span>

<span style="display:flex;flex-direction:column;font-size:13px">
<b>Jatuh Tempo</b>
${tanggalLengkap}
</span>

</div>

<div style="display:flex;gap:6px">

<button class="green"
style="padding:6px 12px;font-size:13px"
onclick="formBayar('${p.id}','${p.nama}')">
Bayar
</button>

<button class="blue"
style="padding:6px 12px;font-size:13px"
onclick="editTempo('${p.id}','${p.nama}','${p.jatuh_tempo}')">
Edit
</button>

</div>

</div>
`
})

document.getElementById("resultBox").innerHTML=html

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showHome()">Kembali</button>
`

}

window.formBayar=function(id,nama){

hideAll()

document.getElementById("resultBox").innerHTML=`

<h3>Bayar Bulanan</h3>

<div style="font-size:20px;font-weight:bold;margin-bottom:20px">
${nama}
</div>

Rp.<br><br>

<input 
id="nominalBayar"
inputmode="numeric"
pattern="[0-9]*"
type="tel"
placeholder="Contoh: 70 = 70rb"
oninput="this.value=this.value.replace(/[^0-9]/g,'')"
>

<br><br>

<button class="green" onclick="konfirmasiBayar('${id}')">✓</button>

`

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="listBayar()">Batal</button>
`

}

window.konfirmasiBayar = async function(id){

let nominalInput = document.getElementById("nominalBayar").value.replace(/\D/g,'') 
let nominal = Number(nominalInput) * 1000

if(!nominalInput){
alert("Masukkan nominal")
return
}

if(!nominal){
alert("Masukkan nominal")
return
}

if(!confirm("Konfirmasi pembayaran Rp "+nominal.toLocaleString('id-ID')+",- ?")){
return
}

/* ambil data pelanggan dulu */

const {data,error:err1} = await supabase
.from('bulanan')
.select('jatuh_tempo, paid_until')
.eq('id',id)
.single()

if(err1){
alert("Gagal mengambil data")
return
}

let tempo = data.jatuh_tempo

let baseDate = data.paid_until ? new Date(data.paid_until) : new Date()

let nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth()+1, tempo)

/* jika bulan itu tidak punya tanggal tersebut */
if(nextMonth.getDate() !== tempo){
nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth()+2, 0)
}

const {error}=await supabase
.from('bulanan')
.update({
paid_until:nextMonth,
last_paid_at:new Date(),
last_paid_amount:nominal
})
.eq('id',id)

if(error){
alert("Gagal bayar")
return
}

alert("Pembayaran berhasil")

listBayar()

}

window.editTempo=function(id,nama,tempo){

hideAll()

document.getElementById("resultBox").innerHTML=`

<h3>Edit Jatuh Tempo</h3>

<div style="font-size:20px;font-weight:bold;margin-bottom:20px">
${nama}
</div>

<select id="tempoEdit" style="width:220px;height:45px;font-size:16px">

<option value="">Tanggal baru</option>

${Array.from({length:31},(_,i)=>`
<option value="${i+1}" ${tempo==i+1?'selected':''}>${i+1}</option>
`).join('')}

</select>

<br><br>

<button class="green" onclick="simpanTempo('${id}')">Simpan</button>

<button class="red" style="margin-top:10px;opacity:0.8"
onclick="hapusPelanggan('${id}',\`${nama}\`)">
Hapus Pelanggan
</button>

`

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="listBayar()">Batal</button>
`

}

window.simpanTempo = async function(id){

let tempo = parseInt(document.getElementById("tempoEdit").value)

if(!tempo){
alert("Pilih tanggal")
return
}

let today = new Date()

let newDate = new Date(today.getFullYear(), today.getMonth(), tempo)

/* jika bulan ini tidak punya tanggal tersebut */
if(newDate.getDate() !== tempo){
newDate = new Date(today.getFullYear(), today.getMonth()+1, 0)
}

const {error}=await supabase
.from('bulanan')
.update({
jatuh_tempo:tempo,
paid_until:newDate
})
.eq('id',id)

if(error){
alert("Gagal update")
return
}

alert("Jatuh tempo diperbarui")

listBayar()

}

window.hapusPelanggan = async function(id,nama){

if(!id) return

let konfirmasi = confirm(
"Yakin hapus pelanggan:\n\n"+nama+" ?"
)

if(!konfirmasi) return

const { error } = await supabase
.from('bulanan')
.delete()
.eq('id',id)

if(error){
alert("Gagal hapus: "+error.message)
return
}

alert("Pelanggan berhasil dihapus")

listBayar()

}