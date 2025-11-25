# SoundCloud Clone - REST API

Node.js + Express backend servisi. SQL Server veritabanı ile entegre.

## 🚀 Kurulum

1. **Bağımlılıkları yükle:**
```bash
npm install
```

2. **Ortam değişkenlerini ayarla:**
```bash
# .env.example dosyasını .env olarak kopyala
copy .env.example .env

# .env dosyasını düzenle (SQL Server bilgilerini gir)
```

3. **Veritabanını hazırla:**
```bash
# database/ klasöründeki SQL dosyalarını sırayla çalıştır:
# 01_CreateDatabase.sql
# 02_CreateSchemas.sql
# 03_CreateTables_Identity.sql
# 04_CreateTables_Music.sql
# 05_CreateTables_Interaction.sql
# 06_SampleData_Insert.sql
# 08_Performance_Optimization.sql
# 09_StoredProcedures.sql

# Seed ile 50K+ veri yükle
cd database/seeder
npm install
npm run seed
```

4. **Sunucuyu başlat:**
```bash
npm start
# veya geliştirme için:
npm run dev
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
