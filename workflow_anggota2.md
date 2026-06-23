# Sub-Tim B (Backend, Database Optimization, Frontend Deployment)

## Arsitektur Infrastruktur

Saat ini tersedia:

| VM                        | Fungsi                      |
| ------------------------- | --------------------------- |
| VM 1                      | Load Balancer (Nginx)       |
| VM 2                      | Worker-1 (Flask + Gunicorn) |
| VM 3                      | Worker-2 (Flask + Gunicorn) |
| VM 4                      | Worker-3 (Flask + Gunicorn) |
| VM 5                      | MongoDB Database Server     |
| DigitalOcean Spaces + CDN | Frontend Hosting            |

---

# Tugas Utama Anggota 2

1. Deploy Backend Flask ke seluruh Worker.
2. Setup Gunicorn.
3. Setup MongoDB dan Index.
4. Deploy Frontend.
5. Integrasi Frontend ke Load Balancer.
6. Menyiapkan environment untuk Load Testing.

---

# Bagian A — Backend Deployment

## VM yang Digunakan

Masuk ke:

```bash
worker-1
worker-2
worker-3
```

---

## 1. Install Dependency

```bash
apt update
apt install python3-pip python3-venv nginx -y
```

---

## 2. Clone atau Copy Project

Contoh:

```bash
mkdir -p /opt/app
cd /opt/app
```

Copy:

```text
app.py
requirements.txt
.env
```

ke seluruh worker.

---

## 3. Buat Virtual Environment

```bash
cd /opt/app

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt
```

---

## 4. Konfigurasi MongoDB

File:

```bash
/opt/app/.env
```

Isi:

```env
MONGO_URI=mongodb://PRIVATE_IP_DB:27017/?maxPoolSize=50&connectTimeoutMS=5000
```

Contoh:

```env
MONGO_URI=mongodb://10.104.0.2:27017/?maxPoolSize=50&connectTimeoutMS=5000
```

---

## 5. Jalankan Gunicorn

Masuk:

```bash
cd /opt/app

source venv/bin/activate
```

Jalankan:

```bash
gunicorn \
-w 4 \
-b 0.0.0.0:5000 \
--timeout 120 \
--keep-alive 5 \
app:app
```

Verifikasi:

```bash
ps aux | grep gunicorn
```

---

## 6. Health Check

```bash
curl http://localhost:5000/health
```

Output:

```json
{
  "status":"ok"
}
```

---

# Bagian B — MongoDB Optimization

## VM yang Digunakan

Masuk ke:

```bash
db-mongo
```

---

## 1. Login MongoDB

```bash
mongosh
```

---

## 2. Gunakan Database

```javascript
use orderdb
```

---

## 3. Buat Admin

Password hash dibuat dengan:

```python
import bcrypt

bcrypt.hashpw(
    "Admin@12345".encode(),
    bcrypt.gensalt()
).decode()
```

Insert:

```javascript
db.users.insertOne({
  name:"Admin 1",
  email:"admin1@tka.its.ac.id",
  password:"HASH",
  role:"admin",
  is_active:true,
  created_at:new Date().toISOString(),
  updated_at:new Date().toISOString()
})
```

---

## 4. Buat Index

### Users

```javascript
db.users.createIndex(
  { email:1 },
  { unique:true }
)
```

### Orders

```javascript
db.orders.createIndex(
  { order_id:1 }
)

db.orders.createIndex(
  { created_at:-1 }
)
```

---

## 5. Verifikasi Index

```javascript
db.users.getIndexes()

db.orders.getIndexes()
```

---

# Bagian C — Load Balancer

## VM yang Digunakan

Masuk ke:

```bash
load-balancer
```

---

## File Konfigurasi

```bash
/etc/nginx/sites-available/default
```

---

## Konfigurasi Upstream

```nginx
upstream backend {
    least_conn;

    server PRIVATE_IP_WORKER1:5000;
    server PRIVATE_IP_WORKER2:5000;
    server PRIVATE_IP_WORKER3:5000;

    keepalive 32;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Reload:

```bash
nginx -t

systemctl restart nginx
```

---

# Bagian D — Frontend Deployment

## Kenapa Tidak Deploy di VM Lagi?

Karena:

```text
1 VM Load Balancer
3 VM Backend
1 VM MongoDB
```

Sudah memenuhi kebutuhan.

Menambahkan VM Frontend hanya menambah biaya.

Cara yang lebih baik:

```text
DigitalOcean Spaces + CDN
```

---

# Langkah Frontend Menggunakan DigitalOcean Spaces

## 1. Buat Space

DigitalOcean Dashboard

→ Spaces Object Storage

→ Create Space

Contoh:

```text
fp-tka-frontend
```

Pilih:

```text
Enable CDN
```

---

## 2. Upload File Frontend

Upload:

```text
index.html
styles.css
script.js
assets/
```

---

## 3. Set Public Access

Spaces

→ Settings

→ Public Access

Aktifkan:

```text
Public
```

---

## 4. Aktifkan CDN

Spaces

→ Enable CDN

Akan muncul URL seperti:

```text
https://fp-tka-frontend.ams3.cdn.digitaloceanspaces.com
```

---

## 5. Integrasi API

Pada:

```javascript
script.js
```

ubah:

```javascript
const API_URL =
"http://localhost:5000";
```

menjadi:

```javascript
const API_URL =
"http://PUBLIC_IP_LOAD_BALANCER";
```

Contoh:

```javascript
const API_URL =
"http://143.xxx.xxx.xxx";
```

atau:

```javascript
const API_URL =
"https://domain-kelompok.com";
```

---

# Bagian E — Pengujian Frontend

Buka:

```text
https://cdn-url/index.html
```

Lakukan pengujian:

### Register

```text
POST /auth/register
```

### Login

```text
POST /auth/login
```

### Produk

```text
GET /products
```

### Order

```text
POST /orders
```

Pastikan seluruh request menuju:

```text
Load Balancer
```

bukan langsung ke Worker.

---

# Bagian F — Persiapan Load Testing

## Isi Data Dummy

### Products

Target:

```text
50–100 Produk
```

### Orders

Target:

```text
500–1000 Order
```

Tujuan:

```text
GET /orders
```

memiliki data yang cukup saat diuji.

---

## Monitoring

Setiap skenario Locust:

### Worker

```bash
htop
```

### MongoDB

```bash
htop
```

### Load Balancer

```bash
htop
```

Screenshot:

```text
CPU
RAM
Network
```

untuk laporan.

---

# Checklist Sub-Tim B

## Backend

* [x] Flask berjalan
* [x] Gunicorn berjalan
* [x] Worker terhubung ke MongoDB

## Database

* [x] Database orderdb
* [x] Users collection
* [x] Products collection
* [x] Orders collection
* [x] Audit logs collection
* [x] Email index
* [x] Order ID index
* [x] Created_at index

## Frontend

* [ ] Spaces dibuat
* [ ] CDN aktif
* [ ] Frontend upload
* [ ] API terhubung ke Load Balancer

## Load Testing

* [ ] Locust berjalan
* [ ] Target 200 RPS tercapai
* [ ] Failure Rate 0%
* [ ] Screenshot resource lengkap
