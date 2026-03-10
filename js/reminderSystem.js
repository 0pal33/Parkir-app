async function loadReminder(){

const {data}=await supabase
.from("bulanan")
.select("*")
.eq("status","aktif")

if(!data) return

let now=new Date()
let today=now.getDate()
let month=now.getMonth()
let year=now.getFullYear()

let html=""

data.forEach(p=>{

let target

if(p.paid_until){
target=new Date(p.paid_until)
}else{
target=new Date(year,month,p.jatuh_tempo)
}

let todayDate=new Date(year,month,today)
let targetDate=new Date(
target.getFullYear(),
target.getMonth(),
target.getDate()
)

let diff=Math.floor((targetDate-todayDate)/86400000)

if(diff<=5 && diff>=0){

let text=""

if(diff===0) text="Hari ini"
else if(diff===1) text="Besok"
else text=diff+" hari lagi"

html+=`
<div style="
background:#fff3cd;
padding:10px;
margin:6px;
border-radius:10px;
font-size:14px
">
⚠ <b>${p.nama}</b><br>
Jatuh tempo ${text}
</div>
`

}

})

document.getElementById("resultBox").innerHTML=html

                     }
