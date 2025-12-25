-- =============================================
-- FREKANS - Database Triggers
-- =============================================
-- Otomatik veri güncellemeleri ve iş kuralları
-- =============================================

USE FrekansDB;
GO

PRINT '';
PRINT '========================================';
PRINT '🔥 TRIGGER''LAR OLUŞTURULUYOR...';
PRINT '========================================';
GO

-- =============================================
-- TRIGGER 1: Otomatik PlayCount Güncelleme
-- =============================================
-- Amaç: Interaction.Plays tablosuna kayıt eklendiğinde
--       Music.Tracks tablosundaki PlayCount'u otomatik artır
-- Senaryo: Her şarkı dinlendiğinde gerçek zamanlı sayaç
-- =============================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdatePlayCount')
    DROP TRIGGER [Interaction].[trg_UpdatePlayCount];
GO

CREATE TRIGGER [Interaction].[trg_UpdatePlayCount]
ON [Interaction].[Plays]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Her eklenen kayıt için TrackID'yi al ve PlayCount'u artır
    UPDATE [Music].[Tracks]
    SET PlayCount = PlayCount + 1
    WHERE TrackID IN (SELECT DISTINCT TrackID FROM inserted);
    
    -- Log için mesaj (opsiyonel)
    DECLARE @AffectedTracks INT = @@ROWCOUNT;
    IF @AffectedTracks > 0
        PRINT '✅ PlayCount güncellendi: ' + CAST(@AffectedTracks AS NVARCHAR(10)) + ' şarkı';
END
GO

PRINT '✓ [Interaction].[trg_UpdatePlayCount] oluşturuldu';
PRINT '  → Plays tablosuna INSERT olduğunda PlayCount otomatik artar';
GO

-- =============================================
-- TRIGGER 2: Otomatik FollowerCount Güncelleme
-- =============================================
-- Amaç: Takipçi eklenince/çıkarılınca kullanıcının
--       FollowerCount ve FollowingCount değerlerini güncelle
-- Senaryo: Takip/Takipten çık butonları
-- =============================================

-- Önce Users tablosuna FollowerCount ve FollowingCount kolonları ekle (yoksa)
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('[Identity].[Users]') 
               AND name = 'FollowerCount')
BEGIN
    ALTER TABLE [Identity].[Users]
    ADD FollowerCount INT NOT NULL DEFAULT 0;
    
    PRINT '✅ FollowerCount kolonu eklendi';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('[Identity].[Users]') 
               AND name = 'FollowingCount')
BEGIN
    ALTER TABLE [Identity].[Users]
    ADD FollowingCount INT NOT NULL DEFAULT 0;
    
    PRINT '✅ FollowingCount kolonu eklendi';
END
GO

-- Mevcut verileri güncelle (ilk kurulumda)
UPDATE u
SET 
    FollowerCount = (SELECT COUNT(*) FROM [Interaction].[Follows] WHERE FollowingID = u.UserID),
    FollowingCount = (SELECT COUNT(*) FROM [Interaction].[Follows] WHERE FollowerID = u.UserID)
FROM [Identity].[Users] u;
GO

PRINT '📊 Mevcut takipçi sayıları güncellendi';
GO

-- INSERT Trigger
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateFollowerCount_Insert')
    DROP TRIGGER [Interaction].[trg_UpdateFollowerCount_Insert];
GO

CREATE TRIGGER [Interaction].[trg_UpdateFollowerCount_Insert]
ON [Interaction].[Follows]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Takip edilen kullanıcının FollowerCount'unu artır
    UPDATE [Identity].[Users]
    SET FollowerCount = FollowerCount + 1
    WHERE UserID IN (SELECT DISTINCT FollowingID FROM inserted);
    
    -- Takip eden kullanıcının FollowingCount'unu artır
    UPDATE [Identity].[Users]
    SET FollowingCount = FollowingCount + 1
    WHERE UserID IN (SELECT DISTINCT FollowerID FROM inserted);
    
    PRINT '✅ Yeni takip: FollowerCount ve FollowingCount güncellendi';
END
GO

PRINT '✓ [Interaction].[trg_UpdateFollowerCount_Insert] oluşturuldu';
GO

-- DELETE Trigger
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateFollowerCount_Delete')
    DROP TRIGGER [Interaction].[trg_UpdateFollowerCount_Delete];
GO

CREATE TRIGGER [Interaction].[trg_UpdateFollowerCount_Delete]
ON [Interaction].[Follows]
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Takip edilen kullanıcının FollowerCount'unu azalt
    UPDATE [Identity].[Users]
    SET FollowerCount = FollowerCount - 1
    WHERE UserID IN (SELECT DISTINCT FollowingID FROM deleted)
      AND FollowerCount > 0; -- Negatif olmasın
    
    -- Takip eden kullanıcının FollowingCount'unu azalt
    UPDATE [Identity].[Users]
    SET FollowingCount = FollowingCount - 1
    WHERE UserID IN (SELECT DISTINCT FollowerID FROM deleted)
      AND FollowingCount > 0; -- Negatif olmasın
    
    PRINT '✅ Takipten çıkıldı: FollowerCount ve FollowingCount güncellendi';
END
GO

PRINT '✓ [Interaction].[trg_UpdateFollowerCount_Delete] oluşturuldu';
PRINT '  → Follows tablosunda INSERT/DELETE olunca sayaçlar otomatik güncellenir';
GO

-- =============================================
-- TRIGGER 3: Spam Önleme Trigger
-- =============================================
-- Amaç: Aynı kullanıcı aynı şarkıya 5 saniye içinde
--       birden fazla yorum yapmasını engelle
-- Senaryo: Bot/Spam koruması
-- =============================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_PreventCommentSpam')
    DROP TRIGGER [Interaction].[trg_PreventCommentSpam];
GO

CREATE TRIGGER [Interaction].[trg_PreventCommentSpam]
ON [Interaction].[Comments]
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Son 5 saniye içinde aynı kullanıcı + aynı şarkı kontrolü
    IF EXISTS (
        SELECT 1
        FROM [Interaction].[Comments] c
        INNER JOIN inserted i ON c.UserID = i.UserID AND c.TrackID = i.TrackID
        WHERE c.PostedAt > DATEADD(SECOND, -5, GETDATE())
    )
    BEGIN
        -- Spam tespit edildi!
        ;THROW 50001, '⚠️ Spam koruması: Aynı şarkıya çok hızlı yorum yapamazsınız. 5 saniye bekleyin.', 1;
    END
    
    -- Normal yorum ekle
    INSERT INTO [Interaction].[Comments] (UserID, TrackID, Content, TimestampSeconds, PostedAt)
    SELECT UserID, TrackID, Content, TimestampSeconds, PostedAt
    FROM inserted;
    
    PRINT '✅ Yorum eklendi (spam kontrolü geçildi)';
END
GO

PRINT '✓ [Interaction].[trg_PreventCommentSpam] oluşturuldu';
PRINT '  → 5 saniye içinde aynı şarkıya tekrar yorum engellenir';
GO

-- =============================================
-- TRIGGER 4: Audit Log Trigger
-- =============================================
-- Amaç: Kullanıcı profil değişikliklerini logla
-- Senaryo: Güvenlik ve history tracking
-- =============================================

-- Audit tablosu oluştur (yoksa)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Audit')
BEGIN
    EXEC('CREATE SCHEMA [Audit]');
    PRINT '✅ Audit şeması oluşturuldu';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserProfileChanges' AND schema_id = SCHEMA_ID('Audit'))
BEGIN
    CREATE TABLE [Audit].[UserProfileChanges]
    (
        ChangeID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        FieldChanged NVARCHAR(50) NOT NULL,
        OldValue NVARCHAR(MAX) NULL,
        NewValue NVARCHAR(MAX) NULL,
        ChangedAt DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        ChangedByIP NVARCHAR(50) NULL -- Opsiyonel: IP adresi
    );
    
    CREATE INDEX IX_UserProfileChanges_UserID ON [Audit].[UserProfileChanges](UserID, ChangedAt DESC);
    
    PRINT '✅ Audit.UserProfileChanges tablosu oluşturuldu';
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_AuditUserProfileChanges')
    DROP TRIGGER [Identity].[trg_AuditUserProfileChanges];
GO

CREATE TRIGGER [Identity].[trg_AuditUserProfileChanges]
ON [Identity].[Users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Username değişikliği
    INSERT INTO [Audit].[UserProfileChanges] (UserID, FieldChanged, OldValue, NewValue)
    SELECT i.UserID, 'Username', d.Username, i.Username
    FROM inserted i
    INNER JOIN deleted d ON i.UserID = d.UserID
    WHERE i.Username <> d.Username;
    
    -- Email değişikliği
    INSERT INTO [Audit].[UserProfileChanges] (UserID, FieldChanged, OldValue, NewValue)
    SELECT i.UserID, 'Email', d.Email, i.Email
    FROM inserted i
    INNER JOIN deleted d ON i.UserID = d.UserID
    WHERE i.Email <> d.Email;
    
    -- Bio değişikliği
    INSERT INTO [Audit].[UserProfileChanges] (UserID, FieldChanged, OldValue, NewValue)
    SELECT i.UserID, 'Bio', d.Bio, i.Bio
    FROM inserted i
    INNER JOIN deleted d ON i.UserID = d.UserID
    WHERE ISNULL(i.Bio, '') <> ISNULL(d.Bio, '');
    
    -- Avatar değişikliği
    INSERT INTO [Audit].[UserProfileChanges] (UserID, FieldChanged, OldValue, NewValue)
    SELECT i.UserID, 'AvatarUrl', d.AvatarUrl, i.AvatarUrl
    FROM inserted i
    INNER JOIN deleted d ON i.UserID = d.UserID
    WHERE ISNULL(i.AvatarUrl, '') <> ISNULL(d.AvatarUrl, '');
    
    DECLARE @LogCount INT = @@ROWCOUNT;
    IF @LogCount > 0
        PRINT '📝 Audit log: ' + CAST(@LogCount AS NVARCHAR(10)) + ' değişiklik kaydedildi';
END
GO

PRINT '✓ [Identity].[trg_AuditUserProfileChanges] oluşturuldu';
PRINT '  → Kullanıcı profil değişiklikleri Audit.UserProfileChanges tablosuna loglanır';
GO

-- =============================================
-- TRIGGER 5: Track Silme Koruması
-- =============================================
-- Amaç: Beğeni/yorum alan şarkıların silinmesini engelle
-- Senaryo: Yanlışlıkla popüler içerik silinmesini önle
-- =============================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_PreventPopularTrackDeletion')
    DROP TRIGGER [Music].[trg_PreventPopularTrackDeletion];
GO

CREATE TRIGGER [Music].[trg_PreventPopularTrackDeletion]
ON [Music].[Tracks]
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Silinmek istenen şarkıların ID'leri
    DECLARE @TrackToDelete TABLE (TrackID INT, Title NVARCHAR(200), PlayCount INT, LikeCount INT);
    
    INSERT INTO @TrackToDelete (TrackID, Title, PlayCount, LikeCount)
    SELECT 
        d.TrackID, 
        d.Title,
        d.PlayCount,
        (SELECT COUNT(*) FROM [Interaction].[Likes] l WHERE l.TrackID = d.TrackID)
    FROM deleted d;
    
    -- 100+ dinlenme veya 10+ beğeni olan şarkıları kontrol et
    IF EXISTS (SELECT 1 FROM @TrackToDelete WHERE PlayCount >= 100 OR LikeCount >= 10)
    BEGIN
        DECLARE @PopularTrack NVARCHAR(200);
        SELECT TOP 1 @PopularTrack = Title FROM @TrackToDelete WHERE PlayCount >= 100 OR LikeCount >= 10;
        
        RAISERROR('⚠️ Popüler içerik koruması: "%s" şarkısı 100+ dinlenme veya 10+ beğeniye sahip olduğu için silinemez!', 16, 1, @PopularTrack);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- Eğer popüler değilse normal sil
    DELETE FROM [Music].[Tracks]
    WHERE TrackID IN (SELECT TrackID FROM deleted);
    
    PRINT '✅ Şarkı silindi (popüler değildi)';
END
GO

PRINT '✓ [Music].[trg_PreventPopularTrackDeletion] oluşturuldu';
PRINT '  → 100+ dinlenme veya 10+ beğeni alan şarkılar silinemez';
GO

PRINT '';
PRINT '========================================';
PRINT '✅ TÜM TRIGGER''LAR OLUŞTURULDU!';
PRINT '========================================';
PRINT '';
PRINT '📦 ÖZET:';
PRINT '  1. trg_UpdatePlayCount - PlayCount otomatik güncelleme';
PRINT '  2. trg_UpdateFollowerCount_Insert - Takipçi sayısı artır';
PRINT '  3. trg_UpdateFollowerCount_Delete - Takipçi sayısı azalt';
PRINT '  4. trg_PreventCommentSpam - Spam yorumları engelle';
PRINT '  5. trg_AuditUserProfileChanges - Profil değişikliklerini logla';
PRINT '  6. trg_PreventPopularTrackDeletion - Popüler içerik silme koruması';
PRINT '';
PRINT '🔧 Test Komutları:';
PRINT '  -- PlayCount testi:';
PRINT '  INSERT INTO Interaction.Plays (TrackID, UserID) VALUES (1, 1);';
PRINT '  SELECT TrackID, PlayCount FROM Music.Tracks WHERE TrackID = 1;';
PRINT '';
PRINT '  -- Takipçi sayısı testi:';
PRINT '  INSERT INTO Interaction.Follows (FollowerID, FollowingID) VALUES (2, 1);';
PRINT '  SELECT UserID, FollowerCount, FollowingCount FROM Identity.Users WHERE UserID IN (1,2);';
PRINT '';
PRINT '  -- Spam koruması testi:';
PRINT '  INSERT INTO Interaction.Comments (UserID, TrackID, Content) VALUES (1, 1, ''Test 1'');';
PRINT '  INSERT INTO Interaction.Comments (UserID, TrackID, Content) VALUES (1, 1, ''Test 2''); -- HATA!';
PRINT '';
PRINT '  -- Audit log kontrolü:';
PRINT '  UPDATE Identity.Users SET Bio = ''Yeni bio'' WHERE UserID = 1;';
PRINT '  SELECT * FROM Audit.UserProfileChanges ORDER BY ChangedAt DESC;';
PRINT '';
PRINT '========================================';
GO
