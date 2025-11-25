-- =============================================
-- SoundCloud Clone - Sample Data Insert
-- =============================================
-- Test ve demo için örnek veriler
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- 1. Identity Schema - Kullanıcılar
-- =============================================
INSERT INTO [Identity].[Users] (Username, Email, PasswordHash, Bio, AvatarUrl, IsVerified)
VALUES
    ('DJShadow', 'djshadow@example.com', 'HASH123', 'Professional trap producer 🎵', '/avatars/djshadow.jpg', 1),
    ('BeatsbyAli', 'ali@example.com', 'HASH456', 'Lo-Fi & Chill beats creator', '/avatars/ali.jpg', 1),
    ('SarahVocals', 'sarah@example.com', 'HASH789', 'Singer & Songwriter 🎤', '/avatars/sarah.jpg', 0),
    ('ListenerJohn', 'john@example.com', 'HASH000', 'Music lover', NULL, 0);
GO

PRINT '4 kullanıcı eklendi.';
GO

-- =============================================
-- 2. Music Schema - Türler
-- =============================================
INSERT INTO [Music].[Genres] (Name)
VALUES
    ('Trap'),
    ('Lo-Fi'),
    ('House'),
    ('Hip-Hop'),
    ('Electronic'),
    ('Ambient');
GO

PRINT '6 müzik türü eklendi.';
GO

-- =============================================
-- 3. Music Schema - Albümler
-- =============================================
INSERT INTO [Music].[Albums] (ArtistID, Title, CoverImageUrl, ReleaseDate, Description)
VALUES
    (1, 'Dark Nights Vol.1', '/covers/dark-nights.jpg', '2024-06-15', 'Trap beats collection'),
    (2, 'Chill Sundays', '/covers/chill-sundays.jpg', '2024-08-20', 'Perfect for relaxing');
GO

PRINT '2 albüm eklendi.';
GO

-- =============================================
-- 4. Music Schema - Şarkılar
-- =============================================
INSERT INTO [Music].[Tracks] (ArtistID, AlbumID, GenreID, Title, Slug, AudioUrl, DurationSeconds, WaveformData, IsPublic)
VALUES
    (1, 1, 1, 'Midnight Trap', 'midnight-trap', '/audio/midnight-trap.mp3', 195, '[0.2,0.5,0.8,0.6,0.9,0.7,0.4]', 1),
    (1, 1, 1, 'Shadow Beats', 'shadow-beats', '/audio/shadow-beats.mp3', 210, '[0.3,0.6,0.7,0.5,0.8,0.6,0.3]', 1),
    (2, 2, 2, 'Coffee Morning', 'coffee-morning', '/audio/coffee-morning.mp3', 180, '[0.1,0.3,0.4,0.3,0.5,0.4,0.2]', 1),
    (2, NULL, 2, 'Rainy Day', 'rainy-day', '/audio/rainy-day.mp3', 165, '[0.2,0.4,0.3,0.5,0.4,0.3,0.2]', 1),
    (3, NULL, 4, 'Dreams', 'dreams-sarah', '/audio/dreams.mp3', 240, '[0.4,0.7,0.8,0.9,0.7,0.5,0.3]', 1);
GO

PRINT '5 şarkı eklendi.';
GO

-- =============================================
-- 5. Interaction Schema - Dinlemeler
-- =============================================
INSERT INTO [Interaction].[Plays] (TrackID, UserID, PlayedAt)
VALUES
    (1, 3, DATEADD(DAY, -5, GETDATE())),
    (1, 4, DATEADD(DAY, -4, GETDATE())),
    (1, 3, DATEADD(DAY, -2, GETDATE())),
    (2, 4, DATEADD(DAY, -3, GETDATE())),
    (3, 1, DATEADD(DAY, -1, GETDATE())),
    (3, 4, DATEADD(HOUR, -5, GETDATE())),
    (5, 1, DATEADD(HOUR, -2, GETDATE()));
GO

PRINT '7 dinleme kaydı eklendi.';
GO

-- =============================================
-- 6. Interaction Schema - Beğeniler
-- =============================================
INSERT INTO [Interaction].[Likes] (UserID, TrackID, LikedAt)
VALUES
    (3, 1, DATEADD(DAY, -5, GETDATE())),
    (4, 1, DATEADD(DAY, -4, GETDATE())),
    (4, 2, DATEADD(DAY, -3, GETDATE())),
    (1, 3, DATEADD(DAY, -1, GETDATE())),
    (4, 3, DATEADD(HOUR, -5, GETDATE()));
GO

PRINT '5 beğeni eklendi.';
GO

-- =============================================
-- 7. Interaction Schema - Yorumlar
-- =============================================
INSERT INTO [Interaction].[Comments] (UserID, TrackID, Content, TimestampSeconds, PostedAt)
VALUES
    (3, 1, 'Amazing beat! 🔥', 45, DATEADD(DAY, -5, GETDATE())),
    (4, 1, 'Drop is insane at 1:30', 90, DATEADD(DAY, -4, GETDATE())),
    (4, 3, 'Perfect for studying', 30, DATEADD(HOUR, -5, GETDATE())),
    (1, 5, 'Beautiful vocals Sarah!', NULL, DATEADD(HOUR, -2, GETDATE()));
GO

PRINT '4 yorum eklendi.';
GO

-- =============================================
-- 8. Interaction Schema - Takip Sistemi
-- =============================================
INSERT INTO [Interaction].[Follows] (FollowerID, FollowingID, FollowDate)
VALUES
    (3, 1, DATEADD(DAY, -10, GETDATE())),
    (3, 2, DATEADD(DAY, -8, GETDATE())),
    (4, 1, DATEADD(DAY, -7, GETDATE())),
    (4, 2, DATEADD(DAY, -6, GETDATE())),
    (4, 3, DATEADD(DAY, -5, GETDATE())),
    (1, 2, DATEADD(DAY, -3, GETDATE()));
GO

PRINT '6 takip ilişkisi eklendi.';
GO

PRINT '';
PRINT '========================================';
PRINT 'Örnek veriler başarıyla eklendi!';
PRINT '========================================';
GO
