#  **BOT WHATSAPP TERINTEGRASI PAYMENT PAKASIR**

Ini adalah program bot yang dibuat oleh [Lenwy]( https://github.com/Lenwyy). Karena di githubnya cuma ada [base program](https://github.com/Lenwyy/Lenwy-Base-Bot-ESM) jadi di sini saya share yang sudah terintegrasi dengan pakasir.

## 🌟 **Fitur Utama**
**1. Penjualan Produk Digital**

**2. Pembayaran dengan QRIS**

**3. Notifikasi Real Time**



## 📦 **Cara Instalasi**

Pastikan Anda Sudah Menginstall Node.js (Versi LTS Direkomendasikan).

**1. Clone Repositori**

     https://github.com/Kubagus/bot-wa-pakasir

**2. Masuk Ke Direktori**

    cd bot-wa-pakasir

**3. Install Dependencies**

    npm install

**4. Isi konfigurasi env**

Buat akun [pakasir](https://pakasir.com/) jika belum punya, buat project dan masuk ke [dashboard](https://app.pakasir.com/) pakasir. Selanjutnya di program copy file 
    
    .env.example 
    
dan rename menjadi 

    .env 

lalu Isi pakasir project dan api key nya.

**4. Konfigurasi Produk**

Tulis daftar produk sesuai dengan yang ada di file products.json dan sesuaikan isi produk yang dijual di dalam folder stock

**4. Jalankan Bot**

Ubah nomor ponsel di file creator.json dan premium.json

**5. Jalankan Bot**

    npm start


