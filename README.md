# 🎵 Frekans - Müzik Streaming Platformu

Node.js + Express + MSSQL backend, vanilla JS frontend.

## 🚀 Format Sonrası Hızlı Kurulum

```bash
# 1. Repo'yu klonla
git clone https://github.com/KULLANICI_ADIN/frekans.git
cd frekans

# 2. Bağımlılıkları yükle
npm install

# 3. .env dosyasını oluştur ve SQL Server bilgilerini gir
copy .env.example .env
# .env dosyasını aç ve DB_SERVER satırını kendi sunucuna göre düzenle

# 4. Veritabanını otomatik kur (tablo + veri + SP + trigger HEPSİ)
npm run setup

# 5. (Opsiyonel) 50K+ test verisi yükle
cd database/seeder
npm install
npm run seed
cd ../..

# 6. Sunucuyu başlat
npm start
```

**Tek komutla veritabanı kurulumu yapılır:** `npm run setup`
- FrekansDB veritabanını oluşturur
- 6 şema (Identity, Music, Interaction, Feedback, Analysis, Audit)
- Tüm tabloları, indeksleri, view'ları oluşturur
- Stored procedure'leri ve trigger'ları kurar
- Örnek verileri ekler
- `nodeapp` SQL kullanıcısını oluşturur ve yetkilendirir

### .env Ayarları

```env
# Named instance (SSMS'deki sunucu adını aynen yaz)
DB_SERVER=(local)\MSSQLSERVER_2025

# Varsayılan instance (port ile)
DB_SERVER=localhost
DB_PORT=1433

# Windows Auth = DB_USER satırını yorum yapılı bırak
# SQL Auth = DB_USER ve DB_PASSWORD'u aç
# DB_USER=sa
# DB_PASSWORD=SifrenBuraya
```

## 📡 API Endpoints

### 1. Şarkı Listesi (Pagination)
```http
GET /api/tracks?page=1&limit=20&genre=Trap
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "TrackID": 1,
      "Title": "Summer Vibes",
      "AudioUrl": "https://...",
      "Duration": 180,
      "ArtistName": "DJ Mike",
      "TotalPlays": 1250,
      "TotalLikes": 340
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalRecords": 50000,
    "totalPages": 2500
  }
}
```

### 2. Şarkı Arama
```http
GET /api/search?q=trap&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "searchQuery": "trap",
  "resultCount": 8
}
```

### 3. Beğeni Toggle (Like/Unlike)
```http
POST /api/like
Content-Type: application/json

{
  "userId": 5,
  "trackId": 42
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trackId": 42,
    "userId": 5,
    "isLiked": true,
    "action": "LIKED",
    "totalLikes": 125
  }
}
```

### 4. Şarkı Yükleme
```http
POST /api/tracks/upload
Content-Type: application/json

{
  "userId": 1,
  "title": "New Track",
  "genreId": 2,
  "albumId": null,
  "audioUrl": "https://cdn.example.com/track.mp3",
  "durationSeconds": 180
}
```

### 5. Trend Analizi (Cursor Prosedürü)
```http
GET /api/stats/trend
```

**Response:**
```json
{
  "success": true,
  "message": "Trend analizi tamamlandı.",
  "data": {
    "topArtists": [
      {
        "Sıra": 1,
        "Sanatçı": "DJ Mike",
        "Toplam Dinlenme": 15000,
        "Toplam Beğeni": 2500,
        "Trend Skoru": 27500
      }
    ]
  }
}
```

## 🔒 Güvenlik

- **SQL Injection Koruması:** Tüm sorgularda parametreli input kullanımı
- **Prepared Statements:** `request.input()` ile güvenli parametre binding
- **CORS:** Farklı origin'lerden gelen isteklere izin

## 🛠️ Teknolojiler

- **Express.js** - Web framework
- **mssql** - SQL Server driver
- **dotenv** - Ortam değişkenleri
- **cors** - Cross-Origin Resource Sharing

## 📊 Performans

- **Connection Pooling:** Max 10 bağlantı
- **Index Kullanımı:** `WITH (INDEX(IX_Tracks_Title))` hint'i
- **View Kullanımı:** Karmaşık JOIN'ler için `vw_TrackCardDetails`
- **Stored Procedures:** Güvenli ve optimize edilmiş sorgular

## 🧪 Test

```bash
# Health check
curl http://localhost:3000/health

# Şarkı listesi
curl "http://localhost:3000/api/tracks?page=1&limit=5"

# Arama
curl "http://localhost:3000/api/search?q=trap"

# Trend analizi
curl http://localhost:3000/api/stats/trend
```

## 📝 Notlar

- Veritabanı bağlantısı başlatma sırasında kurulur (Connection Pool)
- Graceful shutdown desteklenir (CTRL+C ile temiz kapatma)
- Tüm hatalar console'a loglanır
- 404 ve 500 hataları JSON formatında döner
