async function checkin(k){

const {error}=await supabase.from('parkir').insert({
kode:k,
status:'on',
checkin_at:new Date()
})

if(error){
alert("Gagal checkin")
return
}

showHome()

}

async function checkout(k){

const {error}=await supabase
.from('parkir')
.update({
status:'off',
checkout_at:new Date()
})
.eq('kode',k)
.eq('status','on')

if(error){
alert("Gagal checkout")
}

showHome()

}
