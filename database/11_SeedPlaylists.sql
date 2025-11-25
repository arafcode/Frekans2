-- =============================================
-- SoundCloud Clone - Seed Playlists with Random Tracks
-- =============================================
-- Her kullanıcı için çalma listeleri oluşturur ve rastgele şarkılar ekler
-- =============================================

USE FrekansDB;
GO

PRINT '🎵 Kullanıcılar için çalma listeleri oluşturuluyor...';
GO

-- =============================================
-- Her kullanıcı için çalma listeleri oluştur
-- =============================================

DECLARE @UserID INT;
DECLARE @PlaylistID INT;
DECLARE @TrackID INT;
DECLARE @Counter INT;
DECLARE @TrackCount INT;
DECLARE @PlaylistName NVARCHAR(200);
DECLARE @Username NVARCHAR(100);

-- Kullanıcıları dolaş
DECLARE user_cursor CURSOR FOR 
SELECT UserID, Username FROM [Identity].[Users];

OPEN user_cursor;
FETCH NEXT FROM user_cursor INTO @UserID, @Username;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT '👤 ' + @Username + ' için çalma listeleri oluşturuluyor...';
    
    -- =============================================
    -- Çalma Listesi 1: Favorilerim
    -- =============================================
    SET @PlaylistName = 'Favorilerim';
    
    INSERT INTO [Music].[Playlists] (UserID, Name, Description, IsPublic, CoverImageUrl)
    VALUES (
        @UserID, 
        @PlaylistName,
        'En sevdiğim şarkılar',
        1,
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop'
    );
    
    SET @PlaylistID = SCOPE_IDENTITY();
    SET @Counter = 0;
    
    -- Rastgele 5-8 şarkı ekle
    SET @TrackCount = 5 + (ABS(CHECKSUM(NEWID())) % 4); -- 5 ile 8 arası
    
    DECLARE track_cursor1 CURSOR FOR
    SELECT TOP (@TrackCount) TrackID 
    FROM [Music].[Tracks]
    ORDER BY NEWID(); -- Rastgele sırala
    
    OPEN track_cursor1;
    FETCH NEXT FROM track_cursor1 INTO @TrackID;
    
    WHILE @@FETCH_STATUS = 0 AND @Counter < @TrackCount
    BEGIN
        INSERT INTO [Music].[PlaylistTracks] (PlaylistID, TrackID, TrackOrder)
        VALUES (@PlaylistID, @TrackID, @Counter + 1);
        
        SET @Counter = @Counter + 1;
        FETCH NEXT FROM track_cursor1 INTO @TrackID;
    END;
    
    CLOSE track_cursor1;
    DEALLOCATE track_cursor1;
    
    PRINT '  ✅ ' + @PlaylistName + ' oluşturuldu (' + CAST(@Counter AS NVARCHAR(10)) + ' şarkı)';
    
    -- =============================================
    -- Çalma Listesi 2: Chill Vibes
    -- =============================================
    SET @PlaylistName = 'Chill Vibes';
    
    INSERT INTO [Music].[Playlists] (UserID, Name, Description, IsPublic, CoverImageUrl)
    VALUES (
        @UserID, 
        @PlaylistName,
        'Rahatlamak için mükemmel',
        1,
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
    );
    
    SET @PlaylistID = SCOPE_IDENTITY();
    SET @Counter = 0;
    
    -- Rastgele 4-7 şarkı ekle
    SET @TrackCount = 4 + (ABS(CHECKSUM(NEWID())) % 4); -- 4 ile 7 arası
    
    DECLARE track_cursor2 CURSOR FOR
    SELECT TOP (@TrackCount) TrackID 
    FROM [Music].[Tracks]
    ORDER BY NEWID();
    
    OPEN track_cursor2;
    FETCH NEXT FROM track_cursor2 INTO @TrackID;
    
    WHILE @@FETCH_STATUS = 0 AND @Counter < @TrackCount
    BEGIN
        -- Aynı şarkı bu listede yoksa ekle
        IF NOT EXISTS (SELECT 1 FROM [Music].[PlaylistTracks] WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID)
        BEGIN
            INSERT INTO [Music].[PlaylistTracks] (PlaylistID, TrackID, TrackOrder)
            VALUES (@PlaylistID, @TrackID, @Counter + 1);
            SET @Counter = @Counter + 1;
        END;
        
        FETCH NEXT FROM track_cursor2 INTO @TrackID;
    END;
    
    CLOSE track_cursor2;
    DEALLOCATE track_cursor2;
    
    PRINT '  ✅ ' + @PlaylistName + ' oluşturuldu (' + CAST(@Counter AS NVARCHAR(10)) + ' şarkı)';
    
    -- =============================================
    -- Çalma Listesi 3: Workout Mix
    -- =============================================
    SET @PlaylistName = 'Workout Mix';
    
    INSERT INTO [Music].[Playlists] (UserID, Name, Description, IsPublic, CoverImageUrl)
    VALUES (
        @UserID, 
        @PlaylistName,
        'Spor yaparken dinlenecek enerjik müzikler',
        1,
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300&h=300&fit=crop'
    );
    
    SET @PlaylistID = SCOPE_IDENTITY();
    SET @Counter = 0;
    
    -- Rastgele 6-10 şarkı ekle
    SET @TrackCount = 6 + (ABS(CHECKSUM(NEWID())) % 5); -- 6 ile 10 arası
    
    DECLARE track_cursor3 CURSOR FOR
    SELECT TOP (@TrackCount) TrackID 
    FROM [Music].[Tracks]
    ORDER BY NEWID();
    
    OPEN track_cursor3;
    FETCH NEXT FROM track_cursor3 INTO @TrackID;
    
    WHILE @@FETCH_STATUS = 0 AND @Counter < @TrackCount
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM [Music].[PlaylistTracks] WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID)
        BEGIN
            INSERT INTO [Music].[PlaylistTracks] (PlaylistID, TrackID, TrackOrder)
            VALUES (@PlaylistID, @TrackID, @Counter + 1);
            SET @Counter = @Counter + 1;
        END;
        
        FETCH NEXT FROM track_cursor3 INTO @TrackID;
    END;
    
    CLOSE track_cursor3;
    DEALLOCATE track_cursor3;
    
    PRINT '  ✅ ' + @PlaylistName + ' oluşturuldu (' + CAST(@Counter AS NVARCHAR(10)) + ' şarkı)';
    
    -- =============================================
    -- Çalma Listesi 4: Night Drive (Bazı kullanıcılara)
    -- =============================================
    -- %70 olasılıkla ekle
    IF (ABS(CHECKSUM(NEWID())) % 10) < 7
    BEGIN
        SET @PlaylistName = 'Night Drive';
        
        INSERT INTO [Music].[Playlists] (UserID, Name, Description, IsPublic, CoverImageUrl)
        VALUES (
            @UserID, 
            @PlaylistName,
            'Gece sürüşleri için',
            1,
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop'
        );
        
        SET @PlaylistID = SCOPE_IDENTITY();
        SET @Counter = 0;
        
        -- Rastgele 5-8 şarkı ekle
        SET @TrackCount = 5 + (ABS(CHECKSUM(NEWID())) % 4);
        
        DECLARE track_cursor4 CURSOR FOR
        SELECT TOP (@TrackCount) TrackID 
        FROM [Music].[Tracks]
        ORDER BY NEWID();
        
        OPEN track_cursor4;
        FETCH NEXT FROM track_cursor4 INTO @TrackID;
        
        WHILE @@FETCH_STATUS = 0 AND @Counter < @TrackCount
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [Music].[PlaylistTracks] WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID)
            BEGIN
                INSERT INTO [Music].[PlaylistTracks] (PlaylistID, TrackID, TrackOrder)
                VALUES (@PlaylistID, @TrackID, @Counter + 1);
                SET @Counter = @Counter + 1;
            END;
            
            FETCH NEXT FROM track_cursor4 INTO @TrackID;
        END;
        
        CLOSE track_cursor4;
        DEALLOCATE track_cursor4;
        
        PRINT '  ✅ ' + @PlaylistName + ' oluşturuldu (' + CAST(@Counter AS NVARCHAR(10)) + ' şarkı)';
    END;
    
    -- =============================================
    -- Çalma Listesi 5: Study Session (Bazı kullanıcılara)
    -- =============================================
    -- %60 olasılıkla ekle
    IF (ABS(CHECKSUM(NEWID())) % 10) < 6
    BEGIN
        SET @PlaylistName = 'Study Session';
        
        INSERT INTO [Music].[Playlists] (UserID, Name, Description, IsPublic, CoverImageUrl)
        VALUES (
            @UserID, 
            @PlaylistName,
            'Çalışırken konsantrasyonu artıran müzikler',
            1,
            'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop'
        );
        
        SET @PlaylistID = SCOPE_IDENTITY();
        SET @Counter = 0;
        
        -- Rastgele 4-6 şarkı ekle
        SET @TrackCount = 4 + (ABS(CHECKSUM(NEWID())) % 3);
        
        DECLARE track_cursor5 CURSOR FOR
        SELECT TOP (@TrackCount) TrackID 
        FROM [Music].[Tracks]
        ORDER BY NEWID();
        
        OPEN track_cursor5;
        FETCH NEXT FROM track_cursor5 INTO @TrackID;
        
        WHILE @@FETCH_STATUS = 0 AND @Counter < @TrackCount
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [Music].[PlaylistTracks] WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID)
            BEGIN
                INSERT INTO [Music].[PlaylistTracks] (PlaylistID, TrackID, TrackOrder)
                VALUES (@PlaylistID, @TrackID, @Counter + 1);
                SET @Counter = @Counter + 1;
            END;
            
            FETCH NEXT FROM track_cursor5 INTO @TrackID;
        END;
        
        CLOSE track_cursor5;
        DEALLOCATE track_cursor5;
        
        PRINT '  ✅ ' + @PlaylistName + ' oluşturuldu (' + CAST(@Counter AS NVARCHAR(10)) + ' şarkı)';
    END;
    
    PRINT '';
    FETCH NEXT FROM user_cursor INTO @UserID, @Username;
END;

CLOSE user_cursor;
DEALLOCATE user_cursor;
GO

-- =============================================
-- İstatistikleri göster
-- =============================================
PRINT '📊 Çalma Listesi İstatistikleri:';
PRINT '==================================';

SELECT 
    u.Username,
    COUNT(p.PlaylistID) AS 'Çalma Listesi Sayısı',
    SUM((SELECT COUNT(*) FROM [Music].[PlaylistTracks] WHERE PlaylistID = p.PlaylistID)) AS 'Toplam Şarkı'
FROM [Identity].[Users] u
LEFT JOIN [Music].[Playlists] p ON u.UserID = p.UserID
GROUP BY u.UserID, u.Username
ORDER BY u.Username;
GO

PRINT '';
PRINT '🎉 Tüm kullanıcılar için çalma listeleri başarıyla oluşturuldu!';
PRINT '';
PRINT 'Her kullanıcı için oluşturulan listeler:';
PRINT '  ✅ Favorilerim (5-8 şarkı)';
PRINT '  ✅ Chill Vibes (4-7 şarkı)';
PRINT '  ✅ Workout Mix (6-10 şarkı)';
PRINT '  ✅ Night Drive (%70 olasılık, 5-8 şarkı)';
PRINT '  ✅ Study Session (%60 olasılık, 4-6 şarkı)';
GO
