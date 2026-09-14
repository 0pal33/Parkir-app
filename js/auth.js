/* =========================================================
   AUTH SYSTEM
   File: js/auth.js

   Fungsi:
   - Mengecek session Supabase
   - Mengambil user yang sedang login
   - Mengambil role dari public.profiles
   - Mengecek admin / petugas
   - Melindungi halaman internal
   - Logout

   Sumber kebenaran:
   - LOGIN  : Supabase Auth session
   - ROLE   : public.profiles.role

   JANGAN menggunakan localStorage.adminLogin
   sebagai bukti login atau hak akses.
   ========================================================= */

window.Auth = {

  /* =======================================================
     GET SESSION
     Mengambil session Supabase yang sedang aktif.
     ======================================================= */
  async getSession(){

    const { data, error } =
      await window.supabaseClient.auth.getSession()

    if(error){
      console.error("Auth getSession error:", error)
      return null
    }

    return data?.session || null
  },


  /* =======================================================
     GET USER
     Mengambil user dari session Supabase.
     ======================================================= */
  async getUser(){

    const session = await this.getSession()

    if(!session){
      return null
    }

    return session.user || null
  },


  /* =======================================================
     GET PROFILE
     Mengambil data role dari public.profiles.

     Hasil contoh:

     {
       id: "...",
       email: "test@e-mail.web.id",
       role: "admin"
     }
     ======================================================= */
  async getProfile(){

    const user = await this.getUser()

    if(!user){
      return null
    }

    const { data, error } =
      await window.supabaseClient
        .from("profiles")
        .select("id,email,role")
        .eq("id", user.id)
        .single()

    if(error){
      console.error("Auth getProfile error:", error)
      return null
    }

    return data || null
  },


  /* =======================================================
     GET CURRENT USER + PROFILE

     Menghasilkan:

     {
       user: {...},
       profile: {
         role: "admin"
       }
     }
     ======================================================= */
  async getCurrent(){

    const user = await this.getUser()

    if(!user){
      return {
        user: null,
        profile: null
      }
    }

    const profile = await this.getProfile()

    return {
      user,
      profile
    }
  },


  /* =======================================================
     IS LOGGED IN
     ======================================================= */
  async isLoggedIn(){

    const session = await this.getSession()

    return !!session
  },


  /* =======================================================
     IS ADMIN
     ======================================================= */
  async isAdmin(){

    const profile = await this.getProfile()

    return profile?.role === "admin"
  },


  /* =======================================================
     IS PETUGAS
     ======================================================= */
  async isPetugas(){

    const profile = await this.getProfile()

    return profile?.role === "petugas"
  },


  /* =======================================================
     GET ROLE
     ======================================================= */
  async getRole(){

    const profile = await this.getProfile()

    return profile?.role || null
  },


  /* =======================================================
     REQUIRE LOGIN

     Digunakan pada halaman internal yang membutuhkan
     user sudah login.

     Contoh:

     await Auth.requireLogin()

     Kalau belum login:
     → kembali ke index.html
     ======================================================= */
  async requireLogin(){

    const session = await this.getSession()

    if(!session){

      console.warn("Akses ditolak: user belum login")

      window.location.replace("index.html")

      return false
    }

    return true
  },


  /* =======================================================
     REQUIRE ROLE

     Contoh:

     await Auth.requireRole("admin")

     Hanya admin yang boleh masuk.

     Petugas:
     → ditolak

     Orang umum:
     → ditolak
     ======================================================= */
  async requireRole(requiredRole){

    const session = await this.getSession()

    if(!session){

      console.warn("Akses ditolak: belum login")

      window.location.replace("index.html")

      return false
    }


    const profile = await this.getProfile()

    if(!profile){

      console.warn("Akses ditolak: profile tidak ditemukan")

      await this.logout(false)

      window.location.replace("index.html")

      return false
    }


    if(profile.role !== requiredRole){

      console.warn(
        "Akses ditolak. Role:",
        profile.role,
        "Required:",
        requiredRole
      )

      alert("Anda tidak memiliki izin untuk membuka halaman ini.")

      window.location.replace("index.html")

      return false
    }


    return true
  },


  /* =======================================================
     REQUIRE ADMIN
     Shortcut:

     await Auth.requireAdmin()
     ======================================================= */
  async requireAdmin(){

    return await this.requireRole("admin")
  },


  /* =======================================================
     REQUIRE PETUGAS
     Shortcut:

     await Auth.requireRole("petugas")

     atau:

     await Auth.requirePetugas()
     ======================================================= */
  async requirePetugas(){

    return await this.requireRole("petugas")
  },


  /* =======================================================
     LOGOUT

     clearLocal = true:
       hapus localStorage adminLogin lama jika masih ada.

     Kita gunakan ini hanya untuk membersihkan sistem lama.
     ======================================================= */
  async logout(clearLocal = true){

    const { error } =
      await window.supabaseClient.auth.signOut()

    if(error){

      console.error("Logout error:", error)

      return false
    }


    if(clearLocal){

      localStorage.removeItem("adminLogin")
    }


    return true
  },


  /* =======================================================
     LOGIN

     Helper login supaya nanti semua login bisa
     menggunakan satu mekanisme.

     Mengembalikan:

     {
       user,
       session
     }

     atau null kalau gagal.
     ======================================================= */
  async login(email, password){

    const cleanEmail = String(email || "").trim()

    if(!cleanEmail || !password){

      throw new Error(
        "Email dan password wajib diisi"
      )
    }


    const { data, error } =
      await window.supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password
      })


    if(error){

      console.error("Auth login error:", error)

      throw error
    }


    return {
      user: data?.user || null,
      session: data?.session || null
    }
  },


  /* =======================================================
     AUTH STATE LISTENER

     Fungsi ini dapat digunakan nanti kalau kita perlu
     mengetahui ketika:

     - login
     - logout
     - session berubah
     ======================================================= */
  onAuthStateChange(callback){

    return window.supabaseClient.auth.onAuthStateChange(
      (event, session) => {

        if(typeof callback === "function"){
          callback(event, session)
        }

      }
    )
  }

}