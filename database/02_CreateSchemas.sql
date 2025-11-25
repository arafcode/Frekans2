-- =============================================
-- SoundCloud Clone - Schema Creation Script
-- =============================================
-- Mantıksal ayrım için 3 şema oluşturuyoruz
-- =============================================

USE FrekansDB;
GO

-- Identity Şeması: Kullanıcılar ve kimlik doğrulama
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Identity')
BEGIN
    EXEC('CREATE SCHEMA [Identity]');
    PRINT 'Identity şeması oluşturuldu.';
END
GO

-- Music Şeması: Müzik içerikleri ve metadata
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Music')
BEGIN
    EXEC('CREATE SCHEMA [Music]');
    PRINT 'Music şeması oluşturuldu.';
END
GO

-- Interaction Şeması: Kullanıcı etkileşimleri
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Interaction')
BEGIN
    EXEC('CREATE SCHEMA [Interaction]');
    PRINT 'Interaction şeması oluşturuldu.';
END
GO

PRINT 'Tüm şemalar başarıyla oluşturuldu.';
GO
