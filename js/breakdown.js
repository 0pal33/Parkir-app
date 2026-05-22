let breakdownMode = null

function toggleBreakdown(mode){

  breakdownMode =
  breakdownMode === mode
  ? null
  : mode

  renderBreakdown()
}

function renderBreakdown(){

  const box =
  document.getElementById(
    "breakdownBox"
  )

  const d =
  window.dashboardData

  if(!breakdownMode || !d){
    box.style.display = "none"
    return
  }

  box.style.display = "block"

  /* =====================
     PENDAPATAN
  ===================== */

  if(breakdownMode === "income"){

    box.innerHTML = `

    <div class="card">

      <div style="
      text-align:center;
      font-size:18px;
      font-weight:bold;
      margin-bottom:15px">
        Pendapatan
      </div>

      <!-- ROW ATAS -->
      <div style="
      display:flex;
      gap:10px;
      margin-bottom:12px">

        <!-- PARKIR -->
        <div
        onclick="showDashboardHistory('parkir')"
        style="
        flex:1;
        background:#eef7ff;
        border-radius:14px;
        padding:14px;
        cursor:pointer;
        border:1px solid #d6ebff">

          <div style="
          font-size:14px;
          color:#666">
            Parkir
          </div>

          <div style="
          margin-top:8px;
          font-size:13px">

            Checkout:
            <b>
              ${d.checkoutCount}
            </b>

            <br>

            Total:
            <b>
              ${rupiah(
                d.checkoutTotal
              )}
            </b>

          </div>

        </div>

        <!-- BULANAN -->
        <div
        onclick="showDashboardHistory('bulanan')"
        style="
        flex:1;
        background:#eefdf3;
        border-radius:14px;
        padding:14px;
        cursor:pointer;
        border:1px solid #d7f7df">

          <div style="
          font-size:14px;
          color:#666">
            Bulanan
          </div>

          <div style="
          margin-top:8px;
          font-size:13px">

            Checkout:
            <b>
              ${d.bulananCount}
            </b>

            <br>

            Total:
            <b>
              ${rupiah(
                d.bulananTotal
              )}
            </b>

          </div>

        </div>

      </div>

      <!-- TITIPAN -->
      <div
      onclick="
      showDashboardHistory(
      'titipan-income'
      )"
      style="
      background:#fffdf1;
      border-radius:14px;
      padding:14px;
      margin-bottom:12px;
      cursor:pointer;
      border:1px solid #f4ebc1">

        <div style="
        text-align:center;
        font-weight:bold;
        margin-bottom:8px">
          Titip Jajan
        </div>

        Item:
        <b>
          ${d.titipanItems}
        </b>

        <br>

        Total:
        <b>
          ${rupiah(
            d.titipanIncomeTotal
          )}
        </b>

      </div>

      <!-- STOK -->
      <div
      onclick="
      showDashboardHistory(
      'stok-income'
      )"
      style="
      background:#f4f4ff;
      border-radius:14px;
      padding:14px;
      cursor:pointer;
      border:1px solid #dadaff">

        <div style="
        text-align:center;
        font-weight:bold;
        margin-bottom:8px">
          Stok
        </div>

        Item:
        <b>
          ${d.stokIncomeItems}
        </b>

        <br>

        Total:
        <b>
          ${rupiah(
            d.stokIncomeTotal
          )}
        </b>

      </div>

    </div>
    `
  }

  /* =====================
     PENGELUARAN
  ===================== */

  if(breakdownMode === "expense"){

    box.innerHTML = `

    <div class="card">

      <div style="
      text-align:center;
      font-size:18px;
      font-weight:bold;
      margin-bottom:15px">
        Pengeluaran
      </div>

      <!-- TITIPAN -->
      <div
      onclick="
      showDashboardHistory(
      'titipan-expense'
      )"
      style="
      background:#fff3f3;
      border-radius:14px;
      padding:14px;
      margin-bottom:12px;
      cursor:pointer;
      border:1px solid #ffd7d7">

        <div style="
        text-align:center;
        font-weight:bold;
        margin-bottom:8px">
          Titip Jajan
        </div>

        Item:
        <b>
          ${d.titipanItems}
        </b>

        <br>

        Total:
        <b>
          ${rupiah(
            d.titipanExpenseTotal
          )}
        </b>

      </div>

      <!-- STOK -->
      <div
      onclick="
      showDashboardHistory(
      'stok-expense'
      )"
      style="
      background:#fff3f3;
      border-radius:14px;
      padding:14px;
      cursor:pointer;
      border:1px solid #ffd7d7">

        <div style="
        text-align:center;
        font-weight:bold;
        margin-bottom:8px">
          Stok
        </div>

        Item:
        <b>
          ${d.stokExpenseItems}
        </b>

        <br>

        Total:
        <b>
          ${rupiah(
            d.stokExpenseTotal
          )}
        </b>

      </div>

    </div>
    `
  }
}