-- =============================================
-- SoundCloud Clone - Feedback System
-- =============================================
-- Geri bildirim, şikayet ve öneri sistemi
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- Table: Feedback.FeedbackTypes
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Feedback')
BEGIN
    EXEC('CREATE SCHEMA [Feedback]');
    PRINT 'Feedback schema oluşturuldu.';
END
GO

IF OBJECT_ID('[Feedback].[FeedbackTypes]', 'U') IS NOT NULL
    DROP TABLE [Feedback].[FeedbackTypes];
GO

CREATE TABLE [Feedback].[FeedbackTypes]
(
    TypeID INT IDENTITY(1,1) NOT NULL,
    TypeName NVARCHAR(50) NOT NULL,
    TypeKey NVARCHAR(50) NOT NULL,
    Description NVARCHAR(200) NULL,
    
    CONSTRAINT PK_FeedbackTypes PRIMARY KEY CLUSTERED (TypeID ASC),
    CONSTRAINT UQ_FeedbackTypes_Key UNIQUE (TypeKey)
);
GO

PRINT 'Feedback.FeedbackTypes tablosu oluşturuldu.';
GO

-- =============================================
-- Table: Feedback.Feedbacks
-- =============================================
IF OBJECT_ID('[Feedback].[Feedbacks]', 'U') IS NOT NULL
    DROP TABLE [Feedback].[Feedbacks];
GO

CREATE TABLE [Feedback].[Feedbacks]
(
    FeedbackID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    TypeID INT NOT NULL,
    Category NVARCHAR(50) NULL,
    Title NVARCHAR(200) NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, closed
    Priority NVARCHAR(20) NULL DEFAULT 'normal', -- low, normal, high, urgent
    AdminNotes NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    ReviewedBy INT NULL,
    ReviewedDate DATETIME2(7) NULL,
    
    CONSTRAINT PK_Feedbacks PRIMARY KEY CLUSTERED (FeedbackID ASC),
    
    CONSTRAINT FK_Feedbacks_User FOREIGN KEY (UserID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE CASCADE,
        
    CONSTRAINT FK_Feedbacks_Type FOREIGN KEY (TypeID)
        REFERENCES [Feedback].[FeedbackTypes](TypeID),
        
    CONSTRAINT FK_Feedbacks_ReviewedBy FOREIGN KEY (ReviewedBy)
        REFERENCES [Identity].[Users](UserID)
);
GO

CREATE NONCLUSTERED INDEX IX_Feedbacks_UserID 
ON [Feedback].[Feedbacks] (UserID);
GO

CREATE NONCLUSTERED INDEX IX_Feedbacks_Status 
ON [Feedback].[Feedbacks] (Status);
GO

CREATE NONCLUSTERED INDEX IX_Feedbacks_CreatedDate 
ON [Feedback].[Feedbacks] (CreatedDate DESC);
GO

PRINT 'Feedback.Feedbacks tablosu oluşturuldu.';
GO

-- =============================================
-- Seed FeedbackTypes
-- =============================================
INSERT INTO [Feedback].[FeedbackTypes] (TypeName, TypeKey, Description)
VALUES 
    ('Geri Bildirim', 'feedback', 'Genel geri bildirimler ve değerlendirmeler'),
    ('Şikayet', 'complaint', 'Sorun ve şikayet bildirimleri'),
    ('Öneri', 'suggestion', 'Yeni özellik ve iyileştirme önerileri');
GO

PRINT 'FeedbackTypes seed data eklendi.';
GO

-- =============================================
-- Stored Procedure: sp_CreateFeedback
-- =============================================
IF OBJECT_ID('[Feedback].[sp_CreateFeedback]', 'P') IS NOT NULL
    DROP PROCEDURE [Feedback].[sp_CreateFeedback];
GO

CREATE PROCEDURE [Feedback].[sp_CreateFeedback]
    @UserID INT,
    @TypeKey NVARCHAR(50),
    @Category NVARCHAR(50) = NULL,
    @Title NVARCHAR(200) = NULL,
    @Message NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TypeID INT;
    
    -- Get TypeID from TypeKey
    SELECT @TypeID = TypeID 
    FROM [Feedback].[FeedbackTypes]
    WHERE TypeKey = @TypeKey;
    
    IF @TypeID IS NULL
    BEGIN
        RAISERROR('Geçersiz feedback türü', 16, 1);
        RETURN;
    END
    
    INSERT INTO [Feedback].[Feedbacks] (UserID, TypeID, Category, Title, Message)
    VALUES (@UserID, @TypeID, @Category, @Title, @Message);
    
    DECLARE @FeedbackID INT = SCOPE_IDENTITY();
    
    SELECT 
        f.FeedbackID,
        f.UserID,
        u.Username,
        ft.TypeName,
        ft.TypeKey,
        f.Category,
        f.Title,
        f.Message,
        f.Status,
        f.Priority,
        f.CreatedDate
    FROM [Feedback].[Feedbacks] f
    INNER JOIN [Identity].[Users] u ON f.UserID = u.UserID
    INNER JOIN [Feedback].[FeedbackTypes] ft ON f.TypeID = ft.TypeID
    WHERE f.FeedbackID = @FeedbackID;
END;
GO

PRINT 'sp_CreateFeedback oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_GetAllFeedbacks
-- =============================================
IF OBJECT_ID('[Feedback].[sp_GetAllFeedbacks]', 'P') IS NOT NULL
    DROP PROCEDURE [Feedback].[sp_GetAllFeedbacks];
GO

CREATE PROCEDURE [Feedback].[sp_GetAllFeedbacks]
    @Status NVARCHAR(20) = NULL,
    @TypeKey NVARCHAR(50) = NULL,
    @Limit INT = 100,
    @Offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.FeedbackID,
        f.UserID,
        u.Username,
        u.Email,
        ft.TypeName,
        ft.TypeKey,
        f.Category,
        f.Title,
        f.Message,
        f.Status,
        f.Priority,
        f.AdminNotes,
        f.CreatedDate,
        f.UpdatedDate,
        f.ReviewedBy,
        f.ReviewedDate,
        reviewer.Username AS ReviewerUsername
    FROM [Feedback].[Feedbacks] f
    INNER JOIN [Identity].[Users] u ON f.UserID = u.UserID
    INNER JOIN [Feedback].[FeedbackTypes] ft ON f.TypeID = ft.TypeID
    LEFT JOIN [Identity].[Users] reviewer ON f.ReviewedBy = reviewer.UserID
    WHERE (@Status IS NULL OR f.Status = @Status)
      AND (@TypeKey IS NULL OR ft.TypeKey = @TypeKey)
    ORDER BY f.CreatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END;
GO

PRINT 'sp_GetAllFeedbacks oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_UpdateFeedbackStatus
-- =============================================
IF OBJECT_ID('[Feedback].[sp_UpdateFeedbackStatus]', 'P') IS NOT NULL
    DROP PROCEDURE [Feedback].[sp_UpdateFeedbackStatus];
GO

CREATE PROCEDURE [Feedback].[sp_UpdateFeedbackStatus]
    @FeedbackID INT,
    @Status NVARCHAR(20),
    @Priority NVARCHAR(20) = NULL,
    @AdminNotes NVARCHAR(MAX) = NULL,
    @ReviewedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [Feedback].[Feedbacks]
    SET 
        Status = @Status,
        Priority = ISNULL(@Priority, Priority),
        AdminNotes = ISNULL(@AdminNotes, AdminNotes),
        ReviewedBy = ISNULL(@ReviewedBy, ReviewedBy),
        ReviewedDate = CASE WHEN @ReviewedBy IS NOT NULL THEN GETDATE() ELSE ReviewedDate END,
        UpdatedDate = GETDATE()
    WHERE FeedbackID = @FeedbackID;
    
    SELECT 'Feedback güncellendi' AS Message;
END;
GO

PRINT 'sp_UpdateFeedbackStatus oluşturuldu.';
GO

-- =============================================
-- Stored Procedure: sp_GetFeedbackStats
-- =============================================
IF OBJECT_ID('[Feedback].[sp_GetFeedbackStats]', 'P') IS NOT NULL
    DROP PROCEDURE [Feedback].[sp_GetFeedbackStats];
GO

CREATE PROCEDURE [Feedback].[sp_GetFeedbackStats]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        [Status],
        COUNT(*) AS [Count]
    FROM [Feedback].[Feedbacks]
    GROUP BY [Status];
END;
GO

PRINT 'sp_GetFeedbackStats oluşturuldu.';
GO

PRINT '✅ Feedback sistemi başarıyla oluşturuldu!';
GO
