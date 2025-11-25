-- =============================================
-- SoundCloud Clone - Useful Queries
-- =============================================
-- Sık kullanılan sorgular ve raporlar
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- QUERY 1: En Popüler Şarkılar (Top 10)
-- =============================================
SELECT TOP 10
    T.TrackID,
    T.Title,
    U.Username AS Artist,
    G.Name AS Genre,
    COUNT(P.PlayID) AS TotalPlays,
    COUNT(DISTINCT L.UserID) AS TotalLikes,
    T.UploadDate
FROM [Music].[Tracks] T
INNER JOIN [Identity].[Users] U ON T.ArtistID = U.UserID
INNER JOIN [Music].[Genres] G ON T.GenreID = G.GenreID
LEFT JOIN [Interaction].[Plays] P ON T.TrackID = P.TrackID
LEFT JOIN [Interaction].[Likes] L ON T.TrackID = L.TrackID
WHERE T.IsPublic = 1
GROUP BY T.TrackID, T.Title, U.Username, G.Name, T.UploadDate
ORDER BY TotalPlays DESC;
GO

-- =============================================
-- QUERY 2: Kullanıcının Takip Ettiği Sanatçıların Son Şarkıları
-- =============================================
-- Parametre: @UserID = 4 (ListenerJohn)
DECLARE @UserID INT = 4;

SELECT 
    T.TrackID,
    T.Title,
    U.Username AS Artist,
    T.UploadDate,
    T.Slug
FROM [Interaction].[Follows] F
INNER JOIN [Music].[Tracks] T ON F.FollowingID = T.ArtistID
INNER JOIN [Identity].[Users] U ON T.ArtistID = U.UserID
WHERE F.FollowerID = @UserID
  AND T.IsPublic = 1
ORDER BY T.UploadDate DESC;
GO

-- =============================================
-- QUERY 3: Şarkı Detay Sayfası (Slug ile)
-- =============================================
DECLARE @Slug NVARCHAR(250) = 'midnight-trap';

SELECT 
    T.TrackID,
    T.Title,
    T.AudioUrl,
    T.DurationSeconds,
    T.WaveformData,
    U.UserID AS ArtistID,
    U.Username AS ArtistName,
    U.AvatarUrl AS ArtistAvatar,
    U.IsVerified AS ArtistVerified,
    G.Name AS Genre,
    A.Title AS AlbumTitle,
    COUNT(DISTINCT P.PlayID) AS PlayCount,
    COUNT(DISTINCT L.UserID) AS LikeCount,
    COUNT(DISTINCT C.CommentID) AS CommentCount
FROM [Music].[Tracks] T
INNER JOIN [Identity].[Users] U ON T.ArtistID = U.UserID
INNER JOIN [Music].[Genres] G ON T.GenreID = G.GenreID
LEFT JOIN [Music].[Albums] A ON T.AlbumID = A.AlbumID
LEFT JOIN [Interaction].[Plays] P ON T.TrackID = P.TrackID
LEFT JOIN [Interaction].[Likes] L ON T.TrackID = L.TrackID
LEFT JOIN [Interaction].[Comments] C ON T.TrackID = C.TrackID
WHERE T.Slug = @Slug AND T.IsPublic = 1
GROUP BY 
    T.TrackID, T.Title, T.AudioUrl, T.DurationSeconds, T.WaveformData,
    U.UserID, U.Username, U.AvatarUrl, U.IsVerified,
    G.Name, A.Title;
GO

-- =============================================
-- QUERY 4: Şarkıya Yapılan Yorumlar (Zaman Sıralı - SoundCloud Özelliği)
-- =============================================
DECLARE @TrackID INT = 1;

SELECT 
    C.CommentID,
    C.Content,
    C.TimestampSeconds,
    C.PostedAt,
    U.Username,
    U.AvatarUrl,
    U.IsVerified
FROM [Interaction].[Comments] C
INNER JOIN [Identity].[Users] U ON C.UserID = U.UserID
WHERE C.TrackID = @TrackID
ORDER BY C.TimestampSeconds ASC, C.PostedAt ASC;
GO

-- =============================================
-- QUERY 5: Kullanıcı Profil İstatistikleri
-- =============================================
DECLARE @ProfileUserID INT = 1; -- DJShadow

SELECT 
    U.UserID,
    U.Username,
    U.Bio,
    U.AvatarUrl,
    U.HeaderImageUrl,
    U.IsVerified,
    U.CreatedAt,
    (SELECT COUNT(*) FROM [Music].[Tracks] WHERE ArtistID = @ProfileUserID) AS TotalTracks,
    (SELECT COUNT(*) FROM [Interaction].[Follows] WHERE FollowingID = @ProfileUserID) AS FollowerCount,
    (SELECT COUNT(*) FROM [Interaction].[Follows] WHERE FollowerID = @ProfileUserID) AS FollowingCount,
    (SELECT SUM(PlayCount) FROM [Music].[Tracks] WHERE ArtistID = @ProfileUserID) AS TotalPlays
FROM [Identity].[Users] U
WHERE U.UserID = @ProfileUserID;
GO

-- =============================================
-- QUERY 6: Türe Göre Şarkı Arama
-- =============================================
DECLARE @GenreName NVARCHAR(50) = 'Trap';

SELECT 
    T.TrackID,
    T.Title,
    T.Slug,
    U.Username AS Artist,
    T.DurationSeconds,
    COUNT(DISTINCT P.PlayID) AS PlayCount
FROM [Music].[Tracks] T
INNER JOIN [Identity].[Users] U ON T.ArtistID = U.UserID
INNER JOIN [Music].[Genres] G ON T.GenreID = G.GenreID
LEFT JOIN [Interaction].[Plays] P ON T.TrackID = P.TrackID
WHERE G.Name = @GenreName AND T.IsPublic = 1
GROUP BY T.TrackID, T.Title, T.Slug, U.Username, T.DurationSeconds
ORDER BY PlayCount DESC;
GO

-- =============================================
-- QUERY 7: Kullanıcının Beğendiği Şarkılar (Library)
-- =============================================
DECLARE @LikedByUserID INT = 4;

SELECT 
    T.TrackID,
    T.Title,
    T.Slug,
    U.Username AS Artist,
    L.LikedAt
FROM [Interaction].[Likes] L
INNER JOIN [Music].[Tracks] T ON L.TrackID = T.TrackID
INNER JOIN [Identity].[Users] U ON T.ArtistID = U.UserID
WHERE L.UserID = @LikedByUserID
ORDER BY L.LikedAt DESC;
GO

-- =============================================
-- QUERY 8: Haftalık Trend Şarkılar (Son 7 gün)
-- =============================================
SELECT TOP 20
    T.TrackID,
    T.Title,
    U.Username AS Artist,
    COUNT(P.PlayID) AS PlaysLastWeek,
    COUNT(DISTINCT P.UserID) AS UniqueListeners
FROM [Music].[Tracks] T
INNER JOIN [Identity].[Users] U ON T.ArtistID = U.UserID
INNER JOIN [Interaction].[Plays] P ON T.TrackID = P.TrackID
WHERE P.PlayedAt >= DATEADD(DAY, -7, GETDATE())
  AND T.IsPublic = 1
GROUP BY T.TrackID, T.Title, U.Username
ORDER BY PlaysLastWeek DESC;
GO

PRINT 'Tüm sorgular hazır!';
GO
