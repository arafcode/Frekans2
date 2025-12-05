-- =============================================
-- SoundCloud Clone - Playlist System
-- =============================================
-- Çalma listeleri sistemi
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- Table: Music.Playlists
-- =============================================
IF OBJECT_ID('[Music].[Playlists]', 'U') IS NOT NULL
    DROP TABLE [Music].[Playlists];
GO

CREATE TABLE [Music].[Playlists]
(
    PlaylistID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500) NULL,
    CoverImageUrl NVARCHAR(500) NULL,
    IsPublic BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT PK_Playlists PRIMARY KEY CLUSTERED (PlaylistID ASC),
    
    CONSTRAINT FK_Playlists_User FOREIGN KEY (UserID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_Playlists_UserID 
ON [Music].[Playlists] (UserID);
GO

PRINT 'Music.Playlists tablosu oluşturuldu.';
GO

-- =============================================
-- Table: Music.PlaylistTracks
-- =============================================
IF OBJECT_ID('[Music].[PlaylistTracks]', 'U') IS NOT NULL
    DROP TABLE [Music].[PlaylistTracks];
GO

CREATE TABLE [Music].[PlaylistTracks]
(
    PlaylistTrackID INT IDENTITY(1,1) NOT NULL,
    PlaylistID INT NOT NULL,
    TrackID INT NOT NULL,
    AddedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    TrackOrder INT NOT NULL DEFAULT 0,
    
    CONSTRAINT PK_PlaylistTracks PRIMARY KEY CLUSTERED (PlaylistTrackID ASC),
    
    CONSTRAINT FK_PlaylistTracks_Playlist FOREIGN KEY (PlaylistID)
        REFERENCES [Music].[Playlists](PlaylistID)
        ON DELETE CASCADE,
        
    CONSTRAINT FK_PlaylistTracks_Track FOREIGN KEY (TrackID)
        REFERENCES [Music].[Tracks](TrackID)
        ON DELETE CASCADE,
    
    CONSTRAINT UQ_PlaylistTracks UNIQUE (PlaylistID, TrackID)
);
GO

CREATE NONCLUSTERED INDEX IX_PlaylistTracks_PlaylistID 
ON [Music].[PlaylistTracks] (PlaylistID);
GO

CREATE NONCLUSTERED INDEX IX_PlaylistTracks_TrackID 
ON [Music].[PlaylistTracks] (TrackID);
GO

PRINT 'Music.PlaylistTracks tablosu oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_CreatePlaylist
-- =============================================
IF OBJECT_ID('[Music].[sp_CreatePlaylist]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_CreatePlaylist];
GO

CREATE PROCEDURE [Music].[sp_CreatePlaylist]
    @UserID INT,
    @Name NVARCHAR(200),
    @Description NVARCHAR(500) = NULL,
    @CoverImageUrl NVARCHAR(500) = NULL,
    @IsPublic BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO [Music].[Playlists] (UserID, Name, Description, CoverImageUrl, IsPublic)
    VALUES (@UserID, @Name, @Description, @CoverImageUrl, @IsPublic);
    
    DECLARE @PlaylistID INT = SCOPE_IDENTITY();
    
    SELECT 
        PlaylistID,
        UserID,
        Name,
        Description,
        CoverImageUrl,
        IsPublic,
        CreatedDate,
        UpdatedDate,
        0 AS TrackCount
    FROM [Music].[Playlists]
    WHERE PlaylistID = @PlaylistID;
END;
GO

PRINT 'sp_CreatePlaylist oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_GetUserPlaylists
-- =============================================
IF OBJECT_ID('[Music].[sp_GetUserPlaylists]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_GetUserPlaylists];
GO

CREATE PROCEDURE [Music].[sp_GetUserPlaylists]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.PlaylistID,
        p.UserID,
        p.Name,
        p.Description,
        p.CoverImageUrl,
        p.IsPublic,
        p.CreatedDate,
        p.UpdatedDate,
        u.Username AS OwnerUsername,
        COUNT(pt.TrackID) AS TrackCount
    FROM [Music].[Playlists] p
    INNER JOIN [Identity].[Users] u ON p.UserID = u.UserID
    LEFT JOIN [Music].[PlaylistTracks] pt ON p.PlaylistID = pt.PlaylistID
    WHERE p.UserID = @UserID
    GROUP BY p.PlaylistID, p.UserID, p.Name, p.Description, p.CoverImageUrl, 
             p.IsPublic, p.CreatedDate, p.UpdatedDate, u.Username
    ORDER BY p.UpdatedDate DESC;
END;
GO

PRINT 'sp_GetUserPlaylists oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_GetPlaylistTracks
-- =============================================
IF OBJECT_ID('[Music].[sp_GetPlaylistTracks]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_GetPlaylistTracks];
GO

CREATE PROCEDURE [Music].[sp_GetPlaylistTracks]
    @PlaylistID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TrackID,
        t.Title,
        t.AudioUrl,
        t.CoverImageUrl,
        t.DurationSeconds AS Duration,
        t.Slug,
        u.Username,
        u.UserID,
        pt.AddedDate,
        pt.TrackOrder,
        (SELECT COUNT(*) FROM [Interaction].[Plays] WHERE TrackID = t.TrackID) AS PlayCount,
        (SELECT COUNT(*) FROM [Interaction].[Likes] WHERE TrackID = t.TrackID) AS LikeCount
    FROM [Music].[PlaylistTracks] pt
    INNER JOIN [Music].[Tracks] t ON pt.TrackID = t.TrackID
    INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
    WHERE pt.PlaylistID = @PlaylistID
    ORDER BY pt.TrackOrder, pt.AddedDate;
END;
GO

PRINT 'sp_GetPlaylistTracks oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_AddToPlaylist
-- =============================================
IF OBJECT_ID('[Music].[sp_AddToPlaylist]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_AddToPlaylist];
GO

CREATE PROCEDURE [Music].[sp_AddToPlaylist]
    @PlaylistID INT,
    @TrackID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu çalma listesine ekleme yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    -- Check if track already in playlist
    IF EXISTS (SELECT 1 FROM [Music].[PlaylistTracks] WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID)
    BEGIN
        RAISERROR('Bu şarkı zaten listede mevcut.', 16, 1);
        RETURN;
    END
    
    -- Get next order number
    DECLARE @NextOrder INT;
    SELECT @NextOrder = ISNULL(MAX(TrackOrder), 0) + 1
    FROM [Music].[PlaylistTracks]
    WHERE PlaylistID = @PlaylistID;
    
    -- Add track to playlist
    INSERT INTO [Music].[PlaylistTracks] (PlaylistID, TrackID, TrackOrder)
    VALUES (@PlaylistID, @TrackID, @NextOrder);
    
    -- Update playlist's UpdatedDate
    UPDATE [Music].[Playlists]
    SET UpdatedDate = GETDATE()
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 'Şarkı çalma listesine eklendi.' AS Message;
END;
GO

PRINT 'sp_AddToPlaylist oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_RemoveFromPlaylist
-- =============================================
IF OBJECT_ID('[Music].[sp_RemoveFromPlaylist]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_RemoveFromPlaylist];
GO

CREATE PROCEDURE [Music].[sp_RemoveFromPlaylist]
    @PlaylistID INT,
    @TrackID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu çalma listesinden çıkarma yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    -- Remove track from playlist
    DELETE FROM [Music].[PlaylistTracks]
    WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID;
    
    -- Update playlist's UpdatedDate
    UPDATE [Music].[Playlists]
    SET UpdatedDate = GETDATE()
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 'Şarkı çalma listesinden çıkarıldı.' AS Message;
END;
GO

PRINT 'sp_RemoveFromPlaylist oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_UpdatePlaylist
-- =============================================
IF OBJECT_ID('[Music].[sp_UpdatePlaylist]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_UpdatePlaylist];
GO

CREATE PROCEDURE [Music].[sp_UpdatePlaylist]
    @PlaylistID INT,
    @UserID INT,
    @Name NVARCHAR(200) = NULL,
    @Description NVARCHAR(500) = NULL,
    @CoverImageUrl NVARCHAR(500) = NULL,
    @IsPublic BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu çalma listesini güncelleme yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    UPDATE [Music].[Playlists]
    SET 
        Name = ISNULL(@Name, Name),
        Description = ISNULL(@Description, Description),
        CoverImageUrl = ISNULL(@CoverImageUrl, CoverImageUrl),
        IsPublic = ISNULL(@IsPublic, IsPublic),
        UpdatedDate = GETDATE()
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 
        PlaylistID,
        UserID,
        Name,
        Description,
        CoverImageUrl,
        IsPublic,
        CreatedDate,
        UpdatedDate
    FROM [Music].[Playlists]
    WHERE PlaylistID = @PlaylistID;
END;
GO

PRINT 'sp_UpdatePlaylist oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_DeletePlaylist
-- =============================================
IF OBJECT_ID('[Music].[sp_DeletePlaylist]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_DeletePlaylist];
GO

CREATE PROCEDURE [Music].[sp_DeletePlaylist]
    @PlaylistID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu çalma listesini silme yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    DELETE FROM [Music].[Playlists]
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 'Çalma listesi silindi.' AS Message;
END;
GO

PRINT 'sp_DeletePlaylist oluşturuldu.';
GO

PRINT '✅ Playlist sistemi başarıyla oluşturuldu!';
GO
