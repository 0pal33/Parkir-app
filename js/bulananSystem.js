window.showBulanan = function(){

hideAll()

document.getElementById("resultBox").innerHTML=`
<h3>Layanan Bulanan</h3>

<button class="green" onclick="formTambah()">Tambah</button>
<button class="orange" onclick="listBayar()">Bayar</button>
`

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showHome()">Kembali</button>
`

}

window.formTambah = function(){

hideAll()

document.getElementById("resultBox").innerHTML=`
<h3>Tambah Pelanggan</h3>

<input id="namaBulanan" placeholder="Nama"><br>

<input id="motorBulanan" placeholder="Motor"><br>

<input id="tempoBulanan" placeholder="Tanggal jatuh tempo"><br><br>

<button class="green" onclick="simpanBulanan()">Simpan</button>
`

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showBulanan()">Kembali</button>
`

}