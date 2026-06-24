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

## 1. Introduction

### Latar Belakang & Permasalahan
Proyek ini merupakan implementasi backend **Order Processing Service** berbasis cloud untuk platform *e-commerce*. Layanan inti ini menangani fungsionalitas krusial seperti pembuatan pesanan (*create order*), pengecekan status (*get order status*), serta peninjauan riwayat transaksi (*get order history*). 

Sistem dibangun menggunakan REST API berbasis **Python (Flask)** dengan penyimpanan database **MongoDB**. Untuk antarmuka pengguna, disediakan pula frontend sederhana berbasis web (HTML & CSS).

### Tantangan & Batasan (Constraint)
Sebagai *Cloud Engineer*, tantangan utama dalam proyek ini adalah mendeploy, mengonfigurasi, dan mengoptimalkan seluruh infrastruktur agar mampu menangani lonjakan *traffic* tinggi secara andal dan efisien (misalnya saat terjadi fenomena *flash sale* atau *promo*). Deployment ini memanfaatkan provider **DigitalOcean** dengan mematuhi batasan finansial yang ketat, yaitu **budget maksimal sebesar 75 US$ / bulan** (atau setara dengan ± Rp1.300.000,-) dengan target **memaksimalkan nilai RPS (Request Per Second)**.

---

## 2. Arsitektur Cloud

### Diagram Arsitektur
Arsitektur dirancang secara terdistribusi dengan memisahkan beban *Traffic Management*, *Application Logic*, dan *Database Storage* melalui jaringan privat (VPC).

### Tabel Spesifikasi & Alokasi Biaya
Dengan total anggaran **$59/bulan**, arsitektur ini menyisakan sisa *budget* sekitar ~$16 yang bisa dialokasikan kembali untuk *scaling* horizontal (menambah 1-2 worker lagi) jika diperlukan selama pengujian.

| Komponen | Spesifikasi Droplet / Service | Harga/Bulan |
| :--- | :--- | :--- |
| Load Balancer | DigitalOcean LB | $12 |
| Worker 1 (Backend) | Regular Droplet - 1 vCPU, 1 GB RAM | $6 |
| Worker 2 (Backend) | Regular Droplet - 1 vCPU, 1 GB RAM | $6 |
| Worker 3 (Backend) | Regular Droplet - 1 vCPU, 1 GB RAM | $6 |
| Database (MongoDB) | Regular Droplet - 2 vCPU, 4 GB RAM | $24 |
| Frontend (Spaces CDN)| Static hosting + CDN | $5 |
| **Total Pengeluaran**| | **$59 / bulan** |

### Analisis Performa & Efisiensi Biaya
1. **Pemisahan Database Terdedikasi:** Menempatkan MongoDB pada Droplet berspesifikasi lebih tinggi (2 vCPU / 4 GB RAM) ditujukan agar sistem *caching database* (`wiredTiger`) berjalan optimal serta mencegah bottleneck I/O bersaing dengan *Application Web Server*.
2. **Horizontal Scaling Backend Workers:** Alih-alih menyewa satu server besar, kami membagi aplikasi ke dalam 3 Droplet Worker kecil berbiaya $6/bulan. Jika salah satu server mengalami gangguan, beban otomatis dialihkan oleh Load Balancer ke worker yang lain (*High Availability*).
3. **Optimasi Network Jaringan Internal (VPC):** Komunikasi antar Worker menuju Database dikonfigurasi melalui Private IP. Hal ini memangkas latency network, meningkatkan kecepatan transfer data, dan meningkatkan keamanan karena port database tidak dibuka ke publik.

---

## 3. Implementasi

### A. Setup & Optimasi Database Server (MongoDB)
Menggunakan droplet berspesifikasi 2 vCPU / 4 GB RAM dengan OS Ubuntu 22.04 LTS yang berlokasi di region terdekat (**Singapore - sgp1**).

1. **Instalasi MongoDB 7.0:**
   ```bash
   curl -fsSL [https://www.mongodb.org/static/pgp/server-7.0.asc](https://www.mongodb.org/static/pgp/server-7.0.asc) | \
     gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

   echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] [https://repo.mongodb.org/apt/ubuntu](https://repo.mongodb.org/apt/ubuntu) jammy/mongodb-org/7.0 multiverse" | \
     tee /etc/apt/sources.list.d/mongodb-org-7.0.list

   apt update && apt install -y mongodb-org mongodb-database-tools
