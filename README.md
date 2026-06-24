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

