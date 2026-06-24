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

# 3. Implementation

## 3.1 Infrastructure Provisioning

Implementasi dilakukan menggunakan platform DigitalOcean dengan region Singapore (SGP1) karena memiliki latency yang rendah untuk pengguna di Indonesia.

Infrastruktur yang dibuat terdiri dari:

* 1 DigitalOcean Load Balancer
* 3 Backend Worker Server
* 1 MongoDB Database Server
* 1 DigitalOcean Spaces CDN untuk frontend
* VPC Private Network
* Firewall Rules

### Hasil Provisioning

![Droplets](result/do_droplets.png)

**Gambar 2.** Seluruh resource yang digunakan pada DigitalOcean.

---

## 3.2 MongoDB Server Deployment

### Pembuatan Database Server

Server database dibuat menggunakan spesifikasi:

| Parameter | Value            |
| --------- | ---------------- |
| OS        | Ubuntu 22.04 LTS |
| CPU       | 2 vCPU           |
| RAM       | 4 GB             |
| Hostname  | db-mongo         |

### Instalasi MongoDB

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

apt update
apt install -y mongodb-org
```

### Konfigurasi MongoDB

MongoDB dikonfigurasi agar dapat menerima koneksi dari backend worker melalui private network.

```yaml
net:
  port: 27017
  bindIp: 0.0.0.0
```

### Menjalankan MongoDB

```bash
systemctl start mongod
systemctl enable mongod
```

### Verifikasi MongoDB

```bash
systemctl status mongod
```

![MongoDB Status](result/mongodb_status.png)

**Gambar 3.** Status layanan MongoDB.

---

## 3.3 MongoDB Optimization

Untuk meningkatkan performa query, beberapa index ditambahkan pada collection yang digunakan aplikasi.

```javascript
db.orders.createIndex({ "created_at": -1 })
db.orders.createIndex({ "order_id": 1 }, { unique: true })
db.orders.createIndex({ "status": 1 })
```

Index tersebut membantu mempercepat proses pencarian order, sorting riwayat transaksi, dan update status pesanan.

![MongoDB Index](result/mongodb_index.png)

**Gambar 4.** Pembuatan index pada MongoDB.

---

## 3.4 Backend Deployment

### Spesifikasi Worker

Setiap backend worker menggunakan:

| Parameter | Value            |
| --------- | ---------------- |
| OS        | Ubuntu 22.04 LTS |
| CPU       | 1 vCPU           |
| RAM       | 1 GB             |

Terdapat tiga backend worker:

* worker-1
* worker-2
* worker-3

### Instalasi Dependency

```bash
apt update
apt install -y python3-pip python3-venv nginx
```

### Pembuatan Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### Instalasi Library

```bash
pip install -r requirements.txt
```

### Konfigurasi Environment Variable

```env
MONGO_URI=mongodb://<PRIVATE_IP_DB>:27017/
JWT_SECRET=secret-key
```

![Backend Setup](result/backend_setup.png)

**Gambar 5.** Proses instalasi backend.

---

## 3.5 Gunicorn Configuration

Gunicorn digunakan sebagai WSGI server untuk menjalankan aplikasi Flask.

### Konfigurasi Service

```ini
[Unit]
Description=Flask Order Service

[Service]
WorkingDirectory=/opt/app
ExecStart=/opt/app/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app

[Install]
WantedBy=multi-user.target
```

### Menjalankan Service

```bash
systemctl daemon-reload
systemctl start flask-app
systemctl enable flask-app
```

### Verifikasi Service

```bash
systemctl status flask-app
```

![Gunicorn Status](result/gunicorn_status.png)

**Gambar 6.** Status service Gunicorn.

---

## 3.6 Nginx Reverse Proxy Configuration

Nginx digunakan sebagai reverse proxy pada setiap backend worker.

### Konfigurasi Nginx

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}
```

### Restart Nginx

```bash
nginx -t
systemctl restart nginx
```

### Verifikasi Nginx

```bash
systemctl status nginx
```

![Nginx Status](result/nginx_status.png)

**Gambar 7.** Status layanan Nginx.

---

## 3.7 Load Balancer Configuration

DigitalOcean Load Balancer digunakan untuk mendistribusikan request ke tiga backend worker.

### Konfigurasi

| Parameter         | Value     |
| ----------------- | --------- |
| Protocol          | HTTP      |
| Port              | 80        |
| Health Check Path | /health   |
| Region            | Singapore |

### Backend Pool

* worker-1
* worker-2
* worker-3

![Load Balancer](result/load_balancer.png)

**Gambar 8.** Konfigurasi DigitalOcean Load Balancer.

---

## 3.8 Frontend Deployment

Frontend di-deploy menggunakan DigitalOcean Spaces CDN sebagai static hosting.

File yang digunakan:

* index.html
* styles.css

Frontend dikonfigurasi agar mengakses endpoint API melalui alamat Load Balancer.

```javascript
const API_BASE = "http://<LOAD_BALANCER_IP>";
```

![Frontend Deploy](result/frontend_deploy.png)

**Gambar 9.** Deployment frontend pada DigitalOcean Spaces.

---

## 3.9 Firewall Configuration

Firewall digunakan untuk membatasi akses antar komponen sistem.

### Worker Firewall Rules

| Protocol | Port | Source        |
| -------- | ---- | ------------- |
| TCP      | 80   | Load Balancer |
| TCP      | 22   | Administrator |

### Database Firewall Rules

| Protocol | Port  | Source          |
| -------- | ----- | --------------- |
| TCP      | 27017 | Backend Workers |
| TCP      | 22    | Administrator   |

![Firewall Rules](result/firewall_rules.png)

**Gambar 10.** Konfigurasi firewall.

---

## 3.10 Infrastructure Verification

Setelah seluruh konfigurasi selesai dilakukan, dilakukan pengujian konektivitas antar komponen untuk memastikan sistem dapat berjalan dengan baik.

Verifikasi yang dilakukan meliputi:

* Koneksi backend ke MongoDB
* Koneksi frontend ke backend
* Health check Load Balancer
* Akses endpoint melalui public IP Load Balancer

Seluruh komponen berhasil berjalan dan saling terhubung sesuai rancangan arsitektur yang telah dibuat.

![Verification](result/verification.png)

**Gambar 11.** Verifikasi deployment seluruh komponen.

# 4. Endpoint Testing

## 4.1 Testing Environment

Pengujian endpoint dilakukan setelah seluruh komponen sistem berhasil di-deploy pada DigitalOcean. Pengujian dilakukan menggunakan Postman dengan mengakses endpoint melalui alamat DigitalOcean Load Balancer.

Tujuan pengujian adalah memastikan seluruh fitur utama Order Processing Service berjalan sesuai spesifikasi yang diberikan pada soal.

Base URL yang digunakan:

```text
http://<LOAD_BALANCER_IP>
```

---

## 4.2 Create Order Endpoint

### Endpoint

```http
POST /order
```

### Request Body

```json
{
    "product": "Laptop",
    "quantity": 2,
    "price": 150000
}
```

### Expected Result

Sistem berhasil membuat pesanan baru dan mengembalikan informasi order yang telah dibuat dengan status awal `pending`.

### Screenshot

![POST Order](result/post_order.png)

**Gambar 12.** Hasil pengujian endpoint POST /order.

### Analysis

Endpoint berhasil membuat data pesanan baru pada MongoDB dan mengembalikan response dengan status HTTP 201 Created sesuai spesifikasi aplikasi.

---

## 4.3 Get Order Status Endpoint

### Endpoint

```http
GET /order/<order_id>
```

### Expected Result

Sistem menampilkan informasi detail pesanan berdasarkan order_id yang diberikan.

### Screenshot

![GET Order](result/get_order.png)

**Gambar 13.** Hasil pengujian endpoint GET /order/{order_id}.

### Analysis

Endpoint berhasil mengambil data pesanan dari MongoDB dan mengembalikan seluruh informasi yang tersimpan pada database.

---

## 4.4 Get Order History Endpoint

### Endpoint

```http
GET /orders
```

### Expected Result

Sistem menampilkan seluruh riwayat pesanan yang tersimpan pada database.

### Screenshot

![GET Orders](result/get_orders.png)

**Gambar 14.** Hasil pengujian endpoint GET /orders.

### Analysis

Endpoint berhasil menampilkan daftar seluruh pesanan yang tersimpan pada database dan mengurutkannya berdasarkan waktu pembuatan.

---

## 4.5 Update Order Status Endpoint

### Endpoint

```http
PUT /order/<order_id>
```

### Request Body

```json
{
    "status": "completed"
}
```

### Expected Result

Status pesanan berhasil diperbarui dari `pending` menjadi `completed`.

### Screenshot

![PUT Order](result/put_order.png)

**Gambar 15.** Hasil pengujian endpoint PUT /order/{order_id}.

### Analysis

Endpoint berhasil melakukan pembaruan status pesanan pada MongoDB dan mengembalikan response sesuai spesifikasi aplikasi.

---

## 4.6 Frontend Testing

Selain pengujian API menggunakan Postman, dilakukan juga pengujian terhadap antarmuka web yang telah di-deploy pada DigitalOcean Spaces CDN.

Fitur yang diuji meliputi:

* Pembuatan pesanan baru
* Pencarian status pesanan
* Penampilan riwayat transaksi
* Pembaruan status pesanan

### Screenshot

![Frontend](result/frontend.png)

**Gambar 16.** Tampilan frontend aplikasi Order Processing Service.

### Analysis

Frontend berhasil berkomunikasi dengan backend melalui DigitalOcean Load Balancer dan seluruh fitur dapat digunakan dengan baik tanpa ditemukan error selama proses pengujian.

---

## 4.7 Endpoint Testing Summary

| Endpoint    | Method | Status  |
| ----------- | ------ | ------- |
| /order      | POST   | Success |
| /order/{id} | GET    | Success |
| /orders     | GET    | Success |
| /order/{id} | PUT    | Success |

Berdasarkan hasil pengujian, seluruh endpoint berhasil berjalan sesuai spesifikasi dan dapat diakses melalui infrastruktur cloud yang telah dibangun.


