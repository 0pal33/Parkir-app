let breakdownMode = null

function toggleBreakdown(mode){
  breakdownMode = breakdownMode === mode ? null : mode
  renderBreakdown()
}

function renderBreakdown(){

const box = document.getElementById("breakdownBox")

if(!breakdownMode){
  box.style.display = "none"
  return
}

box.style.display = "block"

if(breakdownMode === "income"){
  box.innerHTML = `
    <div class="card">
      <b>Pendapatan</b><br><br>

      Parkir:<br>
      Checkout: ${dashboardData.checkoutCount} (${rupiah(dashboardData.checkoutTotal)})<br>
      Bulanan: ${dashboardData.bulananCount} (${rupiah(dashboardData.bulananTotal)})<br><br>

      Titip Jajan:<br>
      Item: ${dashboardData.titipanItems}<br>
      Total: ${rupiah(dashboardData.titipanIncomeTotal)}<br><br>

      Stok:<br>
      Item: ${dashboardData.stokIncomeItems}<br>
      Total: ${rupiah(dashboardData.stokIncomeTotal)}
    </div>
  `
}

if(breakdownMode === "expense"){
  box.innerHTML = `
    <div class="card">
      <b>Pengeluaran</b><br><br>

      Titip Jajan:<br>
      Item: ${dashboardData.titipanItems}<br>
      Total: ${rupiah(dashboardData.titipanExpenseTotal)}<br><br>

      Stok:<br>
      Item: ${dashboardData.stokExpenseItems}<br>
      Total: ${rupiah(dashboardData.stokExpenseTotal)}
    </div>
  `
}
}