// ========================================
// WAHAYE PARKIR ENGINE
// Semua aturan parkir ada di sini
// ========================================


// ===== KONFIGURASI =====

const PARKIR_CONFIG = {

TARIF_PER_HARI: 3000,

JAM_MALAM: 21,
JAM_PAGI: 12,

WARNING_HARI: 7,

TIMEZONE: "Asia/Jakarta"

}



// ===== HELPER TIMEZONE =====

function toWIB(date){

return new Date(
date.toLocaleString("en-US",{timeZone:PARKIR_CONFIG.TIMEZONE})
)

}



// ===== HITUNG DURASI PARKIR =====

function hitungDurasiParkir(startDate, nowDate){

let wStart = toWIB(new Date(startDate))
let wNow = toWIB(new Date(nowDate))

let startHour = wStart.getHours()

// ===== MASUK MALAM =====

if(startHour >= PARKIR_CONFIG.JAM_MALAM){

let anchor = new Date(wStart)

anchor.setDate(anchor.getDate()+1)

anchor.setHours(
PARKIR_CONFIG.JAM_PAGI,
0,
0,
0
)

// sebelum jam pagi
if(wNow < anchor){
return 1
}

let today = new Date(
wNow.getFullYear(),
wNow.getMonth(),
wNow.getDate()
)

let base = new Date(
anchor.getFullYear(),
anchor.getMonth(),
anchor.getDate()
)

let diff = Math.floor((today-base)/86400000)

return diff + 2

}



// ===== MASUK NORMAL =====

else{

let today = new Date(
wNow.getFullYear(),
wNow.getMonth(),
wNow.getDate()
)

let base = new Date(
wStart.getFullYear(),
wStart.getMonth(),
wStart.getDate()
)

let diff = Math.floor((today-base)/86400000)

return diff + 1

}

}



// ===== HITUNG TARIF =====

function hitungTarifParkir(durasi){

return durasi * PARKIR_CONFIG.TARIF_PER_HARI

}



// ===== WARNING PARKIR LAMA =====

function parkirTerlaluLama(durasi){

return durasi > PARKIR_CONFIG.WARNING_HARI

}



// ===== FORMAT RUPIAH =====

function formatRupiah(angka){

return angka.toLocaleString("id-ID")

}
