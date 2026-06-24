# FINAL PROJECT TEKNOLOGI KOMPUTASI AWAN 2026

# KELOMPOK 4 KELAS A

| Nama | NRP |
| :--- | :--- |
| Evan Christian Nainggolan | 5027241026 |
| Rizqi Akbar Sukirman P. | 5027241044 |
| Dina Rahmadani | 5027241065 |
| M. Hikari Reiziq | 5027241079 |
| Ahmad Syawqi Reza | 5027241085 |
| Yasykur Khalis Jati | 5027241112 |

---

# 1. Introduction

## 1.1 Latar Belakang

Perkembangan industri e-commerce menuntut sistem backend yang mampu menangani jumlah transaksi yang tinggi secara konsisten dan andal. Salah satu komponen utama dalam platform e-commerce adalah *Order Processing Service*, yaitu layanan yang bertanggung jawab untuk memproses pembuatan pesanan, menyimpan data transaksi, mengelola status pesanan, serta menyediakan riwayat transaksi kepada pengguna.

Dalam kondisi normal, layanan tersebut mungkin hanya menerima sejumlah kecil request. Namun, pada situasi tertentu seperti flash sale, promo besar, atau kampanye pemasaran, jumlah request dapat meningkat secara drastis dalam waktu singkat. Jika infrastruktur tidak dirancang dengan baik, kondisi tersebut dapat menyebabkan peningkatan response time, kegagalan request, bahkan downtime layanan.

Komputasi awan (*cloud computing*) menyediakan berbagai mekanisme untuk mengatasi permasalahan tersebut, seperti load balancing, horizontal scaling, pemisahan layanan aplikasi dan database, serta penyediaan sumber daya yang fleksibel sesuai kebutuhan. Dengan memanfaatkan layanan cloud, sistem dapat dirancang agar mampu menangani beban tinggi dengan tetap mempertahankan efisiensi biaya operasional.

Pada final project ini dilakukan implementasi dan optimasi layanan *Order Processing Service* berbasis Flask dan MongoDB menggunakan infrastruktur cloud dari DigitalOcean. Fokus utama proyek adalah merancang arsitektur yang mampu memberikan performa tinggi dengan biaya operasional tidak melebihi batas yang ditentukan, yaitu sebesar 75 USD per bulan.

## 1.2 Permasalahan

Perusahaan startup e-commerce membutuhkan layanan backend yang mampu:

* Menangani pembuatan pesanan (*Create Order*).
* Menampilkan status pesanan (*Get Order Status*).
* Menampilkan riwayat transaksi (*Get Order History*).
* Memperbarui status pesanan (*Update Order Status*).

Layanan harus tetap stabil ketika menerima lonjakan traffic yang tinggi serta mampu memberikan response yang cepat dengan tingkat kegagalan seminimal mungkin.

Selain itu, seluruh sistem harus dibangun dengan mempertimbangkan keterbatasan anggaran maksimal sebesar 75 USD per bulan sehingga diperlukan keseimbangan antara performa dan efisiensi biaya.

## 1.3 Tujuan

Tujuan dari final project ini adalah:

1. Merancang arsitektur cloud yang scalable dan cost-efficient menggunakan platform DigitalOcean.
2. Melakukan deployment aplikasi Order Processing Service berbasis Flask dan MongoDB pada lingkungan cloud.
3. Mengimplementasikan load balancing untuk mendistribusikan request ke beberapa backend worker.
4. Mengoptimalkan konfigurasi aplikasi dan database agar mampu menangani beban tinggi.
5. Melakukan pengujian performa menggunakan Locust untuk memperoleh nilai maksimum Request Per Second (RPS) dan peak concurrency dengan tingkat kegagalan 0%.
6. Menganalisis hasil pengujian guna mengevaluasi efektivitas arsitektur yang telah dibangun.

## 1.4 Ruang Lingkup

Ruang lingkup proyek ini meliputi:

* Deployment backend Flask menggunakan Gunicorn.
* Deployment MongoDB sebagai database server terpisah.
* Implementasi DigitalOcean Load Balancer.
* Deployment frontend berbasis HTML, CSS, dan JavaScript.
* Konfigurasi firewall dan private networking menggunakan VPC.
* Optimasi performa melalui tuning Gunicorn, Nginx, dan MongoDB.
* Pengujian endpoint aplikasi menggunakan Postman.
* Pengujian beban menggunakan Locust.
* Monitoring penggunaan resource server selama proses load testing.

## 1.5 Gambaran Solusi

Untuk memenuhi kebutuhan performa dan efisiensi biaya, digunakan arsitektur berbasis DigitalOcean yang terdiri dari satu Load Balancer, tiga backend worker Flask, satu server MongoDB terpisah, dan layanan static hosting untuk frontend.

Load Balancer berfungsi mendistribusikan request ke beberapa backend worker sehingga beban tidak terpusat pada satu server. Setiap worker menjalankan aplikasi Flask menggunakan Gunicorn untuk meningkatkan kemampuan menangani koneksi secara paralel. MongoDB ditempatkan pada server terpisah agar proses database tidak mengganggu kinerja aplikasi. Selain itu, penggunaan VPC Private Network memungkinkan komunikasi internal yang lebih aman dan cepat antara backend dan database.

Dengan total biaya sekitar 59 USD per bulan, arsitektur ini masih berada di bawah batas anggaran yang ditentukan sekaligus menyediakan ruang untuk melakukan scaling apabila diperlukan.

# 2. Cloud Architecture

## 2.1 Architecture Diagram

![Architecture Diagram](result/architecture_diagram.png)

**Gambar 1.** Arsitektur cloud yang digunakan untuk deployment Order Processing Service pada platform DigitalOcean.

Arsitektur sistem terdiri dari satu DigitalOcean Load Balancer sebagai titik masuk utama request, tiga backend worker yang menjalankan aplikasi Flask menggunakan Gunicorn, satu server MongoDB yang berfungsi sebagai database terpusat, serta frontend yang dihosting menggunakan DigitalOcean Spaces CDN. Seluruh komunikasi antara backend dan database menggunakan VPC Private Network untuk meningkatkan keamanan dan mengurangi latency.

---

## 2.2 Architecture Components

### Load Balancer

DigitalOcean Load Balancer berfungsi sebagai entry point seluruh request dari pengguna. Komponen ini mendistribusikan request ke backend worker yang tersedia sehingga beban tidak terpusat pada satu server. Selain itu, load balancer juga melakukan health check secara berkala untuk memastikan hanya backend yang aktif yang menerima request.

### Backend Workers

Terdapat tiga backend worker yang menjalankan aplikasi Order Processing Service berbasis Flask menggunakan Gunicorn sebagai WSGI server. Pendekatan ini memungkinkan sistem menangani banyak koneksi secara paralel dan mendukung horizontal scaling apabila diperlukan peningkatan kapasitas di masa mendatang.

### MongoDB Server

MongoDB ditempatkan pada server terpisah untuk menghindari kompetisi resource dengan aplikasi backend. Pemisahan ini meningkatkan performa database dan memudahkan proses monitoring maupun scaling pada layer penyimpanan data.

### Frontend Hosting

Frontend dihosting menggunakan DigitalOcean Spaces CDN yang berfungsi sebagai layanan static hosting. Penggunaan CDN membantu mempercepat distribusi konten ke pengguna dan mengurangi beban pada backend server.

### VPC Private Network

Komunikasi antara backend worker dan MongoDB dilakukan melalui jaringan private internal DigitalOcean. Pendekatan ini meningkatkan keamanan karena database tidak perlu diekspos ke internet publik serta memberikan latency yang lebih rendah dibandingkan koneksi melalui public network.

---

## 2.3 Request Flow

Alur request pada sistem adalah sebagai berikut:

1. Pengguna mengakses aplikasi melalui browser.
2. Frontend mengirimkan request API ke DigitalOcean Load Balancer.
3. Load Balancer meneruskan request ke salah satu backend worker yang tersedia.
4. Backend worker memproses request dan berkomunikasi dengan MongoDB melalui private network.
5. MongoDB mengembalikan data yang dibutuhkan ke backend worker.
6. Backend worker mengirimkan response ke pengguna melalui Load Balancer.
7. Hasil response ditampilkan pada antarmuka frontend.

Dengan mekanisme ini, distribusi beban dapat dilakukan secara merata sehingga sistem mampu menangani jumlah request yang lebih besar dibandingkan arsitektur single server.

---

## 2.4 VM Specification and Cost Estimation

| Komponen         | Spesifikasi                | Harga/Bulan |
| ---------------- | -------------------------- | ----------- |
| Load Balancer    | DigitalOcean Load Balancer | $12         |
| Worker 1         | 1 vCPU, 1 GB RAM           | $6          |
| Worker 2         | 1 vCPU, 1 GB RAM           | $6          |
| Worker 3         | 1 vCPU, 1 GB RAM           | $6          |
| MongoDB Server   | 2 vCPU, 4 GB RAM           | $24         |
| Frontend Hosting | DigitalOcean Spaces CDN    | $5          |
| **Total**        |                            | **$59**     |

Total biaya operasional infrastruktur adalah **59 USD per bulan**, sehingga masih berada di bawah batas anggaran yang ditentukan pada final project yaitu **75 USD per bulan**.

---

## 2.5 Architecture Justification

Arsitektur ini dirancang dengan mempertimbangkan keseimbangan antara performa, ketersediaan layanan, dan efisiensi biaya.

Penggunaan tiga backend worker memungkinkan distribusi request secara horizontal sehingga throughput aplikasi meningkat dan risiko bottleneck pada satu server dapat dikurangi. Jika salah satu worker mengalami gangguan, worker lainnya masih dapat melayani request yang masuk melalui load balancer.

Database MongoDB ditempatkan pada server terpisah agar proses query dan penyimpanan data tidak mengganggu resource aplikasi backend. Pemisahan ini juga mempermudah proses optimasi dan scaling pada masing-masing komponen.

DigitalOcean Load Balancer digunakan untuk mendistribusikan request secara otomatis ke seluruh backend worker yang tersedia. Fitur health check bawaan load balancer membantu menjaga ketersediaan layanan dengan menghindari pengiriman request ke server yang tidak sehat.

Dari sisi biaya, total penggunaan resource hanya sebesar 59 USD per bulan sehingga masih menyisakan sekitar 16 USD dari batas anggaran yang diberikan. Sisa anggaran tersebut dapat dimanfaatkan untuk menambah backend worker apabila diperlukan peningkatan kapasitas selama pengujian maupun implementasi pada lingkungan yang lebih besar.

