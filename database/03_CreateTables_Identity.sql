-- =============================================
-- SoundCloud Clone - Identity Schema Tables
-- =============================================
-- Kullanıcılar, roller ve profil bilgileri
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- Table: Identity.Users
-- Açıklama: Sistemdeki tüm kullanıcılar (Sanatçı ve Dinleyici)
-- =============================================
CREATE TABLE [Identity].[Users]
(
    UserID INT IDENTITY(1,1) NOT NULL,
    Username NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Bio NVARCHAR(MAX) NULL,
    AvatarUrl NVARCHAR(500) NULL,
    HeaderImageUrl NVARCHAR(500) NULL,
    IsVerified BIT NOT NULL DEFAULT 0, -- Mavi tik özelliği
    CreatedAt DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    -- Primary Key
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (UserID ASC),
    
    -- Unique Constraints
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    
    -- Check Constraints
    CONSTRAINT CK_Users_Email CHECK (Email LIKE '%@%.%')
);
GO

-- Index: Kullanıcı adına göre hızlı arama
CREATE NONCLUSTERED INDEX IX_Users_Username 
ON [Identity].[Users] (Username);
GO

-- Index: Email ile login için
CREATE NONCLUSTERED INDEX IX_Users_Email 
ON [Identity].[Users] (Email);
GO

PRINT 'Identity.Users tablosu oluşturuldu.';
GO
