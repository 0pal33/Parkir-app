let breakdownMode = null
let breakdownDetailMode = null

function toggleBreakdown(mode){
  breakdownMode = breakdownMode === mode ? null : mode
  breakdownDetailMode = null
  renderBreakdown()
  if(typeof renderBreakdownDetail === "function"){
    renderBreakdownDetail()
  }
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
         <button class="blue btn" style="margin-top:8px;width:100%" onclick="toggleBreakdownDetail('parkir')">
  Parkir
</button>

        Bulanan: ${d.bulananCount} (${rupiah(d.bulananTotal)})<br><br>
        <button class="blue btn" style="margin-top:8px;width:100%" onclick="toggleBreakdownDetail('bulanan')">
  Bulanan
</button>
       

        Titip Jajan:<br>
        Item: ${d.titipanItems}<br>
        Total: ${rupiah(d.titipanIncomeTotal)}<br><br>
        <button class="blue btn" style="margin-top:8px;width:100%" onclick="toggleBreakdownDetail('titipan')">
  Titip Jajan
</button>

        Stok:<br>
        Item: ${d.stokIncomeItems}<br>
        Total: ${rupiah(d.stokIncomeTotal)}
        <button class="blue btn" style="margin-top:8px;width:100%" onclick="toggleBreakdownDetail('stok')">
  Stok
</button>
<div id="breakdownDetailBox" style="margin-top:12px"></div>
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