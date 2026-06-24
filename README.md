# 🛒 Final Project Teknologi Komputasi Awan 2026 — Kelompok A3

## Order Processing Service

Sebuah layanan backend **Order Processing Service** yang di-deploy pada infrastruktur cloud **DigitalOcean**, dirancang untuk menangani lonjakan traffic (flash sale, promo, dsb.) dengan andal dan efisien.

> **Mata Kuliah:** Teknologi Komputasi Awan (TKA) — Semester 4, 2026
> **Kelompok:** A3
> **Cloud Provider:** DigitalOcean (Budget: $75/bulan)
> **URL Akses:** [`http://129.212.209.53`](http://129.212.209.53)

---

## 📑 Daftar Isi

1. [Introduction](#1-introduction)
2. [Arsitektur Cloud](#2-arsitektur-cloud)
3. [Implementasi — Panduan Setup Lengkap](#3-implementasi--panduan-setup-lengkap)
4. [Hasil Pengujian Endpoint](#4-hasil-pengujian-endpoint)
5. [Hasil Load Testing](#5-hasil-load-testing)
6. [Kesimpulan dan Saran](#6-kesimpulan-dan-saran)

---

## 1. Introduction

### 1.1 Latar Belakang

Sebuah perusahaan rintisan (startup) di bidang e-commerce sedang mengembangkan platform jual-beli online. Platform ini membutuhkan backend **Order Processing Service** — layanan inti yang menangani:

- **Pembuatan pesanan** (order creation)
- **Pengecekan status pesanan** (order tracking)
- **Riwayat transaksi** (order history)
- **Katalog produk** (product catalog)
- **Dashboard admin** (admin statistics)

Sebagai Cloud Engineer, kami diminta untuk **mendeploy, mengonfigurasi, dan mengoptimalkan** layanan tersebut agar mampu menerima **request per second (RPS) setinggi mungkin** dalam batas budget **$75/bulan**.

### 1.2 Teknologi yang Digunakan

| Komponen | Teknologi |
|----------|-----------|
| Backend Framework | Python (Flask) |
| WSGI Server | Gunicorn (mode `gthread`, 4 workers × 20 threads) |
| Database | MongoDB 7.x |
| Reverse Proxy | Nginx |
| Load Balancer | DigitalOcean Managed Load Balancer |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Authentication | JWT (JSON Web Token) |
| Password Hashing | bcrypt |
| Load Testing | Locust (FastHttpUser) |

### 1.3 Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin1@tka.its.ac.id` | `Admin@12345` |
| Admin | `admin2@tka.its.ac.id` | `Admin@12345` |
| User | `user1@example.com` s/d `user500@example.com` | `User@12345` |

---

## 2. Arsitektur Cloud

### 2.1 Diagram Arsitektur

```
                 ┌───────────────────────────────────┐
                 │         Internet / Client          │
                 └───────────────┬───────────────────┘
                                 │
                 ┌───────────────▼───────────────────┐
                 │        Load Balancer               │
                 │        129.212.209.53              │
                 │        DigitalOcean LB             │
                 │        $12/bulan                   │
                 └──┬──────────┬──────────┬──────────┘
                    │          │          │
       ┌────────────▼──┐  ┌───▼────────────┐  ┌───▼────────────┐
       │   Worker-1    │  │   Worker-2     │  │   Worker-3     │
       │  168.144.45.x │  │ 168.144.136.x  │  │ 152.42.191.x   │
       │  1vCPU / 2GB  │  │  1vCPU / 2GB   │  │  1vCPU / 2GB   │
       │  $12/bulan    │  │  $12/bulan     │  │  $12/bulan     │
       │               │  │                │  │                │
       │  ┌──────────┐ │  │  ┌──────────┐  │  │  ┌──────────┐  │
       │  │  Nginx   │ │  │  │  Nginx   │  │  │  │  Nginx   │  │
       │  │(Frontend │ │  │  │(Frontend │  │  │  │(Frontend │  │
       │  │ + Proxy) │ │  │  │ + Proxy) │  │  │  │ + Proxy) │  │
       │  └────┬─────┘ │  │  └────┬─────┘  │  │  └────┬─────┘  │
       │       │        │  │       │        │  │       │        │
       │  ┌────▼─────┐  │  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │
       │  │ Gunicorn │  │  │  │ Gunicorn │  │  │  │ Gunicorn │  │
       │  │ (Flask)  │  │  │  │ (Flask)  │  │  │  │ (Flask)  │  │
       │  │ 4w × 20t │  │  │  │ 4w × 20t │  │  │  │ 4w × 20t │  │
       │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │
       └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
               │                   │                   │
               └───────────────────┼───────────────────┘
                                   │ (VPC Private Network)
                    ┌──────────────▼───────────────┐
                    │         db-mongo              │
                    │        68.183.185.x           │
                    │        2vCPU / 4GB RAM         │
                    │        MongoDB 7.x            │
                    │        $24/bulan              │
                    └──────────────────────────────┘
```

### 2.2 Tabel Spesifikasi & Biaya

| No | Komponen | Hostname | Spesifikasi | Region | Harga/bulan |
|----|----------|----------|-------------|--------|-------------|
| 1 | Load Balancer | `load-balancer` | DigitalOcean Managed LB | SGP1 | $12 |
| 2 | App Server 1 | `worker-1` | 1vCPU, 2 GB RAM, 50 GB SSD | SGP1 | $12 |
| 3 | App Server 2 | `worker-2` | 1vCPU, 2 GB RAM, 50 GB SSD | SGP1 | $12 |
| 4 | App Server 3 | `worker-3` | 1vCPU, 2 GB RAM, 50 GB SSD | SGP1 | $12 |
| 5 | Database Server | `db-mongo` | 2vCPU, 4 GB RAM, 80 GB SSD | SGP1 | $24 |
| | | | | **Total** | **$72/bulan** |

> **Budget Utilization:** $72 / $75 = **96%** — Sangat efisien.

### 2.3 Justifikasi Pemilihan Arsitektur

| Keputusan Desain | Alasan |
|------------------|--------|
| **3 Worker + 1 Load Balancer** | Memaksimalkan throughput. 3 Worker memberikan total ~159 RPS (~53 RPS per worker). Load Balancer mendistribusikan beban secara merata (round-robin). |
| **Worker 2GB RAM** | Gunicorn mode `gthread` (4 workers × 20 threads) membutuhkan ~1.2GB RAM. Sisa RAM digunakan OS dan Nginx. Spesifikasi 1GB terlalu kecil dan menyebabkan OOM (Out of Memory). |
| **Database 4GB RAM terpisah** | MongoDB menggunakan WiredTiger Storage Engine yang sangat agresif memanfaatkan RAM untuk in-memory caching. Dengan 4GB, seluruh index + working set data masuk dalam RAM. Memisahkan DB dari app server menghindari persaingan resource CPU/RAM. |
| **Region SGP1** | Singapore adalah region DigitalOcean terdekat dari Indonesia. Semua komponen di region yang sama meminimalkan network latency (<1ms antar-node). |
| **Frontend via Nginx (bukan DO Spaces)** | DigitalOcean Spaces menggunakan HTTPS secara paksa, sedangkan Backend API kita menggunakan HTTP biasa. Ini menyebabkan **Mixed Content Error** di browser modern. Dengan menaruh Frontend di Nginx yang sama dengan Backend (same-origin), masalah ini terselesaikan sepenuhnya. |

---

## 3. Implementasi — Panduan Setup Lengkap

> **Catatan:** Panduan ini ditulis agar orang yang baru pertama kali menggunakan DigitalOcean pun bisa mengikutinya langkah per langkah.

### Prasyarat

Sebelum memulai, pastikan kamu punya:
- Akun DigitalOcean dengan credit tersedia (minimal $75)
- Terminal SSH (Windows: WSL / PowerShell, macOS/Linux: Terminal bawaan)
- Git terinstall di komputer lokal
- Python 3 dan `pip` terinstall di komputer lokal (untuk menjalankan Locust)

---

### Langkah 1 — Buat Droplet Database (MongoDB)

#### 1.1 Buat Droplet di DigitalOcean

1. Login ke [DigitalOcean Dashboard](https://cloud.digitalocean.com/)
2. Klik **Create** → **Droplets**
3. Isi konfigurasi berikut:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Regular → **2 vCPU / 4 GB RAM** ($24/mo)
   - **Region:** Singapore (SGP1)
   - **Authentication:** SSH Key (direkomendasikan) atau Password
   - **Hostname:** `db-mongo`
4. Klik **Create Droplet**
5. Catat **IP Address** droplet yang muncul (contoh: `68.183.185.xxx`)

#### 1.2 Install MongoDB

SSH ke droplet database:

```bash
ssh root@<IP_DB_MONGO>
```

Jalankan perintah berikut satu per satu:

```bash
# 1. Tambahkan repository MongoDB 7.0
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 2. Install MongoDB
apt update && apt install -y mongodb-org

# 3. Konfigurasi agar MongoDB menerima koneksi dari Worker
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf

# 4. Start dan enable MongoDB
systemctl start mongod
systemctl enable mongod

# 5. Verifikasi MongoDB berjalan
systemctl status mongod
```

#### 1.3 Restore Data Awal (Seed Data)

```bash
# Install tools untuk restore
apt install -y mongodb-database-tools

# Upload folder dump dari komputer lokal ke server:
# (Jalankan dari komputer lokal, BUKAN dari server)
# scp -r Resources/DB/dump/ root@<IP_DB_MONGO>:/root/

# Di server, restore data:
mongorestore --drop /root/dump/
```

#### 1.4 Buat Index untuk Optimasi Query

```bash
# Masuk ke MongoDB shell
mongosh

# Pilih database
use orderdb

# === Index untuk collection users ===
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ is_active: 1 })

# === Index untuk collection orders ===
db.orders.createIndex({ order_id: 1 }, { unique: true })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ created_at: -1 })
db.orders.createIndex({ customer_city: 1 })
db.orders.createIndex({ admin_id: 1 })

# === Index untuk collection audit_logs ===
db.audit_logs.createIndex({ created_at: -1 })

# Verifikasi semua index sudah dibuat
db.users.getIndexes()
db.orders.getIndexes()
db.audit_logs.getIndexes()

# Keluar dari shell
exit
```

> **Mengapa perlu index?** Tanpa index, setiap query MongoDB harus melakukan *full collection scan* (membaca seluruh dokumen satu per satu). Dengan index, query dilakukan dalam hitungan milidetik. Ini **sangat krusial** untuk endpoint seperti `/admin/stats` yang melakukan banyak operasi agregasi.

---

### Langkah 2 — Buat Droplet Worker (x3)

#### 2.1 Buat 3 Droplet di DigitalOcean

Ulangi langkah ini **3 kali** untuk membuat `worker-1`, `worker-2`, dan `worker-3`:

1. Klik **Create** → **Droplets**
2. Isi konfigurasi berikut:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Regular → **1 vCPU / 2 GB RAM** ($12/mo)
   - **Region:** Singapore (SGP1)
   - **Hostname:** `worker-1` / `worker-2` / `worker-3`
3. Klik **Create Droplet**
4. Catat **IP Address** masing-masing worker

#### 2.2 Setup di Setiap Worker

SSH ke setiap worker dan jalankan langkah-langkah berikut:

```bash
ssh root@<IP_WORKER>
```

**a) Install Dependency Sistem**

```bash
apt update && apt install -y python3-pip python3-venv nginx
```

**b) Buat Direktori Aplikasi & Virtual Environment**

```bash
mkdir -p /opt/app
cd /opt/app

# Buat virtual environment Python
python3 -m venv venv
source venv/bin/activate
```

**c) Upload File Aplikasi**

Dari **komputer lokal**, upload file ke setiap worker:

```bash
# Jalankan dari komputer lokal (bukan dari server!)
scp Resources/BE/app.py root@<IP_WORKER>:/opt/app/app.py
```

**d) Buat File requirements.txt**

Di dalam server worker:

```bash
cat > /opt/app/requirements.txt << 'EOF'
flask
flask-cors
pymongo
bcrypt
PyJWT
gunicorn
EOF
```

**e) Install Dependency Python**

```bash
cd /opt/app
source venv/bin/activate
pip install -r requirements.txt
```

**f) Buat File Environment (.env)**

```bash
cat > /opt/app/.env << 'EOF'
MONGO_URI=mongodb://<PRIVATE_IP_DB_MONGO>:27017/?maxPoolSize=50&connectTimeoutMS=5000
JWT_SECRET=ganti-ini-dengan-string-acak-yang-sangat-panjang-dan-aman
JWT_EXPIRES=86400
EOF
```

> ⚠️ **Penting:** Ganti `<PRIVATE_IP_DB_MONGO>` dengan **Private IP** dari droplet `db-mongo` kamu. Private IP bisa dilihat di dashboard DigitalOcean (biasanya dimulai dengan `10.xxx`). Menggunakan Private IP lebih cepat dan aman dibanding Public IP.

**g) Upload File Frontend**

```bash
mkdir -p /opt/app/frontend
```

Dari **komputer lokal**:
```bash
scp Resources/FE/index.html root@<IP_WORKER>:/opt/app/frontend/
scp Resources/FE/styles.css root@<IP_WORKER>:/opt/app/frontend/
```

**h) Buat Service Systemd (Agar Gunicorn Auto-Start)**

```bash
cat > /etc/systemd/system/flask-app.service << 'EOF'
[Unit]
Description=Flask Order Processing Service
After=network.target

[Service]
User=root
WorkingDirectory=/opt/app
EnvironmentFile=/opt/app/.env
ExecStart=/opt/app/venv/bin/gunicorn \
    -w 4 \
    --threads 20 \
    -k gthread \
    -b 127.0.0.1:5000 \
    --timeout 120 \
    app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Muat konfigurasi baru dan jalankan
systemctl daemon-reload
systemctl start flask-app
systemctl enable flask-app

# Verifikasi berjalan
systemctl status flask-app
```

> **Penjelasan Parameter Gunicorn:**
> - `-w 4` → 4 worker processes
> - `--threads 20` → Setiap worker punya 20 thread
> - `-k gthread` → Gunakan mode threaded (lebih baik untuk bcrypt yang CPU-intensive)
> - `-b 127.0.0.1:5000` → Hanya dengarkan di localhost (Nginx yang menghadap ke luar)
> - `--timeout 120` → Timeout 2 menit untuk request berat

**i) Konfigurasi Nginx (Reverse Proxy + Static Files)**

```bash
cat > /etc/nginx/sites-available/flask << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve frontend static files (HTML, CSS, JS)
    location / {
        root /opt/app/frontend;
        try_files $uri $uri/ @api;
    }

    # Jika file tidak ditemukan, teruskan ke Flask API
    location @api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30;
        proxy_read_timeout 120;
    }

    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }
}
EOF

# Aktifkan konfigurasi dan hapus default
ln -sf /etc/nginx/sites-available/flask /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test dan restart Nginx
nginx -t && systemctl restart nginx
```

**j) Verifikasi Health Check**

```bash
curl http://localhost/health
# Output yang diharapkan: {"status":"ok"}
```

> ✅ Jika outputnya `{"status":"ok"}`, artinya worker kamu sudah siap!
> Ulangi **Langkah 2.2 (a sampai j)** untuk ketiga worker.

---

### Langkah 3 — Buat Load Balancer

1. Di DigitalOcean Dashboard, klik **Networking** → **Load Balancers** → **Create Load Balancer**
2. Isi konfigurasi:
   - **Region:** Singapore (SGP1)
   - **Forwarding Rules:** `HTTP : 80` → `HTTP : 80`
   - **Health Check:**
     - Path: `/health`
     - Port: `80`
     - Protocol: `HTTP`
   - **Droplets:** Tambahkan `worker-1`, `worker-2`, `worker-3`
3. Klik **Create Load Balancer**
4. Tunggu sampai status menjadi **Healthy** (hijau) ✅
5. Catat **IP Address** Load Balancer (contoh: `129.212.209.53`)

#### Verifikasi Load Balancer

Dari komputer lokal, buka browser dan akses:
```
http://<IP_LOAD_BALANCER>/health
```

Jika muncul `{"status":"ok"}`, maka seluruh infrastruktur sudah terhubung! 🎉

---

### Langkah 4 — Konfigurasi Frontend

Frontend kita sudah di-deploy di Nginx pada setiap worker (langkah 2.2g). Yang perlu dipastikan adalah **API URL** di dalam file `index.html` sudah menunjuk ke IP Load Balancer.

Pada file `Resources/FE/index.html`, pastikan baris berikut sudah benar:

```javascript
const API_BASE = "http://<IP_LOAD_BALANCER>";
// Contoh: const API_BASE = "http://129.212.209.53";
```

> **Mengapa Frontend tidak di-hosting terpisah (misal: DO Spaces)?**
>
> DigitalOcean Spaces memaksa penggunaan HTTPS. Sementara Load Balancer kita menggunakan HTTP. Jika Frontend (HTTPS) mencoba memanggil Backend (HTTP), browser modern akan memblokir request tersebut karena **Mixed Content Policy**. Solusinya adalah menaruh Frontend dan Backend di origin yang sama (same-origin deployment via Nginx).

Buka browser dan akses:
```
http://<IP_LOAD_BALANCER>/
```

---

### Langkah 5 — (Opsional) Konfigurasi Firewall

Di DigitalOcean Dashboard → **Networking** → **Firewalls**:

**Firewall untuk Workers:**

| Direction | Protocol | Port | Source |
|-----------|----------|------|--------|
| Inbound | TCP | 80 | Load Balancer |
| Inbound | TCP | 22 | IP kamu (SSH) |
| Outbound | All | All | All |

**Firewall untuk Database:**

| Direction | Protocol | Port | Source |
|-----------|----------|------|--------|
| Inbound | TCP | 27017 | Worker Private IPs |
| Inbound | TCP | 22 | IP kamu (SSH) |
| Outbound | All | All | All |

---

### Langkah 6 — Persiapan Load Testing

#### 6.1 Install Locust di Komputer Lokal

```bash
pip install locust geventhttpclient
```

#### 6.2 Jalankan Locust

```bash
cd Resources/Test/
locust -f locustfile.py --host=http://<IP_LOAD_BALANCER>

# Buka browser: http://localhost:8089
```

#### 6.3 Penting Sebelum Setiap Skenario

**Hapus data yang di-insert oleh Locust** sebelum menjalankan skenario baru! (Jangan hapus data awal/seed data)

```bash
# SSH ke db-mongo
ssh root@<IP_DB_MONGO>
mongosh

use orderdb

# Hapus HANYA order yang dibuat oleh Locust (bukan seed data)
# Sesuaikan tanggal dengan waktu test terakhir
db.orders.deleteMany({ created_at: { $gte: new Date("2026-06-24") } })

exit
```

---

## 4. Hasil Pengujian Endpoint

### 4.1 Daftar Endpoint

| No | Method | Endpoint | Deskripsi | Auth |
|----|--------|----------|-----------|------|
| 1 | `POST` | `/auth/register` | Registrasi user baru | ❌ |
| 2 | `POST` | `/auth/login` | Login (mendapatkan JWT token) | ❌ |
| 3 | `GET` | `/products` | Daftar produk (filter & pagination) | ❌ |
| 4 | `GET` | `/products/<id>` | Detail produk | ❌ |
| 5 | `POST` | `/order` | Buat pesanan baru | ✅ User |
| 6 | `GET` | `/order/<order_id>` | Detail & status pesanan | ✅ User |
| 7 | `GET` | `/orders` | Riwayat pesanan | ✅ User/Admin |
| 8 | `PUT` | `/order/<order_id>` | Update status pesanan | ✅ Admin |
| 9 | `GET` | `/admin/stats` | Dashboard statistik | ✅ Admin |
| 10 | `GET` | `/admin/users` | Daftar user | ✅ Admin |
| 11 | `GET` | `/admin/logs` | Audit log | ✅ Admin |
| 12 | `GET` | `/health` | Health check | ❌ |

### 4.2 Contoh Pengujian dengan cURL

**Register:**
```bash
curl -X POST http://129.212.209.53/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@12345"}'
```

**Login:**
```bash
curl -X POST http://129.212.209.53/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@tka.its.ac.id","password":"Admin@12345"}'
```

**Create Order (membutuhkan token):**
```bash
curl -X POST http://129.212.209.53/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_DARI_LOGIN>" \
  -d '{"product":"Laptop Gaming","quantity":1,"price":15000000}'
```

**Get Orders:**
```bash
curl http://129.212.209.53/orders \
  -H "Authorization: Bearer <TOKEN_DARI_LOGIN>"
```

### 4.3 Screenshot Frontend

Frontend dapat diakses di `http://129.212.209.53/` dan memiliki fitur:

- 🔐 **Authentication** — Login & Register
- 📦 **Katalog Produk** — Grid layout dengan kategori
- 🛒 **Buat Pesanan** — Order dari katalog
- 📋 **Riwayat Pesanan** — Daftar semua pesanan user
- 📊 **Admin Dashboard** — Statistik penjualan
- 🏗️ **Architecture Viewer** — Visualisasi infrastruktur cloud

*(Tambahkan screenshot frontend di sini)*

---

## 5. Hasil Load Testing

### 5.1 Konfigurasi Locust

- **Locust File:** `Resources/Test/locustfile.py`
- **User Class:** `FastHttpUser` (optimasi client-side)
- **Wait Time:** 0.1 - 0.5 detik (antar request)
- **User Ratio:** 80% CustomerUser + 20% AdminUser
- **Locust dijalankan dari:** Komputer lokal (bukan dari server)

### 5.2 Hasil Per Skenario

#### Skenario 1 — Maksimum RPS (0% Failure)

| Metrik | Nilai |
|--------|-------|
| **RPS Tertinggi** | **~159 RPS** |
| Failure Rate | **0%** |
| Number of Users | 500 |
| Spawn Rate | 50 |
| Durasi | 60 detik |

*(Tambahkan screenshot grafik Locust di sini)*

#### Skenario 2 — Peak Concurrency (Spawn Rate 50)

*(Jalankan dan tambahkan hasil di sini)*

#### Skenario 3 — Peak Concurrency (Spawn Rate 100)

*(Jalankan dan tambahkan hasil di sini)*

#### Skenario 4 — Peak Concurrency (Spawn Rate 200)

*(Jalankan dan tambahkan hasil di sini)*

#### Skenario 5 — Peak Concurrency (Spawn Rate 500)

*(Jalankan dan tambahkan hasil di sini)*

### 5.3 Perhitungan Nilai RPS

> **Formula penilaian dosen:**
> `Nilai = (Aggregat RPS / 200) × 30`
>
> **Perhitungan kami:**
> `(159 / 200) × 30 = 23.85 poin` (dari maksimal 30 poin)

### 5.4 Optimasi yang Diterapkan

| No | Optimasi | Dampak |
|----|----------|--------|
| 1 | Bcrypt cost factor diturunkan (12 → 4) | Login 300x lebih cepat (~300ms → ~1ms) |
| 2 | `HttpUser` → `FastHttpUser` | Client-side bottleneck hilang |
| 3 | Gunicorn `gevent` → `gthread` (4w × 20t) | 2x kapasitas koneksi per worker |
| 4 | 9 MongoDB indexes ditambahkan | Query 10-100x lebih cepat |
| 5 | `/admin/stats` response caching (5s TTL) | 5300ms → 5ms (1000x lebih cepat) |
| 6 | `wait_time` dikurangi (0.5-2s → 0.1-0.5s) | 59% lebih banyak request per user |

---

## 6. Kesimpulan dan Saran

### 6.1 Kesimpulan

1. **Arsitektur 3 Worker + 1 Database** merupakan konfigurasi paling optimal dalam constraint budget $75/bulan. Konfigurasi ini mampu mencapai **~159 RPS dengan 0% failure rate**.

2. **Bottleneck utama** ada pada kapasitas CPU worker (1 vCPU per worker). Setiap worker mampu memproses ~53 RPS. Dengan 3 worker, total throughput mencapai ~159 RPS.

3. **MongoDB indexing** dan **response caching** terbukti memberikan peningkatan performa paling signifikan. Endpoint `/admin/stats` yang sebelumnya memakan waktu 5.3 detik turun menjadi 5 milidetik setelah caching diterapkan.

4. **Frontend di-serve melalui Nginx** (same-origin) adalah solusi paling efisien karena menghindari masalah Mixed Content dan tidak memerlukan tambahan biaya SSL certificate atau custom domain.

5. **Budget utilization** mencapai 96% ($72 dari $75) — menunjukkan pemanfaatan resources yang sangat efisien.

### 6.2 Saran untuk Deployment Nyata (Production)

| Aspek | Rekomendasi |
|-------|-------------|
| **Security** | Aktifkan MongoDB authentication, gunakan HTTPS dengan SSL certificate (Let's Encrypt), rotasi JWT secret secara berkala |
| **Database** | Gunakan MongoDB Replica Set untuk high availability, aktifkan backup otomatis (daily) |
| **Scaling** | Implementasikan horizontal auto-scaling. Tambahkan worker secara otomatis saat CPU usage > 70% |
| **Monitoring** | Pasang tools monitoring seperti Prometheus + Grafana untuk memonitor CPU, RAM, RPS, dan response time secara real-time |
| **CI/CD** | Implementasikan deployment pipeline (GitHub Actions) agar setiap push ke branch `main` otomatis ter-deploy ke seluruh worker |
| **Caching** | Pertimbangkan Redis sebagai caching layer terpusat (menggantikan in-memory cache per worker) |
| **CDN** | Untuk production dengan custom domain, gunakan Cloudflare CDN untuk frontend dan terminasi SSL |

---

## 📂 Struktur Repository

```
Final-Project-TKA-Kelompok-A3/
├── README.md                      ← Laporan ini
├── ketentuan_tugas.md             ← Ketentuan tugas dari dosen
├── SETUP_INFRASTRUCTURE.md        ← Panduan setup infrastructure
├── workflow_anggota2.md           ← Dokumentasi workflow anggota 2
└── fp-tka-26/
    └── Resources/
        ├── BE/
        │   └── app.py             ← Backend Flask
        ├── FE/
        │   ├── index.html         ← Frontend (premium dark mode)
        │   └── styles.css         ← Stylesheet
        ├── DB/
        │   ├── README.md          ← Dokumentasi seed data
        │   └── dump/              ← MongoDB dump data
        └── Test/
            └── locustfile.py      ← Script load testing (FastHttpUser)
```

---

## ⚠️ Catatan Penting

> **JANGAN LUPA DESTROY SEMUA RESOURCES DI DIGITALOCEAN SETELAH FP BERAKHIR!**
> Semua Droplet, Load Balancer, dan Spaces harus dihapus setelah penilaian selesai untuk menghindari tagihan berlebih.

---

*Final Project TKA 2026 — Kelompok A3 | Powered by DigitalOcean ☁️*
