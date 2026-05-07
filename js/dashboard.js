window.dashboardData = {}
window.selectedDates = []
window.isCustom = false

function rupiah(n){
n = Number(n) || 0
return "Rp " + n.toLocaleString('id-ID')
}

function nowWIB(){
return new Date(
new Date().toLocaleString("en-US",{timeZone:"Asia/Jakarta"})
)
}

async function loadDashboard(){

let today = nowWIB()

let start, end

if(!window.isCustom || window.selectedDates.length === 0){
  start = new Date(today)
  start.setHours(0,0,0,0)

  end = new Date(today)
  end.setHours(23,59,59,999)
}else{
  start = new Date(window.selectedDates[0])
  start.setHours(0,0,0,0)

  end = new Date(window.selectedDates[1] || window.selectedDates[0])
  end.setHours(23,59,59,999)
}

let startISO = start.toISOString()
let endISO = end.toISOString()

let {data:parkir} = await window.supabaseClient
.from("parkir")
.select("checkout_at, checkin_at")
.eq("status","off")
.gte("checkout_at", startISO)
.lte("checkout_at", endISO)

let {data:bulanan} = await window.supabaseClient
.from("bulanan")
.select("last_paid_at, last_paid_amount")
.gte("last_paid_at", startISO)
.lte("last_paid_at", endISO)

let {data:stok} = await window.supabaseClient
.from("stok_log")
.select("*")
.gte("created_at", startISO)
.lte("created_at", endISO)

let {data:titipan} = await window.supabaseClient
.from("titipan_log")
.select("*")
.gte("created_at", startISO)
.lte("created_at", endISO)

// ===== HITUNG =====

let income = 0
let expense = 0

let checkoutTotal = 0
let checkoutCount = 0

let bulananTotal = 0
let bulananCount = 0

let stokIncomeTotal = 0
let stokExpenseTotal = 0

let titipanIncomeTotal = 0
let titipanExpenseTotal = 0

let stokIncomeItems = new Set()
let stokExpenseItems = new Set()
let titipanItems = new Set()

// PARKIR
(parkir ?? []).forEach(p=>{
let tarif = hitungTarifParkir(
  hitungDurasiParkir(
    new Date(p.checkin_at),
    new Date(p.checkout_at)
  )
)

income += tarif
checkoutTotal += tarif
checkoutCount++
})

// BULANAN
(bulanan ?? []).forEach(b=>{
let val = Number(b.last_paid_amount || 0)
income += val
bulananTotal += val
bulananCount++
})

// STOK
(stok ?? []).forEach(s=>{
let val = Number(s.total||0)

if(s.jenis==="jual"){
  income += val
  stokIncomeTotal += val
  if(s.nama_item){
  stokIncomeItems.add(s.nama_item)
}
}

if(s.jenis==="pesan"){
  expense += val
  stokExpenseTotal += val
  if(s.nama_item){
  stokExpenseItems.add(s.nama_item)
}
}
})

// TITIPAN
(titipan ?? []).forEach(t=>{
let val = Number(t.total||0)

if(t.jenis==="ambil"){
  income += val
  expense += val

  titipanIncomeTotal += val
  titipanExpenseTotal += val
  if(t.nama_item){
  titipanItems.add(t.nama_item)
}
}
})

// SIMPAN
window.dashboardData = {
  checkoutTotal,
  checkoutCount,
  bulananTotal,
  bulananCount,
  stokIncomeTotal,
  stokExpenseTotal,
  stokIncomeItems: stokIncomeItems.size,
  stokExpenseItems: stokExpenseItems.size,
  titipanIncomeTotal,
  titipanExpenseTotal,
  titipanItems: titipanItems.size
}

console.log("Dashboard Data:", window.dashboardData)

// RENDER
document.getElementById("incomeTotal").innerText = rupiah(income)
document.getElementById("expenseTotal").innerText = rupiah(expense)
document.getElementById("grandTotal").innerText = rupiah(income - expense)

if(typeof renderBreakdown === "function"){
  renderBreakdown()
}
}

function refreshDashboard(){
  loadDashboard()
}

window.addEventListener("load", () => {
  loadDashboard()
})