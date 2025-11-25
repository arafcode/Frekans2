-- =============================================
-- SoundCloud Clone - Database Creation Script
-- =============================================
-- Veritabanı: FrekansDB
-- Tarih: 2025-11-21
-- =============================================

USE master;
GO

-- Eğer veritabanı varsa sil (Geliştirme ortamı için)
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'FrekansDB')
BEGIN
    ALTER DATABASE FrekansDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE FrekansDB;
END
GO

-- Veritabanını oluştur
CREATE DATABASE FrekansDB
ON PRIMARY
(
    NAME = N'FrekansDB_Data',
    FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\FrekansDB.mdf',
    SIZE = 100MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 50MB
)
LOG ON
(
    NAME = N'FrekansDB_Log',
    FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\FrekansDB_log.ldf',
    SIZE = 50MB,
    MAXSIZE = 2GB,
    FILEGROWTH = 10MB
);
GO

-- Veritabanını kullan
USE FrekansDB;
GO

PRINT 'FrekansDB veritabanı başarıyla oluşturuldu.';
GO
