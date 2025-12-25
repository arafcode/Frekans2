-- ======================================
-- STORED PROCEDURES ve TRIGGERS Kontrol
-- ======================================

-- 1️⃣ TÜM STORED PROCEDURES LİSTELE
-- =====================================
SELECT 
    OBJECT_SCHEMA_NAME(object_id) AS SchemaName,
    name AS ProcedureName,
    create_date AS CreatedDate,
    modify_date AS LastModified
FROM sys.procedures
ORDER BY SchemaName, ProcedureName;

-- 2️⃣ TÜM TRIGGERS LİSTELE
-- ========================
SELECT 
    OBJECT_SCHEMA_NAME(parent_object_id) AS SchemaName,
    OBJECT_NAME(parent_object_id) AS TableName,
    name AS TriggerName,
    is_disabled AS IsDisabled,
    create_date AS CreatedDate
FROM sys.triggers
WHERE parent_class = 1 -- Sadece tablo trigger'ları
ORDER BY SchemaName, TableName, TriggerName;

-- 3️⃣ BİR STORED PROCEDURE'ÜN KODUNU GÖSTER
-- ==========================================
-- Örnek: sp_GetTrackDetails
EXEC sp_helptext 'Music.sp_GetTrackDetails';

-- Alternatif (Daha temiz):
SELECT OBJECT_DEFINITION(OBJECT_ID('Music.sp_GetTrackDetails')) AS ProcedureCode;

-- 4️⃣ BİR TRIGGER'IN KODUNU GÖSTER
-- =================================
-- Örnek: trg_UpdatePlayCount
EXEC sp_helptext 'Interaction.trg_UpdatePlayCount';

-- Alternatif:
SELECT OBJECT_DEFINITION(OBJECT_ID('Interaction.trg_UpdatePlayCount')) AS TriggerCode;

-- 5️⃣ HANGİ TABLODA HANGİ TRIGGER VAR?
-- =====================================
SELECT 
    OBJECT_SCHEMA_NAME(t.parent_object_id) AS SchemaName,
    OBJECT_NAME(t.parent_object_id) AS TableName,
    t.name AS TriggerName,
    te.type_desc AS TriggerEvent,
    CASE t.is_disabled WHEN 0 THEN 'Aktif' ELSE 'Devre Dışı' END AS Status
FROM sys.triggers t
INNER JOIN sys.trigger_events te ON t.object_id = te.object_id
WHERE t.parent_class = 1
ORDER BY TableName, TriggerName;

-- 6️⃣ STORED PROCEDURE İSTATİSTİKLERİ
-- ====================================
SELECT 
    OBJECT_SCHEMA_NAME(object_id) AS SchemaName,
    COUNT(*) AS ProcedureCount
FROM sys.procedures
GROUP BY OBJECT_SCHEMA_NAME(object_id)
ORDER BY SchemaName;

-- 7️⃣ TRIGGER İSTATİSTİKLERİ
-- ==========================
SELECT 
    OBJECT_SCHEMA_NAME(parent_object_id) AS SchemaName,
    COUNT(*) AS TriggerCount
FROM sys.triggers
WHERE parent_class = 1
GROUP BY OBJECT_SCHEMA_NAME(parent_object_id)
ORDER BY SchemaName;

-- 8️⃣ BELİRLİ BİR TRIGGER'IN DETAYLARI
-- =====================================
SELECT 
    t.name AS TriggerName,
    OBJECT_NAME(t.parent_object_id) AS TableName,
    OBJECT_DEFINITION(t.object_id) AS TriggerCode,
    t.is_disabled AS IsDisabled,
    te.type_desc AS EventType
FROM sys.triggers t
LEFT JOIN sys.trigger_events te ON t.object_id = te.object_id
WHERE t.name = 'trg_UpdatePlayCount';

-- 9️⃣ PLAYS TABLOSUNA BAĞLI TÜM TRIGGERLAR
-- =========================================
SELECT 
    t.name AS TriggerName,
    te.type_desc AS EventType,
    t.is_disabled AS IsDisabled
FROM sys.triggers t
INNER JOIN sys.trigger_events te ON t.object_id = te.object_id
WHERE parent_object_id = OBJECT_ID('Interaction.Plays');

-- 🔟 BİR SP'Yİ ÇALIŞTIRMA TESTİ
-- ==============================
-- Test: sp_GetTrackDetails
EXEC Music.sp_GetTrackDetails @TrackID = 1;

-- Test: sp_GetRecentTracks (varsa)
-- EXEC Music.sp_GetRecentTracks @Limit = 10;
