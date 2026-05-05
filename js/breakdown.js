let breakdownMode = null

function toggleBreakdown(mode){
  breakdownMode = breakdownMode === mode ? null : mode
  renderBreakdown()
}

function renderBreakdown(){

  const box = document.getElementById("breakdownBox")
  const d = window.dashboardData

  if(!breakdownMode || !d){
    box.style.display = "none"
    return
  }

  box.style.display = "block"

  if(breakdownMode === "income"){
    box.innerHTML = `
      <div class="card">
        <b>Pendapatan</b><br><br>

        Parkir:<br>
        Checkout: ${d.checkoutCount} (${rupiah(d.checkoutTotal)})<br>
        Bulanan: ${d.bulananCount} (${rupiah(d.bulananTotal)})<br><br>

        Titip Jajan:<br>
        Item: ${d.titipanItems}<br>
        Total: ${rupiah(d.titipanIncomeTotal)}<br><br>

        Stok:<br>
        Item: ${d.stokIncomeItems}<br>
        Total: ${rupiah(d.stokIncomeTotal)}
      </div>
    `
  }

  if(breakdownMode === "expense"){
    box.innerHTML = `
      <div class="card">
        <b>Pengeluaran</b><br><br>

        Titip Jajan:<br>
        Item: ${d.titipanItems}<br>
        Total: ${rupiah(d.titipanExpenseTotal)}<br><br>

        Stok:<br>
        Item: ${d.stokExpenseItems}<br>
        Total: ${rupiah(d.stokExpenseTotal)}
      </div>
    `
  }
}