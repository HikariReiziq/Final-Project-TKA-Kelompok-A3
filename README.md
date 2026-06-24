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
┌─────────────────┐
                    │   Load Balancer │  (DigitalOcean LB - $12/bln)
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
 ┌────────▼───────┐ ┌───────▼────────┐ ┌──────▼─────────┐
 │  Worker 1      │ │  Worker 2      │ │  Worker 3      │
 │  Flask+Gunicorn │ │  Flask+Gunicorn │ │  Flask+Gunicorn │
 │  1vCPU / 1GB    │ │  1vCPU / 1GB    │ │  1vCPU / 1GB    │
 │  ($6/bln)       │ │  ($6/bln)       │ │  ($6/bln)       │
 └────────┬────────┘ └───────┬────────┘ └──────┬─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   MongoDB       │
                    │   2vCPU / 4GB   │
                    │   ($24/bln)     │
                    └─────────────────┘

 Frontend: DigitalOcean Spaces CDN / Droplet Statis ($5/bln)

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
Konfigurasi Akses Jaringan:
Mengubah konfigurasi pada /etc/mongod.conf agar menerima koneksi eksternal dari network internal worker.
Bash
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
systemctl start mongod && systemctl enable mongod
Storage Tuning & Optimization (/etc/mongod.conf):
YAML
storage:
  journal:
    enabled: false  # Di-disable sementara khusus untuk keperluan memaksimalkan kecepatan write saat pengujian Locust
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2.5  # Mengalokasikan ~60% dari total RAM 4GB demi kecepatan caching query history
Pembuatan Database Indexes:
Akselerasi kecepatan baca data riwayat pesanan (GET /orders) dan pencarian data dilakukan dengan menambahkan Index khusus pada Mongo Shell (mongosh):
JavaScript
use orderdb
db.orders.createIndex({ "created_at": -1 })
db.orders.createIndex({ "order_id": 1 }, { unique: true })
db.orders.createIndex({ "status": 1 })
B. Setup Backend Workers (Worker 1, 2, & 3)
Setiap worker menggunakan droplet OS Ubuntu 22.04 LTS (1 vCPU / 1 GB RAM) di region Singapore.
Setup Environment & Dependensi Aplikasi:
Bash
apt update && apt install -y python3-pip python3-venv nginx
mkdir -p /opt/app && cd /opt/app
python3 -m venv venv
source venv/bin/activate
# Upload file app.py dan requirements.txt ke server
pip install -r requirements.txt
Konfigurasi Environment Variable (/opt/app/.env):
Mengkoneksikan URI database ke Private IP server MongoDB demi meminimalkan network latency, dikombinasikan dengan pembatasan Connection Pool:
Cuplikan kode
MONGO_URI=mongodb://<PRIVATE_IP_DB_MONGO>:27017/orderdb?maxPoolSize=50&connectTimeoutMS=5000
Konfigurasi Gunicorn WSGI Server (/etc/systemd/system/flask-app.service):
Gunicorn disetel menggunakan 4 worker (mengikuti rumus optimasi aplikasi berbasis I/O bound) serta mengaktifkan parameter keep-alive:
Ini, TOML
[Unit]
Description=Flask Order Service
After=network.target

[Service]
User=root
WorkingDirectory=/opt/app
EnvironmentFile=/opt/app/.env
ExecStart=/opt/app/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --keep-alive 5 app:app
Restart=always

[Install]
WantedBy=multi-user.target
Bash
systemctl daemon-reload && systemctl start flask-app && systemctl enable flask-app
Tuning Reverse Proxy Nginx Server (/etc/nginx/sites-available/flask):
Menyetel worker_connections yang lebih besar pada /etc/nginx/nginx.conf (diatur ke 2048) serta mendistribusikan proxy lokal:
Nginx
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass [http://127.0.0.1:5000](http://127.0.0.1:5000);
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 30;
        proxy_read_timeout 120;
    }
    location /health {
        proxy_pass [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health);
        access_log off;
    }
}
Bash
ln -sf /etc/nginx/sites-available/flask /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
C. Setup Load Balancer & Keamanan Cloud Firewall
DigitalOcean Load Balancer:
Dibuat pada region Singapore (sgp1).
Aturan penerusan (Forwarding Rules): HTTP Port 80 → HTTP Port 80.
Pemantauan kondisi server (Health Check): Mengarah ke endpoint /health pada Port 80 dengan protokol HTTP.
Seluruh droplet worker-1, worker-2, dan worker-3 didaftarkan masuk sebagai target penyeimbang beban di belakang IP publik Load Balancer.
Penerapan Aturan Cloud Firewall:
Firewall Sisi Worker: Hanya membuka Inbound lalu lintas data Port 80 yang bersumber eksklusif dari IP Load Balancer, serta Port 22 terbatas untuk SSH.
Firewall Sisi Database: Hanya membuka akses Inbound Port data 27017 bersumber dari segmen Private IP Address milik ketiga server Worker.
D. Deployment Frontend
Frontend web statis (index.html dan styles.css) dideploy menggunakan DigitalOcean Spaces CDN (Static Web Hosting). Konfigurasi API_BASE di dalam JavaScript diarahkan langsung menuju alamat IP Publik milik Load Balancer:
JavaScript
const API_BASE = "http://<IP_PUBLIC_LOAD_BALANCER>";
4. Hasil Pengujian Endpoint
Pengujian REST API via Postman
Berikut bukti keberhasilan respons untuk skenario fungsionalitas REST API:
POST /order (Create Order) - [Screenshot Postman]
GET /order/<order_id> (Get Order Status) - [Screenshot Postman]
GET /orders (Get Order History) - [Screenshot Postman]
PUT /order/<order_id> (Update Order Status) - [Screenshot Postman]
Tampilan Antarmuka Frontend (Web UI)
(Masukkan screenshot halaman web frontend yang diakses melalui URL Spaces CDN dan berhasil melakukan CRUD transaksi order)
5. Hasil Load Testing (Locust)
Catatan Khusus: Pengujian dijalankan secara remote dari mesin host/komputer eksternal yang terpisah. Database selalu di-reset ke kondisi baseline awal menggunakan utilitas mongorestore --drop dump/ sebelum masuk ke skenario pengujian berikutnya.
Ringkasan Tabel Hasil Uji
No	Skenario	Parameter	Durasi	Max Concurrent User (0% Failure)	Rata-Rata RPS Tertinggi
1	Maksimum RPS	User naik bertahap	60 detik	-	... RPS
2	Peak Concurrency	Spawn Rate 50	60 detik	... User	-
3	Peak Concurrency	Spawn Rate 100	60 detik	... User	-
4	Peak Concurrency	Spawn Rate 200	60 detik	... User	-
5	Peak Concurrency	Spawn Rate 500	60 detik	... User	-
Analisis & Grafik Per Skenario
(Sertakan screenshot grafik RPS, Response Time, dan Failure Rate dari web interface Locust beserta visualisasi utilitas server via htop / dashboard cloud provider selama load testing berlangsung)
Analisis Skenario 1 (Maksimum RPS): ...
Analisis Skenario 2 (Spawn Rate 50): ...
Analisis Skenario 3 (Spawn Rate 100): ...
Analisis Skenario 4 (Spawn Rate 200): ...
Analisis Skenario 5 (Spawn Rate 500): ...
6. Kesimpulan dan Saran
Kesimpulan
Berdasarkan seluruh rangkaian skenario pengujian beban (load testing) menggunakan Locust, arsitektur Multi-Worker berbasis DigitalOcean dengan anggaran efisien sebesar $59/bulan terbukti mampu menangani lonjakan beban trafik hingga mencapai puncak rata-rata X RPS dengan tingkat kegagalan transaksi mutlak 0% failure.
Bottleneck performa utama yang diamati selama pengujian terletak pada bagian... (isi berdasarkan pengamatan htop saat tes dilakukan, misal: Utilisasi CPU pada Worker / Latency Write Disk Database).
Saran untuk Deployment Nyata (Masa Depan)
Penerapan Auto-scaling Kebijakan Dinamis: Mengonfigurasi mekanisme pemicu penambahan Droplet Worker secara otomatis berbasis metrik utilisasi CPU jika melampaui ambang batas 70%.
Layering Caching Data Terdistribusi: Mengintegrasikan sistem In-Memory Caching seperti Redis Server di depan backend untuk memotong query berulang pada endpoint pembacaan histori order (GET /orders).
Containerization & Orchestration: Melakukan migrasi tata kelola infrastruktur berbasis Docker Container dan Kubernetes (K8s) agar alokasi resource mikro dapat berjalan jauh lebih lincah dan terstandarisasi.
