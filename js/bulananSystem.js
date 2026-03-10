async function simpanBulanan(){

let nama=document.getElementById("namaBulanan").value.trim()
let motor=document.getElementById("motorBulanan").value
let tempo=parseInt(document.getElementById("tempoBulanan").value)

if(!nama || !tempo){
alert("Nama dan jatuh tempo wajib")
return
}

const {error}=await supabase.from("bulanan").insert({
nama:nama,
motor:motor,
jatuh_tempo:tempo,
status:'aktif'
})

if(error){
alert("Gagal simpan")
return
}

alert("Berhasil")

}
