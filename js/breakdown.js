let breakdownMode = null
let breakdownDetailMode = null

function toggleBreakdown(mode){
  breakdownMode =
    breakdownMode === mode
      ? null
      : mode

  breakdownDetailMode = null

  renderBreakdown()

  if(typeof renderBreakdownDetail === "function"){
    renderBreakdownDetail()
  }
}

function renderBreakdown(){

  const box =
    document.getElementById("breakdownBox")

  const d = window.dashboardData

  if(!breakdownMode || !d){
    box.style.display = "none"
    return
  }

  box.style.display = "block"

  /* ======================
     PENDAPATAN
  ====================== */

  if(breakdownMode === "income"){

    box.innerHTML = `
      <div class="card">

        <b>Pendapatan</b>
        <br><br>

        <div>
          <b>Parkir</b><br>
          Checkout:
          ${d.checkoutCount}
          (${rupiah(d.checkoutTotal)})
        </div>

        <button
          class="blue btn"
          style="margin-top:8px;width:100%"
          onclick="toggleBreakdownDetail('parkir')">
          Parkir
        </button>

        <br>

        <div>
          <b>Bulanan</b><br>
          Item:
          ${d.bulananCount}<br>
          Total:
          ${rupiah(d.bulananTotal)}
        </div>

        <button
          class="blue btn"
          style="margin-top:8px;width:100%"
          onclick="toggleBreakdownDetail('bulanan')">
          Bulanan
        </button>

        <br>

        <div>
          <b>Titip Jajan</b><br>
          Item:
          ${d.titipanItems}<br>
          Total:
          ${rupiah(d.titipanIncomeTotal)}
        </div>

        <button
          class="blue btn"
          style="margin-top:8px;width:100%"
          onclick="toggleBreakdownDetail('titipan')">
          Titip Jajan
        </button>

        <br>

        <div>
          <b>Stok</b><br>
          Item:
          ${d.stokIncomeItems}<br>
          Total:
          ${rupiah(d.stokIncomeTotal)}
        </div>

        <button
          class="blue btn"
          style="margin-top:8px;width:100%"
          onclick="toggleBreakdownDetail('stok')">
          Stok
        </button>

        <div
          id="breakdownDetailBox"
          style="margin-top:12px">
        </div>

      </div>
    `
  }

  /* ======================
     PENGELUARAN
  ====================== */

  if(breakdownMode === "expense"){

    box.innerHTML = `
      <div class="card">

        <b>Pengeluaran</b>
        <br><br>

        <div>
          <b>Titip Jajan</b><br>
          Item:
          ${d.titipanItems}<br>
          Total:
          ${rupiah(d.titipanExpenseTotal)}
        </div>

        <button
          class="blue btn"
          style="margin-top:8px;width:100%"
          onclick="toggleBreakdownDetail('titipan')">
          Titip Jajan
        </button>

        <br>

        <div>
          <b>Stok</b><br>
          Item:
          ${d.stokExpenseItems}<br>
          Total:
          ${rupiah(d.stokExpenseTotal)}
        </div>

        <button
          class="blue btn"
          style="margin-top:8px;width:100%"
          onclick="toggleBreakdownDetail('stok')">
          Stok
        </button>

        <div
          id="breakdownDetailBox"
          style="margin-top:12px">
        </div>

      </div>
    `
  }

  if(typeof renderBreakdownDetail === "function"){
    renderBreakdownDetail()
  }
}