// =============================================
// Frekans - Müzik Streaming Platformu API
// =============================================
// Express + MSSQL Backend
// SQL Injection korumalı, Sayfalama destekli
// =============================================

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// Middleware
// =============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (Frontend)
app.use(express.static('public'));

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const audioDir = path.join(uploadsDir, 'audio');
const coversDir = path.join(uploadsDir, 'covers');

[uploadsDir, audioDir, coversDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'audioFile') {
            cb(null, audioDir);
        } else if (file.fieldname === 'coverImage') {
            cb(null, coversDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'audioFile') {
            if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav') {
                cb(null, true);
            } else {
                cb(new Error('Only MP3 and WAV files are allowed!'));
            }
        } else if (file.fieldname === 'coverImage') {
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
                cb(null, true);
            } else {
                cb(new Error('Only JPG and PNG images are allowed!'));
            }
        }
    }
});

// =============================================
// SQL Server Configuration
// =============================================
const dbConfig = {
    server: 'localhost',
    port: 52548,
    database: process.env.DB_DATABASE || 'FrekansDB',
    user: 'nodeapp',
    password: 'NodeApp123!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        useUTC: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Global connection pool
let pool;

// =============================================
// Database Connection Pool
// =============================================
async function connectDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('✅ SQL Server bağlantısı başarılı!');
        console.log(`📊 Veritabanı: ${dbConfig.database}`);
        return pool;
    } catch (error) {
        console.error('❌ Veritabanı bağlantı hatası:', error.message);
        throw error;
    }
}

// =============================================
// ENDPOINT 1: GET /api/tracks
// =============================================
// Amaç: Şarkı listesini View'dan çek (Sayfalama ile)
// Query Params: ?page=1&limit=20&genre=Trap
// =============================================
// Search tracks endpoint
app.get('/api/tracks/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const userId = req.query.userId ? parseInt(req.query.userId) : null;
        
        if (!query || query.length < 2) {
            return res.json({ success: true, data: [] });
        }
        
        const request = pool.request();
        request.input('SearchQuery', sql.NVarChar, `%${query}%`);
        
        let isLikedSelect = '0 AS IsLiked';
        if (userId) {
            request.input('UserID', sql.Int, userId);
            isLikedSelect = `(SELECT CASE WHEN EXISTS(SELECT 1 FROM [Interaction].[Likes] WHERE TrackID = t.TrackID AND UserID = @UserID) THEN 1 ELSE 0 END) AS IsLiked`;
        }
        
        const searchQuery = `
            SELECT TOP 50
                t.TrackID,
                t.Title,
                t.AudioUrl,
                t.CoverImageUrl,
                u.UserID,
                u.Username,
                u.AvatarUrl,
                g.Name AS GenreName,
                (SELECT COUNT(*) FROM [Interaction].[Plays] WHERE TrackID = t.TrackID) AS PlayCount,
                (SELECT COUNT(*) FROM [Interaction].[Likes] WHERE TrackID = t.TrackID) AS LikeCount,
                ${isLikedSelect}
            FROM [Music].[Tracks] t
            INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
            LEFT JOIN [Music].[Genres] g ON t.GenreID = g.GenreID
            WHERE (t.IsPublic = 1 ${userId ? 'OR t.ArtistID = @UserID' : ''})
                AND (t.Title LIKE @SearchQuery OR u.Username LIKE @SearchQuery)
            ORDER BY t.UploadDate DESC
        `;
        
        const result = await request.query(searchQuery);
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('Track search error:', error);
        res.status(500).json({ success: false, message: 'Arama hatası', error: error.message });
    }
});

app.get('/api/tracks', async (req, res) => {
    try {
        // Pagination parametreleri
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const genreFilter = req.query.genre || null;
        const userId = req.query.userId ? parseInt(req.query.userId) : null;

        // SQL Injection koruması: Parametreli sorgu
        const request = pool.request();
        request.input('Offset', sql.Int, offset);
        request.input('Limit', sql.Int, limit);

        let isLikedSelect = '0 AS IsLiked';
        if (userId) {
            request.input('UserID', sql.Int, userId);
            isLikedSelect = `(SELECT CASE WHEN EXISTS(SELECT 1 FROM [Interaction].[Likes] WHERE TrackID = vw.TrackID AND UserID = @UserID) THEN 1 ELSE 0 END) AS IsLiked`;
        }

        let query = `
            SELECT 
                vw.TrackID,
                vw.Title,
                vw.AudioUrl,
                vw.Duration,
                vw.CoverImageUrl,
                vw.AlbumTitle,
                vw.ArtistName,
                vw.ArtistAvatar,
                vw.ArtistIsVerified,
                vw.GenreName,
                vw.TotalPlays,
                vw.TotalLikes,
                vw.TotalComments,
                vw.Slug,
                vw.UploadDate,
                ${isLikedSelect}
            FROM [Music].[vw_TrackCardDetails] vw
            WHERE vw.IsPublic = 1
        `;

        // Tür filtresi varsa ekle
        if (genreFilter) {
            request.input('GenreName', sql.NVarChar(50), genreFilter);
            query += ` AND GenreName = @GenreName`;
        }

        // Sıralama ve sayfalama
        query += `
            ORDER BY TotalPlays DESC
            OFFSET @Offset ROWS
            FETCH NEXT @Limit ROWS ONLY;
        `;

        const result = await request.query(query);

        // Toplam kayıt sayısını al (pagination için)
        const countRequest = pool.request();
        if (genreFilter) {
            countRequest.input('GenreName', sql.NVarChar(50), genreFilter);
        }

        let countQuery = `
            SELECT COUNT(*) AS Total 
            FROM [Music].[vw_TrackCardDetails] 
            WHERE IsPublic = 1
        `;
        if (genreFilter) {
            countQuery += ` AND GenreName = @GenreName`;
        }

        const countResult = await countRequest.query(countQuery);
        const totalRecords = countResult.recordset[0].Total;
        const totalPages = Math.ceil(totalRecords / limit);

        // Response
        res.json({
            success: true,
            data: result.recordset,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalRecords: totalRecords,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('❌ /api/tracks hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Şarkılar yüklenirken hata oluştu.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 2: GET /api/search
// =============================================
// Amaç: Şarkı arama (Title üzerinde LIKE sorgusu)
// Query Params: ?q=trap&limit=10
// Index performansını kullanır (IX_Tracks_Title)
// =============================================
app.get('/api/search', async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        const limit = parseInt(req.query.limit) || 20;

        // Boş arama kontrolü
        if (!searchQuery.trim()) {
            return res.json({
                success: true,
                data: [],
                message: 'Arama kelimesi giriniz.'
            });
        }

        // SQL Injection koruması
        const request = pool.request();
        request.input('SearchPattern', sql.NVarChar(202), `%${searchQuery}%`);
        request.input('Limit', sql.Int, limit);

        // LIKE sorgusu - IX_Tracks_Title index'i kullanacak
        const query = `
            SELECT TOP (@Limit)
                t.TrackID,
                t.Title,
                t.AudioUrl,
                t.DurationSeconds AS Duration,
                t.Slug,
                ISNULL(a.CoverImageUrl, '') AS CoverImageUrl,
                u.Username AS ArtistName,
                u.AvatarUrl AS ArtistAvatar,
                u.IsVerified AS ArtistIsVerified,
                g.Name AS GenreName,
                (SELECT COUNT(*) FROM [Interaction].[Plays] p WHERE p.TrackID = t.TrackID) AS TotalPlays,
                (SELECT COUNT(*) FROM [Interaction].[Likes] l WHERE l.TrackID = t.TrackID) AS TotalLikes
            FROM [Music].[Tracks] t WITH (INDEX(IX_Tracks_Title))
            INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
            INNER JOIN [Music].[Genres] g ON t.GenreID = g.GenreID
            LEFT JOIN [Music].[Albums] a ON t.AlbumID = a.AlbumID
            WHERE t.Title LIKE @SearchPattern
            ORDER BY t.PlayCount DESC;
        `;

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset,
            searchQuery: searchQuery,
            resultCount: result.recordset.length
        });

    } catch (error) {
        console.error('❌ /api/search hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Arama sırasında hata oluştu.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 3: POST /api/like
// =============================================
// Amaç: Beğeni toggle (Like/Unlike)
// Body: { "userId": 5, "trackId": 42 }
// Stored Procedure: [Interaction].[sp_ToggleLike]
// =============================================
app.post('/api/like', async (req, res) => {
    try {
        const { userId, trackId } = req.body;

        // Validasyon
        if (!userId || !trackId) {
            return res.status(400).json({
                success: false,
                message: 'userId ve trackId gereklidir.'
            });
        }

        // SQL Injection koruması: Parametreli Stored Procedure çağrısı
        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        request.input('TrackID', sql.Int, trackId);

        const result = await request.execute('[Interaction].[sp_ToggleLike]');

        // Prosedürden dönen sonuç
        const data = result.recordset[0];

        if (data.Status === 'SUCCESS') {
            res.json({
                success: true,
                data: {
                    trackId: data.TrackID,
                    userId: data.UserID,
                    isLiked: data.IsLiked,
                    action: data.Action,
                    totalLikes: data.TotalLikes
                }
            });
        } else {
            throw new Error(data.Status);
        }

    } catch (error) {
        console.error('❌ /api/like hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Beğeni işlemi başarısız.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 3.5: POST /api/play
// =============================================
// Amaç: Şarkı dinlendiğinde play count artır
// Body: { "userId": 5, "trackId": 42 }
// =============================================
app.post('/api/play', async (req, res) => {
    try {
        const { userId, trackId } = req.body;

        if (!userId || !trackId) {
            return res.status(400).json({
                success: false,
                message: 'userId ve trackId gereklidir.'
            });
        }

        const request = pool.request();
        request.input('TrackID', sql.Int, trackId);
        request.input('UserID', sql.Int, userId);

        // Interaction.Plays tablosuna ekle
        const insertQuery = `
            INSERT INTO [Interaction].[Plays] (TrackID, UserID, PlayedAt)
            VALUES (@TrackID, @UserID, GETDATE());
            
            -- PlayCount cache'ini güncelle
            UPDATE [Music].[Tracks]
            SET PlayCount = PlayCount + 1
            WHERE TrackID = @TrackID;
            
            -- Güncel play count'u dön
            SELECT PlayCount FROM [Music].[Tracks] WHERE TrackID = @TrackID;
        `;

        const result = await request.query(insertQuery);
        const newPlayCount = result.recordset[0].PlayCount;

        res.json({
            success: true,
            data: {
                trackId: trackId,
                userId: userId,
                playCount: newPlayCount
            }
        });

    } catch (error) {
        console.error('❌ /api/play hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Play kaydı başarısız.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 4: GET /api/stats/trend
// =============================================
// Amaç: Cursor içeren prosedürü çalıştır (Trend analizi)
// Stored Procedure: [Analysis].[sp_CalculateArtistTrendScore]
// =============================================
app.get('/api/stats/trend', async (req, res) => {
    try {
        console.log('🔥 Trend analizi başlatılıyor...');

        const request = pool.request();
        
        // Cursor prosedürünü çalıştır
        const result = await request.execute('[Analysis].[sp_CalculateArtistTrendScore]');

        // Prosedür birden fazla recordset döndürür (TOP 20 listesi)
        const trendData = result.recordset;

        res.json({
            success: true,
            message: 'Trend analizi tamamlandı.',
            data: {
                topArtists: trendData,
                analyzedAt: new Date().toISOString(),
                totalArtists: trendData.length
            }
        });

    } catch (error) {
        console.error('❌ /api/stats/trend hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Trend analizi başarısız.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 5: GET /api/tracks/:id
// =============================================
// Amaç: Tekil şarkı detayı getir (Track Detail Page için)
// Route Params: :id (TrackID veya Slug)
// =============================================
app.get('/api/tracks/:id', async (req, res) => {
    try {
        const identifier = req.params.id;
        const userId = req.query.userId ? parseInt(req.query.userId) : null;

        const request = pool.request();
        
        // Check if identifier is numeric (TrackID) or string (Slug)
        const isNumeric = /^\d+$/.test(identifier);
        
        if (isNumeric) {
            request.input('TrackID', sql.Int, parseInt(identifier));
        } else {
            request.input('Slug', sql.NVarChar, identifier);
        }
        
        let isLikedQuery = '0';
        if (userId) {
            request.input('UserID', sql.Int, userId);
            isLikedQuery = `(SELECT CASE WHEN EXISTS(SELECT 1 FROM [Interaction].[Likes] WHERE TrackID = t.TrackID AND UserID = @UserID) THEN 1 ELSE 0 END)`;
        }

        const whereClause = isNumeric ? 't.TrackID = @TrackID' : 't.Slug = @Slug';
        
        // Allow user to see their own private tracks
        let privacyClause = 't.IsPublic = 1';
        if (userId) {
            privacyClause = '(t.IsPublic = 1 OR t.ArtistID = @UserID)';
        }

        const query = `
            SELECT 
                t.TrackID,
                t.Title,
                t.AudioUrl,
                t.DurationSeconds AS Duration,
                t.Slug,
                t.UploadDate,
                t.IsPublic,
                u.UserID,
                u.Username,
                u.AvatarUrl,
                u.IsVerified,
                g.Name AS Genre,
                ISNULL(a.Title, '') AS AlbumTitle,
                (SELECT COUNT(*) FROM [Interaction].[Plays] p WHERE p.TrackID = t.TrackID) AS PlayCount,
                (SELECT COUNT(*) FROM [Interaction].[Likes] l WHERE l.TrackID = t.TrackID) AS LikeCount,
                (SELECT COUNT(*) FROM [Interaction].[Comments] c WHERE c.TrackID = t.TrackID) AS CommentCount,
                ${isLikedQuery} AS IsLiked
            FROM [Music].[Tracks] t
            INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
            INNER JOIN [Music].[Genres] g ON t.GenreID = g.GenreID
            LEFT JOIN [Music].[Albums] a ON t.AlbumID = a.AlbumID
            WHERE ${whereClause} AND ${privacyClause};
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Şarkı bulunamadı.'
            });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('❌ /api/tracks/:id hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Şarkı detayı alınamadı.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 6: GET /api/tracks/:id/comments
// =============================================
// Amaç: Şarkıya ait yorumları getir
// Route Params: :id (TrackID)
// =============================================
app.get('/api/tracks/:id/comments', async (req, res) => {
    try {
        const trackId = parseInt(req.params.id);

        if (!trackId || isNaN(trackId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz track ID.'
            });
        }

        const request = pool.request();
        request.input('TrackID', sql.Int, trackId);

        const query = `
            SELECT 
                c.CommentID,
                c.Content,
                c.TimestampSeconds,
                c.PostedAt,
                u.UserID,
                u.Username,
                u.AvatarUrl,
                u.IsVerified
            FROM [Interaction].[Comments] c
            INNER JOIN [Identity].[Users] u ON c.UserID = u.UserID
            WHERE c.TrackID = @TrackID
            ORDER BY c.PostedAt DESC;
        `;

        const result = await request.query(query);

        res.json(result.recordset);

    } catch (error) {
        console.error('❌ /api/tracks/:id/comments hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Yorumlar alınamadı.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 7: POST /api/comments
// =============================================
// Amaç: Yeni yorum ekle
// Body: { "trackId": 42, "userId": 5, "commentText": "Amazing!" }
// =============================================
app.post('/api/comments', async (req, res) => {
    try {
        const { trackId, userId, content, timestampSeconds } = req.body;

        if (!trackId || !userId || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'trackId, userId ve content gereklidir.'
            });
        }

        const request = pool.request();
        request.input('TrackID', sql.Int, trackId);
        request.input('UserID', sql.Int, userId);
        request.input('Content', sql.NVarChar(500), content.trim());
        request.input('TimestampSeconds', sql.Int, timestampSeconds || null);

        const query = `
            INSERT INTO [Interaction].[Comments] (TrackID, UserID, Content, TimestampSeconds, PostedAt)
            VALUES (@TrackID, @UserID, @Content, @TimestampSeconds, GETDATE());
            
            SELECT SCOPE_IDENTITY() AS CommentID;
        `;

        const result = await request.query(query);

        res.status(201).json({
            success: true,
            message: 'Yorum eklendi.',
            data: {
                commentId: result.recordset[0].CommentID
            }
        });

    } catch (error) {
        console.error('❌ /api/comments hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Yorum eklenemedi.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 8: POST /api/tracks/upload
// =============================================
// Amaç: Yeni şarkı yükle
// Body: { "userId": 1, "title": "Summer Vibes", "genreId": 2, "albumId": null, "audioUrl": "...", "durationSeconds": 180 }
// Stored Procedure: [Music].[sp_UploadTrack]
// =============================================
app.post('/api/tracks/upload', async (req, res) => {
    try {
        const { userId, title, genreId, albumId, audioUrl, durationSeconds } = req.body;

        // Validasyon
        if (!userId || !title || !genreId || !audioUrl) {
            return res.status(400).json({
                success: false,
                message: 'userId, title, genreId ve audioUrl gereklidir.'
            });
        }

        // SQL Injection koruması
        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        request.input('Title', sql.NVarChar(200), title);
        request.input('GenreID', sql.Int, genreId);
        request.input('AlbumID', sql.Int, albumId || null);
        request.input('AudioUrl', sql.NVarChar(500), audioUrl);
        request.input('DurationSeconds', sql.Int, durationSeconds || 0);

        const result = await request.execute('[Music].[sp_UploadTrack]');

        const data = result.recordset[0];

        if (data.Status === 'SUCCESS') {
            res.status(201).json({
                success: true,
                message: data.Message,
                data: {
                    trackId: data.TrackID,
                    slug: data.Slug
                }
            });
        } else {
            throw new Error(data.Message);
        }

    } catch (error) {
        console.error('❌ /api/tracks/upload hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Şarkı yüklenemedi.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 9: POST /api/auth/login
// =============================================
// Amaç: Kullanıcı girişi (basit username/password check)
// Body: { "username": "john_doe", "password": "pass123" }
// =============================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Kullanıcı adı ve şifre gereklidir.'
            });
        }

        const request = pool.request();
        request.input('Username', sql.NVarChar(50), username);
        request.input('Password', sql.NVarChar(255), password);

        // Şifre kontrolü dahil (basit kontrol - gerçek uygulamada şifre hash'lenmiş olmalı)
        const query = `
            SELECT 
                UserID,
                Username,
                Email,
                Bio,
                AvatarUrl,
                IsVerified,
                [IsAdmin],
                [Language]
            FROM [Identity].[Users]
            WHERE Username = @Username AND PasswordHash = @Password;
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı adı veya şifre hatalı.'
            });
        }

        const user = result.recordset[0];

        res.json({
            success: true,
            message: 'Giriş başarılı.',
            data: {
                userId: user.UserID,
                UserID: user.UserID,
                username: user.Username,
                email: user.Email,
                bio: user.Bio,
                avatarUrl: user.AvatarUrl,
                isVerified: user.IsVerified,
                IsAdmin: user.IsAdmin || false,
                Language: user.Language || 'tr'
            }
        });

    } catch (error) {
        console.error('❌ /api/auth/login hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Giriş yapılamadı.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 9B: POST /api/auth/register
// =============================================
// Amaç: Yeni kullanıcı kaydı
// Body: { "username": "newuser", "email": "user@example.com", "password": "pass123" }
// =============================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validasyon
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Kullanıcı adı, e-posta ve şifre gereklidir.'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Kullanıcı adı en az 3 karakter olmalıdır.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Şifre en az 6 karakter olmalıdır.'
            });
        }

        // Kullanıcı adı veya e-posta kontrolü
        const checkRequest = pool.request();
        checkRequest.input('Username', sql.NVarChar(50), username);
        checkRequest.input('Email', sql.NVarChar(100), email);
        
        const checkQuery = `
            SELECT COUNT(*) AS Count
            FROM [Identity].[Users]
            WHERE Username = @Username OR Email = @Email;
        `;
        const checkResult = await checkRequest.query(checkQuery);

        if (checkResult.recordset[0].Count > 0) {
            return res.status(409).json({
                success: false,
                message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor.'
            });
        }

        // Yeni kullanıcı ekle
        const insertRequest = pool.request();
        insertRequest.input('Username', sql.NVarChar(50), username);
        insertRequest.input('Email', sql.NVarChar(100), email);
        insertRequest.input('Password', sql.NVarChar(255), password);
        
        const insertQuery = `
            INSERT INTO [Identity].[Users] (Username, Email, PasswordHash, Bio, IsVerified, CreatedAt)
            OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email
            VALUES (@Username, @Email, @Password, 'Yeni kullanıcı', 0, GETDATE());
        `;
        
        const insertResult = await insertRequest.query(insertQuery);
        const newUser = insertResult.recordset[0];

        res.status(201).json({
            success: true,
            message: 'Kayıt başarılı! Giriş yapabilirsiniz.',
            data: {
                userId: newUser.UserID,
                username: newUser.Username,
                email: newUser.Email
            }
        });

    } catch (error) {
        console.error('❌ /api/auth/register hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Kayıt işlemi başarısız.',
            error: error.message
        });
    }
});

// =============================================
// =============================================
// ENDPOINT: GET /api/users/search
// =============================================
// Amaç: Kullanıcı adına göre arama yap
// Query Params: query, currentUserID
// =============================================
app.get('/api/users/search', async (req, res) => {
    const { query, currentUserID } = req.query;
    
    if (!query || query.trim().length < 2) {
        return res.json([]);
    }
    
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('SearchQuery', sql.NVarChar, `%${query}%`)
            .input('CurrentUserID', sql.Int, currentUserID ? parseInt(currentUserID) : null)
            .query(`
                SELECT 
                    u.UserID,
                    u.Username,
                    u.Bio,
                    u.AvatarUrl,
                    u.FollowerCount,
                    u.FollowingCount,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM [Interaction].[Follows] 
                            WHERE FollowerID = @CurrentUserID AND FollowingID = u.UserID
                        ) THEN 1
                        ELSE 0
                    END AS IsFollowing,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM [Interaction].[Follows] f1
                            WHERE f1.FollowerID = @CurrentUserID AND f1.FollowingID = u.UserID
                        ) AND EXISTS (
                            SELECT 1 FROM [Interaction].[Follows] f2
                            WHERE f2.FollowerID = u.UserID AND f2.FollowingID = @CurrentUserID
                        ) THEN 1
                        ELSE 0
                    END AS IsFriend
                FROM [Identity].[Users] u
                WHERE u.Username LIKE @SearchQuery
                AND (@CurrentUserID IS NULL OR u.UserID != @CurrentUserID)
                ORDER BY u.Username
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ 
            error: 'Kullanıcı araması başarısız oldu',
            details: error.message
        });
    }
});

// ENDPOINT 10: GET /api/users/:id
// =============================================
// Amaç: Kullanıcı profil bilgilerini getir
// Route Params: :id (UserID)
// =============================================
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kullanıcı ID.'
            });
        }

        const request = pool.request();
        request.input('UserID', sql.Int, userId);

        // Use stored procedure to get LastActiveAt
        const result = await request.execute('[Identity].[sp_GetUserByID]');
        
        // Add additional stats
        if (result.recordset.length > 0) {
            const statsRequest = pool.request();
            statsRequest.input('UserID', sql.Int, userId);
            
            const statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM [Music].[Tracks] WHERE ArtistID = @UserID AND IsPublic = 1) AS TrackCount,
                    (SELECT SUM(PlayCount) FROM [Music].[Tracks] WHERE ArtistID = @UserID) AS TotalPlays
            `;
            
            const statsResult = await statsRequest.query(statsQuery);
            
            // Merge stats into user object
            result.recordset[0].TrackCount = statsResult.recordset[0].TrackCount;
            result.recordset[0].TotalPlays = statsResult.recordset[0].TotalPlays;
        }

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı.'
            });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('❌ /api/users/:id hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı profili alınamadı.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT: POST /api/users/:id/activity
// Update user last active time
// =============================================
app.post('/api/users/:id/activity', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        
        await request.execute('[Identity].[sp_UpdateUserActivity]');
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ /api/users/:id/activity error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update activity',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 10.5: PUT /api/users/:id
// =============================================
// Amaç: Kullanıcı profil bilgilerini güncelle
// Route Params: :id (UserID)
// Body: { Username, Bio }
// =============================================
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { Username, Bio } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kullanıcı ID.'
            });
        }

        if (!Username || Username.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Kullanıcı adı boş olamaz.'
            });
        }

        // Check if username already exists (for other users)
        const checkRequest = pool.request();
        checkRequest.input('Username', sql.NVarChar, Username.trim());
        checkRequest.input('UserID', sql.Int, userId);

        const checkQuery = `
            SELECT UserID FROM [Identity].[Users] 
            WHERE Username = @Username AND UserID != @UserID;
        `;
        
        const checkResult = await checkRequest.query(checkQuery);
        
        if (checkResult.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Bu kullanıcı adı zaten kullanılıyor.'
            });
        }

        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        request.input('Username', sql.NVarChar, Username.trim());
        request.input('Bio', sql.NVarChar, Bio ? Bio.trim() : null);

        const query = `
            UPDATE [Identity].[Users]
            SET 
                Username = @Username,
                Bio = @Bio
            WHERE UserID = @UserID;

            SELECT 
                UserID,
                Username,
                Email,
                Bio,
                AvatarUrl,
                HeaderImageUrl,
                IsVerified,
                CreatedAt
            FROM [Identity].[Users]
            WHERE UserID = @UserID;
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı.'
            });
        }

        res.json({
            success: true,
            message: 'Profil başarıyla güncellendi.',
            user: result.recordset[0]
        });

    } catch (error) {
        console.error('❌ /api/users/:id PUT hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Profil güncellenirken bir hata oluştu.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 11: GET /api/users/:id/tracks
// =============================================
// Amaç: Kullanıcının yüklediği şarkıları getir
// Route Params: :id (UserID)
// =============================================
app.get('/api/users/:id/tracks', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kullanıcı ID.'
            });
        }

        const request = pool.request();
        request.input('UserID', sql.Int, userId);

        const query = `
            SELECT 
                t.TrackID,
                t.Title,
                t.AudioUrl,
                t.CoverImageUrl,
                t.DurationSeconds AS Duration,
                t.Slug,
                t.UploadDate,
                t.IsPublic,
                (SELECT COUNT(*) FROM [Interaction].[Plays] p WHERE p.TrackID = t.TrackID) AS PlayCount,
                (SELECT COUNT(*) FROM [Interaction].[Likes] l WHERE l.TrackID = t.TrackID) AS LikeCount
            FROM [Music].[Tracks] t
            WHERE t.ArtistID = @UserID
            ORDER BY t.UploadDate DESC;
        `;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('❌ /api/users/:id/tracks hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı şarkıları alınamadı.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 12: GET /api/users/:id/likes
// =============================================
// Amaç: Kullanıcının beğendiği şarkıları getir
// Route Params: :id (UserID)
// =============================================
app.get('/api/users/:id/likes', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kullanıcı ID.'
            });
        }

        const request = pool.request();
        request.input('UserID', sql.Int, userId);

        const query = `
            SELECT 
                t.TrackID,
                t.Title,
                t.CoverImageUrl,
                t.DurationSeconds AS Duration,
                t.Slug,
                t.ArtistID,
                u.Username AS ArtistName,
                (SELECT COUNT(*) FROM [Interaction].[Plays] p WHERE p.TrackID = t.TrackID) AS PlayCount,
                (SELECT COUNT(*) FROM [Interaction].[Likes] l2 WHERE l2.TrackID = t.TrackID) AS LikeCount
            FROM [Interaction].[Likes] l
            INNER JOIN [Music].[Tracks] t ON l.TrackID = t.TrackID
            INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
            WHERE l.UserID = @UserID AND t.IsPublic = 1
            ORDER BY l.LikedAt DESC;
        `;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('❌ /api/users/:id/likes hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Beğenilen şarkılar alınamadı.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 12.5: GET /api/users/:id/playlists
// =============================================
// Amaç: Kullanıcının çalma listelerini getir
// Route Params: :id (UserID)
// =============================================
app.get('/api/users/:id/playlists', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kullanıcı ID.'
            });
        }

        const request = pool.request();
        request.input('UserID', sql.Int, userId);

        const query = `
            SELECT 
                p.PlaylistID,
                p.Name,
                p.Description,
                p.CoverImageUrl,
                p.IsPublic,
                p.CreatedDate,
                (SELECT COUNT(*) FROM [Music].[PlaylistTracks] pt WHERE pt.PlaylistID = p.PlaylistID) AS TrackCount
            FROM [Music].[Playlists] p
            WHERE p.UserID = @UserID
            ORDER BY p.CreatedDate DESC;
        `;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('❌ /api/users/:id/playlists hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Çalma listeleri alınamadı.',
            error: error.message
        });
    }
});

// =============================================
// ENDPOINT 13: POST /api/upload
// =============================================
// Amaç: Yeni şarkı yükle (audio + cover image)
// Body: multipart/form-data
// Fields: audioFile, coverImage, title, genre, album, userId, isPublic
// =============================================
app.post('/api/upload', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
    try {
        // Validate required fields
        const { title, userId, isPublic } = req.body;
        
        if (!title || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Title and userId are required.'
            });
        }

        if (!req.files || !req.files.audioFile) {
            return res.status(400).json({
                success: false,
                message: 'Audio file is required.'
            });
        }

        // Get uploaded file paths
        const audioFile = req.files.audioFile[0];
        const coverImage = req.files.coverImage ? req.files.coverImage[0] : null;

        // Generate relative paths for database
        const audioPath = `/uploads/audio/${audioFile.filename}`;
        const coverPath = coverImage ? `/uploads/covers/${coverImage.filename}` : '/images/default-cover.jpg';

        // Generate slug from title
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            + '-' + Date.now();

        // Get audio duration (approximate from file size for now)
        // In production, you'd use a library like 'music-metadata' to get actual duration
        const durationSeconds = Math.floor(audioFile.size / (128000 / 8)); // Rough estimate for 128kbps

        // Get or create genre
        const genreName = req.body.genre || 'Other';
        const genreRequest = pool.request();
        genreRequest.input('GenreName', sql.NVarChar, genreName);
        
        const genreQuery = `
            DECLARE @GenreID INT;
            SELECT @GenreID = GenreID FROM [Music].[Genres] WHERE Name = @GenreName;
            
            IF @GenreID IS NULL
            BEGIN
                INSERT INTO [Music].[Genres] (Name) VALUES (@GenreName);
                SET @GenreID = SCOPE_IDENTITY();
            END
            
            SELECT @GenreID AS GenreID;
        `;
        
        const genreResult = await genreRequest.query(genreQuery);
        const genreId = genreResult.recordset[0].GenreID;

        // Insert track into database
        const request = pool.request();
        request.input('Title', sql.NVarChar, title);
        request.input('ArtistID', sql.Int, parseInt(userId));
        request.input('GenreID', sql.Int, genreId);
        request.input('DurationSeconds', sql.Int, durationSeconds);
        request.input('AudioUrl', sql.NVarChar, audioPath);
        request.input('CoverImageUrl', sql.NVarChar, coverPath);
        request.input('IsPublic', sql.Bit, isPublic === 'private' ? 0 : 1);
        request.input('Slug', sql.NVarChar, slug);

        const insertQuery = `
            INSERT INTO [Music].[Tracks] 
            (Title, ArtistID, GenreID, DurationSeconds, AudioUrl, CoverImageUrl, IsPublic, Slug, UploadDate)
            VALUES 
            (@Title, @ArtistID, @GenreID, @DurationSeconds, @AudioUrl, @CoverImageUrl, @IsPublic, @Slug, GETDATE());
            
            SELECT SCOPE_IDENTITY() AS TrackID;
        `;

        const result = await request.query(insertQuery);
        const trackId = result.recordset[0].TrackID;

        res.json({
            success: true,
            message: 'Track uploaded successfully!',
            trackId: trackId,
            slug: slug,
            redirectUrl: `/track-detail.html?slug=${slug}`
        });

    } catch (error) {
        console.error('❌ /api/upload hatası:', error.message);
        console.error('Stack:', error.stack);
        console.error('Request body:', req.body);
        console.error('Files:', req.files ? Object.keys(req.files) : 'No files');
        
        // Clean up uploaded files if database insert fails
        if (req.files) {
            if (req.files.audioFile) {
                try { fs.unlinkSync(req.files.audioFile[0].path); } catch(e) {}
            }
            if (req.files.coverImage) {
                try { fs.unlinkSync(req.files.coverImage[0].path); } catch(e) {}
            }
        }

        res.status(500).json({
            success: false,
            message: 'Upload failed.',
            error: error.message
        });
    }
});

// =============================================
// Health Check Endpoint
// =============================================
app.get('/health', async (req, res) => {
    try {
        await pool.request().query('SELECT 1 AS Health');
        res.json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error.message
        });
    }
});

// Update User Settings
app.put('/api/user/settings', async (req, res) => {
    try {
        const { userId, language } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId gerekli'
            });
        }
        
        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        
        if (language) {
            request.input('Language', sql.NVarChar, language);
            await request.query('UPDATE [Identity].[Users] SET [Language] = @Language WHERE UserID = @UserID');
        }
        
        res.json({
            success: true,
            message: 'Ayarlar güncellendi'
        });
        
    } catch (error) {
        console.error('❌ Update settings hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Ayarlar güncellenemedi',
            error: error.message
        });
    }
});

// Change Password
app.post('/api/user/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Tüm alanlar gerekli'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Yeni şifre en az 6 karakter olmalıdır'
            });
        }
        
        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        
        // Get current password hash
        const userResult = await request.query('SELECT PasswordHash FROM [Identity].[Users] WHERE UserID = @UserID');
        
        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }
        
        const storedHash = userResult.recordset[0].PasswordHash;
        
        // Verify current password (simple comparison - in production use bcrypt)
        if (currentPassword !== storedHash) {
            return res.status(401).json({
                success: false,
                message: 'Mevcut şifre yanlış'
            });
        }
        
        // Update password (in production, hash with bcrypt)
        const updateRequest = pool.request();
        updateRequest.input('UserID', sql.Int, userId);
        updateRequest.input('NewPassword', sql.NVarChar, newPassword);
        
        await updateRequest.query('UPDATE [Identity].[Users] SET PasswordHash = @NewPassword WHERE UserID = @UserID');
        
        res.json({
            success: true,
            message: 'Şifre başarıyla değiştirildi'
        });
        
    } catch (error) {
        console.error('❌ Change password hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Şifre değiştirilemedi',
            error: error.message
        });
    }
});

// =============================================
// FEEDBACK ENDPOINTS
// =============================================

// Submit Feedback
app.post('/api/feedback/submit', async (req, res) => {
    try {
        const { userId, type, category, title, message } = req.body;
        
        if (!userId || !type || !message) {
            return res.status(400).json({
                success: false,
                message: 'userId, type ve message gerekli'
            });
        }
        
        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        request.input('TypeKey', sql.NVarChar, type);
        request.input('Category', sql.NVarChar, category || null);
        request.input('Title', sql.NVarChar, title || null);
        request.input('Message', sql.NVarChar, message);
        
        const result = await request.execute('[Feedback].[sp_CreateFeedback]');
        
        res.json({
            success: true,
            message: 'Geri bildiriminiz alındı',
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('❌ Feedback submit hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Geri bildirim gönderilemedi',
            error: error.message
        });
    }
});

// Get All Feedbacks (Admin)
app.get('/api/admin/feedbacks', async (req, res) => {
    try {
        const { status, type, limit = 100, offset = 0 } = req.query;
        
        const request = pool.request();
        request.input('Status', sql.NVarChar, status || null);
        request.input('TypeKey', sql.NVarChar, type || null);
        request.input('Limit', sql.Int, parseInt(limit));
        request.input('Offset', sql.Int, parseInt(offset));
        
        const result = await request.execute('[Feedback].[sp_GetAllFeedbacks]');
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('❌ Get feedbacks hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Geri bildirimler alınamadı',
            error: error.message
        });
    }
});

// Get Feedback Stats (Admin)
app.get('/api/admin/feedback-stats', async (req, res) => {
    try {
        const result = await pool.request().execute('[Feedback].[sp_GetFeedbackStats]');
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('❌ Feedback stats hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'İstatistikler alınamadı',
            error: error.message
        });
    }
});

// Update Feedback Status (Admin)
app.put('/api/admin/feedback/:id', async (req, res) => {
    try {
        const feedbackId = req.params.id;
        const { status, priority, adminNotes, reviewedBy } = req.body;
        
        const request = pool.request();
        request.input('FeedbackID', sql.Int, parseInt(feedbackId));
        request.input('Status', sql.NVarChar, status);
        request.input('Priority', sql.NVarChar, priority || null);
        request.input('AdminNotes', sql.NVarChar, adminNotes || null);
        request.input('ReviewedBy', sql.Int, reviewedBy || null);
        
        await request.execute('[Feedback].[sp_UpdateFeedbackStatus]');
        
        res.json({
            success: true,
            message: 'Feedback güncellendi'
        });
        
    } catch (error) {
        console.error('❌ Update feedback hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Feedback güncellenemedi',
            error: error.message
        });
    }
});

// Delete Feedback (Admin)
app.delete('/api/admin/feedback/:id', async (req, res) => {
    try {
        const feedbackId = req.params.id;
        
        const request = pool.request();
        request.input('FeedbackID', sql.Int, parseInt(feedbackId));
        
        await request.query('DELETE FROM [Feedback].[Feedbacks] WHERE FeedbackID = @FeedbackID');
        
        res.json({
            success: true,
            message: 'Feedback silindi'
        });
        
    } catch (error) {
        console.error('❌ Delete feedback hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Feedback silinemedi',
            error: error.message
        });
    }
});

// =============================================
// Admin - User Management
// =============================================

// Get All Users (Admin)
app.get('/api/admin/users', async (req, res) => {
    try {
        const request = pool.request();
        
        const result = await request.query(`
            SELECT 
                UserID,
                Username,
                Email,
                IsAdmin,
                Language,
                CreatedAt
            FROM [Identity].[Users]
            ORDER BY CreatedAt DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('❌ Get users hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Kullanıcılar alınamadı',
            error: error.message
        });
    }
});

// Update User (Admin)
app.put('/api/admin/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, isAdmin, language } = req.body;
        
        const request = pool.request();
        request.input('UserID', sql.Int, parseInt(userId));
        request.input('Username', sql.NVarChar, username);
        request.input('Email', sql.NVarChar, email);
        request.input('IsAdmin', sql.Bit, isAdmin);
        request.input('Language', sql.NVarChar, language);
        
        await request.query(`
            UPDATE [Identity].[Users]
            SET Username = @Username,
                Email = @Email,
                IsAdmin = @IsAdmin,
                Language = @Language
            WHERE UserID = @UserID
        `);
        
        res.json({
            success: true,
            message: 'Kullanıcı güncellendi'
        });
        
    } catch (error) {
        console.error('❌ Update user hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı güncellenemedi',
            error: error.message
        });
    }
});

// Delete User (Admin)
app.delete('/api/admin/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const request = pool.request();
        request.input('UserID', sql.Int, parseInt(userId));
        
        // Delete user's tracks, comments, likes, etc. (cascade)
        await request.query('DELETE FROM [Identity].[Users] WHERE UserID = @UserID');
        
        res.json({
            success: true,
            message: 'Kullanıcı silindi'
        });
        
    } catch (error) {
        console.error('❌ Delete user hatası:', error.message);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı silinemedi',
            error: error.message
        });
    }
});

// =============================================
// Server Başlatma
// =============================================
async function startServer() {
    try {
        // Veritabanı bağlantısını aç
        await connectDatabase();

        // Express sunucusunu başlat
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('========================================');
            console.log('🎵 Frekans Müzik API');
            console.log('========================================');
            console.log(`🚀 Sunucu: http://localhost:${PORT}`);
            console.log(`🏥 Sağlık: http://localhost:${PORT}/health`);
            console.log('');
            console.log('📡 API Endpoint\'leri:');
            console.log(`   GET  /api/tracks        - Şarkı listesi`);
            console.log(`   GET  /api/search          - Şarkı ara`);
            console.log(`   GET  /api/tracks/:id      - Şarkı detayı`);
            console.log(`   GET  /api/users/:id       - Kullanıcı profili`);
            console.log(`   POST /api/auth/login      - Giriş yap`);
            console.log(`   POST /api/auth/register   - Kayıt ol`);
            console.log(`   POST /api/like            - Beğen`);
            console.log(`   POST /api/comments        - Yorum ekle`);
            console.log('========================================');
        });

        // Increase timeout for file uploads (5 minutes)
        server.timeout = 300000;
        server.keepAliveTimeout = 300000;
        server.headersTimeout = 300000;

    } catch (error) {
        console.error('❌ Server başlatılamadı:', error.message);
        process.exit(1);
    }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹ Server kapatılıyor...');
    if (pool) {
        await pool.close();
        console.log('✅ Veritabanı bağlantısı kapatıldı.');
    }
    process.exit(0);
});

// =============================================
// SOCIAL FEATURES ENDPOINTS
// =============================================

// Toggle Follow/Unfollow
app.post('/api/follow', async (req, res) => {
    try {
        const { followerID, followingID } = req.body;

        console.log('🔄 Follow request:', { followerID, followingID });

        if (!followerID || !followingID) {
            return res.status(400).json({
                success: false,
                message: 'followerID and followingID are required'
            });
        }

        const request = pool.request();
        request.input('FollowerID', sql.Int, followerID);
        request.input('FollowingID', sql.Int, followingID);

        const result = await request.execute('[Interaction].[sp_ToggleFollow]');

        console.log('✅ Follow result:', result.recordset[0]);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('❌ /api/follow error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Follow operation failed',
            error: error.message
        });
    }
});

// Get Followers
app.get('/api/users/:userId/followers', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const currentUserID = req.query.currentUserID ? parseInt(req.query.currentUserID) : null;

        console.log('👥 Get followers request:', { userId, currentUserID });

        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        request.input('CurrentUserID', sql.Int, currentUserID);

        const result = await request.execute('[Interaction].[sp_GetFollowers]');

        console.log('📊 Followers result (first 2):', result.recordset.slice(0, 2));

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('❌ /api/users/:userId/followers error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get followers',
            error: error.message
        });
    }
});

// Get Following
app.get('/api/users/:userId/following', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const currentUserID = req.query.currentUserID ? parseInt(req.query.currentUserID) : null;

        console.log('👤 Get following request:', { userId, currentUserID });

        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        request.input('CurrentUserID', sql.Int, currentUserID);

        const result = await request.execute('[Interaction].[sp_GetFollowing]');

        console.log('📊 Following result (first 2):', result.recordset.slice(0, 2));

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('❌ /api/users/:userId/following error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get following',
            error: error.message
        });
    }
});

// Send Message
app.post('/api/messages', async (req, res) => {
    try {
        const { senderID, receiverID, messageText, metadata } = req.body;

        if (!senderID || !receiverID || !messageText) {
            return res.status(400).json({
                success: false,
                message: 'senderID, receiverID and messageText are required'
            });
        }

        const request = pool.request();
        request.input('SenderID', sql.Int, senderID);
        request.input('ReceiverID', sql.Int, receiverID);
        request.input('MessageText', sql.NVarChar, messageText);
        request.input('Metadata', sql.NVarChar, metadata || null);

        const result = await request.execute('[Interaction].[sp_SendMessage]');

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('❌ /api/messages error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message.includes('friends') ? 'Can only message friends' : 'Failed to send message',
            error: error.message
        });
    }
});

// Get Conversation
app.get('/api/messages/:user1/:user2', async (req, res) => {
    try {
        const user1 = parseInt(req.params.user1);
        const user2 = parseInt(req.params.user2);
        const limit = parseInt(req.query.limit) || 50;

        const request = pool.request();
        request.input('UserID1', sql.Int, user1);
        request.input('UserID2', sql.Int, user2);
        request.input('Limit', sql.Int, limit);

        const result = await request.execute('[Interaction].[sp_GetConversation]');

        res.json({
            success: true,
            data: result.recordset.reverse() // Oldest first
        });
    } catch (error) {
        console.error('❌ /api/messages/:user1/:user2 error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation',
            error: error.message
        });
    }
});

// =============================================
// PLAYLIST ENDPOINTS
// =============================================

// Create new playlist
app.post('/api/playlists', async (req, res) => {
    try {
        const { userId, name, description, coverImageUrl, isPublic } = req.body;

        if (!userId || !name) {
            return res.status(400).json({
                success: false,
                message: 'UserID ve playlist adı gereklidir.'
            });
        }

        const request = pool.request();
        request.input('UserID', sql.Int, userId);
        request.input('Name', sql.NVarChar(200), name);
        request.input('Description', sql.NVarChar(500), description || null);
        request.input('CoverImageUrl', sql.NVarChar(500), coverImageUrl || null);
        request.input('IsPublic', sql.Bit, isPublic !== undefined ? isPublic : true);

        const result = await request.execute('[Music].[sp_CreatePlaylist]');

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('❌ /api/playlists POST error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Çalma listesi oluşturulamadı.',
            error: error.message
        });
    }
});

// Get user's playlists
app.get('/api/playlists', async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'UserID gereklidir.'
            });
        }

        const request = pool.request();
        request.input('UserID', sql.Int, parseInt(userId));

        const result = await request.execute('[Music].[sp_GetUserPlaylists]');

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('❌ /api/playlists GET error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Çalma listeleri alınamadı.',
            error: error.message
        });
    }
});

// Get playlist tracks
app.get('/api/playlists/:id/tracks', async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id);

        if (!playlistId || isNaN(playlistId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz playlist ID.'
            });
        }

        const request = pool.request();
        request.input('PlaylistID', sql.Int, playlistId);

        const result = await request.execute('[Music].[sp_GetPlaylistTracks]');

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('❌ /api/playlists/:id/tracks GET error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Playlist şarkıları alınamadı.',
            error: error.message
        });
    }
});

// Add track to playlist
app.post('/api/playlists/:id/tracks', async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id);
        const { trackId, userId } = req.body;

        if (!playlistId || !trackId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'PlaylistID, TrackID ve UserID gereklidir.'
            });
        }

        const request = pool.request();
        request.input('PlaylistID', sql.Int, playlistId);
        request.input('TrackID', sql.Int, trackId);
        request.input('UserID', sql.Int, userId);

        const result = await request.execute('[Music].[sp_AddToPlaylist]');

        res.json({
            success: true,
            message: result.recordset[0].Message
        });

    } catch (error) {
        console.error('❌ /api/playlists/:id/tracks POST error:', error.message);
        
        // Check for duplicate key error
        if (error.message.includes('UNIQUE KEY constraint') || error.message.includes('duplicate key')) {
            return res.status(409).json({
                success: false,
                message: 'Bu şarkı zaten çalma listesinde.',
                error: 'already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message.includes('zaten listede') ? error.message : 'Şarkı eklenemedi.',
            error: error.message
        });
    }
});

// Remove track from playlist
app.delete('/api/playlists/:id/tracks/:trackId', async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id);
        const trackId = parseInt(req.params.trackId);
        const userId = req.query.userId;

        if (!playlistId || !trackId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'PlaylistID, TrackID ve UserID gereklidir.'
            });
        }

        const request = pool.request();
        request.input('PlaylistID', sql.Int, playlistId);
        request.input('TrackID', sql.Int, trackId);
        request.input('UserID', sql.Int, parseInt(userId));

        const result = await request.execute('[Music].[sp_RemoveFromPlaylist]');

        res.json({
            success: true,
            message: result.recordset[0].Message
        });

    } catch (error) {
        console.error('❌ /api/playlists/:id/tracks/:trackId DELETE error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Şarkı çıkarılamadı.',
            error: error.message
        });
    }
});

// Update playlist
app.put('/api/playlists/:id', async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id);
        const { userId, name, description, coverImageUrl, isPublic } = req.body;

        if (!playlistId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'PlaylistID ve UserID gereklidir.'
            });
        }

        const request = pool.request();
        request.input('PlaylistID', sql.Int, playlistId);
        request.input('UserID', sql.Int, userId);
        request.input('Name', sql.NVarChar(200), name || null);
        request.input('Description', sql.NVarChar(500), description || null);
        request.input('CoverImageUrl', sql.NVarChar(500), coverImageUrl || null);
        request.input('IsPublic', sql.Bit, isPublic !== undefined ? isPublic : null);

        const result = await request.execute('[Music].[sp_UpdatePlaylist]');

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('❌ /api/playlists/:id PUT error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Çalma listesi güncellenemedi.',
            error: error.message
        });
    }
});

// Delete playlist
app.delete('/api/playlists/:id', async (req, res) => {
    try {
        const playlistId = parseInt(req.params.id);
        const userId = req.body.userId || req.query.userId;

        if (!playlistId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'PlaylistID ve UserID gereklidir.'
            });
        }

        const request = pool.request();
        request.input('PlaylistID', sql.Int, playlistId);
        request.input('UserID', sql.Int, parseInt(userId));

        const result = await request.execute('[Music].[sp_DeletePlaylist]');

        res.json({
            success: true,
            message: result.recordset[0].Message
        });

    } catch (error) {
        console.error('❌ /api/playlists/:id DELETE error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Çalma listesi silinemedi.',
            error: error.message
        });
    }
});

// =============================================
// SQL Query Endpoint (for homework/testing)
// =============================================
app.post('/api/sql-query', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'SQL sorgusu gereklidir.'
            });
        }

        console.log('🔍 SQL Query Request:', query.substring(0, 100));

        // Capture PRINT messages from SQL Server
        const printMessages = [];
        const request = pool.request();
        
        request.on('info', (info) => {
            printMessages.push(info.message);
        });

        // Split queries by GO statement (batch separator)
        const batches = query.split(/\bGO\b/gi).map(b => b.trim()).filter(b => b.length > 0);
        
        let result;
        let allRecordsets = [];
        let totalRowsAffected = 0;

        // Execute each batch separately
        for (const batch of batches) {
            if (!batch.trim()) continue;
            
            const batchRequest = pool.request();
            batchRequest.on('info', (info) => {
                printMessages.push(info.message);
            });

            try {
                result = await batchRequest.batch(batch);
                
                // Collect recordsets
                if (result.recordset && result.recordset.length > 0) {
                    allRecordsets.push(...result.recordset);
                }
                
                // Sum up affected rows
                if (result.rowsAffected && result.rowsAffected.length > 0) {
                    totalRowsAffected += result.rowsAffected.reduce((sum, num) => sum + num, 0);
                }
            } catch (batchError) {
                // If batch fails, try as regular query
                const fallbackRequest = pool.request();
                fallbackRequest.on('info', (info) => {
                    printMessages.push(info.message);
                });
                result = await fallbackRequest.query(batch);
                
                if (result.recordset && result.recordset.length > 0) {
                    allRecordsets.push(...result.recordset);
                }
                if (result.rowsAffected && result.rowsAffected.length > 0) {
                    totalRowsAffected += result.rowsAffected.reduce((sum, num) => sum + num, 0);
                }
            }
        }

        // Check if it's a SELECT query (returns rows)
        if (allRecordsets.length > 0) {
            res.json({
                success: true,
                results: allRecordsets,
                rowCount: allRecordsets.length,
                messages: printMessages.length > 0 ? printMessages : undefined
            });
        } 
        // For INSERT, UPDATE, DELETE, CREATE, ALTER, DROP operations
        else if (totalRowsAffected > 0) {
            res.json({
                success: true,
                message: 'Sorgu başarıyla çalıştırıldı.',
                rowsAffected: totalRowsAffected,
                messages: printMessages.length > 0 ? printMessages : undefined
            });
        }
        // Query returned no results but may have PRINT messages or DDL commands
        else {
            // Check if it's a DDL command (CREATE, ALTER, DROP, etc.)
            const isDDL = /\b(CREATE|ALTER|DROP|TRUNCATE|BACKUP|RESTORE)\b/i.test(query);
            const message = isDDL 
                ? 'Komut başarıyla çalıştırıldı.' 
                : (printMessages.length > 0 ? 'PRINT çıktıları:' : 'Sorgu başarıyla çalıştırıldı, ancak sonuç döndürmedi.');
            
            res.json({
                success: true,
                results: [],
                message: message,
                messages: printMessages.length > 0 ? printMessages : undefined
            });
        }

    } catch (error) {
        console.error('❌ /api/sql-query POST error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'SQL sorgusu çalıştırılamadı.',
            error: error.message
        });
    }
});

// =============================================
// 404 Handler - Must be last!
// =============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı.',
        path: req.path
    });
});

// Sunucuyu başlat
startServer();
