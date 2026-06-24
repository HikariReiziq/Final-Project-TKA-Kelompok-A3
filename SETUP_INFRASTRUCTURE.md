# Panduan Setup Cloud Infrastructure — DigitalOcean

## Ringkasan Arsitektur

Berdasarkan constraint budget **≤ $75/bulan** dan tujuan **memaksimalkan RPS**, arsitektur yang direkomendasikan:

```
                        ┌─────────────────┐
                        │   Load Balancer  │  (DigitalOcean LB - $12/bln)
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼───────┐ ┌───────▼────────┐ ┌──────▼─────────┐
     │  Worker 1       │ │  Worker 2       │ │  Worker 3       │
     │  Flask+Gunicorn │ │  Flask+Gunicorn │ │  Flask+Gunicorn │
     │  1vCPU / 1GB    │ │  1vCPU / 1GB    │ │  1vCPU / 1GB    │
     │  ($6/bln)       │ │  ($6/bln)       │ │  ($6/bln)       │
     └────────┬────────┘ └───────┬────────┘ └──────┬─────────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                        ┌────────▼────────┐
                        │   MongoDB        │
                        │   2vCPU / 4GB    │
                        │   ($24/bln)      │
                        └─────────────────┘

    Frontend: DigitalOcean Spaces CDN atau Droplet kecil
```

## Tabel Spesifikasi & Biaya

| Komponen | Spesifikasi | Harga/bulan |
|----------|-------------|-------------|
| Load Balancer | DigitalOcean LB | $12 |
| Worker 1 (Backend) | 1 vCPU, 1 GB RAM | $6 |
| Worker 2 (Backend) | 1 vCPU, 1 GB RAM | $6 |
| Worker 3 (Backend) | 1 vCPU, 1 GB RAM | $6 |
| Database (MongoDB) | 2 vCPU, 4 GB RAM | $24 |
| Frontend (Spaces CDN) | Static hosting | $5 |
| **Total** | | **$59/bulan** |

> Sisa budget ~$16 bisa dipakai untuk scaling horizontal jika perlu (tambah 1-2 worker lagi).

---

## Step-by-Step Setup

### 1. Buat Droplet untuk MongoDB (Database Server)

Di DigitalOcean Console:
- **Image:** Ubuntu 22.04 LTS
- **Plan:** Regular, 2 vCPU / 4 GB RAM ($24/mo)
- **Region:** Singapore (sgp1) — terdekat dari Indonesia
- **Hostname:** `db-mongo`

Setelah droplet aktif, SSH ke dalamnya:

```bash
ssh root@<IP_DB_MONGO>

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update && apt install -y mongodb-org

# Konfigurasi MongoDB untuk menerima koneksi dari luar
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf

# Start & enable
systemctl start mongod
systemctl enable mongod

# Restore dump data
apt install -y mongodb-database-tools
# Upload folder dump ke server, lalu:
mongorestore --drop dump/
```

#### Optimasi MongoDB

```bash
# Masuk mongo shell
mongosh

# Buat index untuk performa query
use orderdb
db.orders.createIndex({ "created_at": -1 })
db.orders.createIndex({ "order_id": 1 }, { unique: true })
db.orders.createIndex({ "user_id": 1, "created_at": -1 })
db.orders.createIndex({ "status": 1 })
db.products.createIndex({ "category": 1, "is_active": 1 })
db.products.createIndex({ "name": "text" })
db.users.createIndex({ "email": 1 }, { unique: true })
```

---

### 2. Buat Droplet untuk Backend Workers (x3)

Di DigitalOcean Console (ulangi 3x):
- **Image:** Ubuntu 22.04 LTS
- **Plan:** Regular, 1 vCPU / 1 GB RAM ($6/mo)
- **Region:** Singapore (sgp1)
- **Hostname:** `worker-1`, `worker-2`, `worker-3`

#### Setup di setiap worker:

```bash
ssh root@<IP_WORKER>

# Install dependencies
apt update && apt install -y python3-pip python3-venv nginx

# Setup aplikasi
mkdir -p /opt/app && cd /opt/app
python3 -m venv venv
source venv/bin/activate

# Upload app.py dan requirements.txt, lalu:
pip install -r requirements.txt

# Set environment variables
cat > /opt/app/.env << 'EOF'
MONGO_URI=mongodb://<IP_DB_MONGO>:27017/
JWT_SECRET=secret-kunci-acak-yang-panjang-dan-aman
JWT_EXPIRES=86400
EOF
```

#### Buat systemd service:

```bash
cat > /etc/systemd/system/flask-app.service << 'EOF'
[Unit]
Description=Flask Order Service
After=network.target

[Service]
User=root
WorkingDirectory=/opt/app
EnvironmentFile=/opt/app/.env
ExecStart=/opt/app/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 --keep-alive 5 app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start flask-app
systemctl enable flask-app
```

#### Konfigurasi Nginx sebagai reverse proxy:

```bash
cat > /etc/nginx/sites-available/flask << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
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

ln -sf /etc/nginx/sites-available/flask /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

---

### 3. Buat Load Balancer

Di DigitalOcean Console:
1. **Networking → Load Balancers → Create**
2. Region: **Singapore (sgp1)**
3. Forwarding Rules: `HTTP 80 → HTTP 80`
4. Health Check:
   - Path: `/health`
   - Port: `80`
   - Protocol: `HTTP`
5. Algorithm: awalnya **Least Connection** tapi DigitalOcean tidak mendukung perubahan algoritma
6. Tambahkan ketiga worker droplets sebagai backend

---

### 4. Deploy Frontend

#### Opsi A — DigitalOcean Spaces (rekomendasi, static hosting + CDN):

```bash
# Upload index.html dan styles.css ke Spaces bucket
# Aktifkan CDN di Spaces settings
# Edit API_BASE di index.html ke IP Load Balancer:
# const API_BASE = "http://<IP_LOAD_BALANCER>";
```

#### Opsi B — Serve dari salah satu worker via Nginx:

```bash
# Di worker-1, tambahkan location block:
mkdir -p /var/www/frontend
# Upload index.html dan styles.css ke /var/www/frontend/

# Tambah di nginx config:
location /frontend {
    alias /var/www/frontend;
    index index.html;
}
```

---

### 5. Konfigurasi Firewall

Di DigitalOcean Console → Networking → Firewalls:

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

#### Gunakan VPC Private Network

Agar komunikasi worker ↔ database lewat jaringan internal (lebih cepat, lebih aman):

```bash
# Di setiap worker, ubah MONGO_URI ke private IP:
MONGO_URI=mongodb://<PRIVATE_IP_DB>:27017/
```

---

## Tips Optimasi untuk Maksimalkan RPS

### 1. Gunicorn Workers

Rumus: `(2 × CPU) + 1`. Untuk 1 vCPU = 3 workers. Karena ini I/O bound (MongoDB), bisa naikkan ke 4-5.

### 2. MongoDB Connection Pool

Tambahkan di `MONGO_URI`:

```
mongodb://<IP>:27017/?maxPoolSize=50&connectTimeoutMS=5000
```

### 3. Nginx Tuning

Di setiap worker, edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
events {
    worker_connections 2048;
}
http {
    keepalive_timeout 65;
    # ...
}
```

### 4. MongoDB Storage Tuning

Edit `/etc/mongod.conf`:

```yaml
storage:
  journal:
    enabled: false  # Hanya untuk testing, BUKAN production!
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2.5  # ~60% dari RAM
```

### 5. Monitoring saat Load Test

```bash
# Di setiap server, jalankan:
htop
# Atau untuk log real-time:
vmstat 1
iostat -x 1
```

---

## Checklist Sebelum Load Testing

- [ ] Semua endpoint bisa diakses via Load Balancer IP
- [ ] `GET /health` return `200 OK` di semua workers
- [ ] MongoDB indexes sudah dibuat
- [ ] Database dump sudah di-restore
- [ ] Frontend bisa diakses dan terhubung ke backend
- [ ] Firewall rules sudah applied
- [ ] Locust dijalankan dari **komputer berbeda** (bukan dari server)

---

## Jalankan Locust

Dari komputer lokal:

```bash
pip install locust
locust -f locustfile.py --host=http://<IP_LOAD_BALANCER>
# Buka browser: http://localhost:8089
```

---

## Catatan Penting

> **JANGAN LUPA DESTROY SEMUA RESOURCES SETELAH FP BERAKHIR** agar tidak terkena charge tambahan.
