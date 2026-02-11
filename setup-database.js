// =============================================
// Frekans - Veritabanı Otomatik Kurulum Scripti
// =============================================
// Format sonrası GitHub'dan çektikten sonra:
//   1. npm install
//   2. .env dosyasını düzenle (SQL Server bilgilerin)
//   3. node setup-database.js
// =============================================

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// =============================================
// AYARLAR - .env dosyasından veya burayı düzenle
// =============================================
// İlk kurulumda sa veya Windows Auth ile bağlan
// Çünkü henüz nodeapp kullanıcısı yok
const MASTER_CONFIG = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || undefined,
    database: 'master',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 60000,
    }
};

// Windows Authentication (varsayılan)
// SA auth kullanıyorsan .env'de DB_USER ve DB_PASSWORD tanımla
if (process.env.DB_USER) {
    MASTER_CONFIG.user = process.env.DB_USER;
    MASTER_CONFIG.password = process.env.DB_PASSWORD;
} else {
    MASTER_CONFIG.authentication = {
        type: 'default',
    };
    // Windows Auth - trusted connection
    MASTER_CONFIG.options.trustedConnection = true;
}

// Port undefined ise sil (named instance kullanılabilir)
if (!MASTER_CONFIG.port) {
    delete MASTER_CONFIG.port;
}

// =============================================
// SQL dosyalarının çalıştırılma sırası
// =============================================
const SQL_FILES = [
    { file: 'database/01_CreateDatabase.sql', desc: 'Veritabanı oluşturuluyor' },
    { file: 'database/02_CreateSchemas.sql', desc: 'Şemalar oluşturuluyor' },
    { file: 'database/03_CreateTables_Identity.sql', desc: 'Identity tabloları oluşturuluyor' },
    { file: 'database/04_CreateTables_Music.sql', desc: 'Music tabloları oluşturuluyor' },
    { file: 'database/05_CreateTables_Interaction.sql', desc: 'Interaction tabloları oluşturuluyor' },
    { file: 'database/06_SampleData_Insert.sql', desc: 'Örnek veriler ekleniyor' },
    { file: 'database/08_Performance_Optimization.sql', desc: 'İndeksler ve View\'lar oluşturuluyor' },
    { file: 'database/09_StoredProcedures.sql', desc: 'Stored Procedure\'ler oluşturuluyor' },
    { file: 'database/09_Social_Features.sql', desc: 'Sosyal özellikler ekleniyor' },
    { file: 'database/10_Playlists.sql', desc: 'Playlist sistemi oluşturuluyor' },
    { file: 'database/11_SeedPlaylists.sql', desc: 'Örnek playlist\'ler oluşturuluyor' },
    { file: 'database/12_Feedback_System.sql', desc: 'Feedback sistemi oluşturuluyor' },
    { file: 'database/13_User_Activity.sql', desc: 'User Activity takibi oluşturuluyor' },
    { file: 'database/14_Triggers.sql', desc: 'Trigger\'lar oluşturuluyor' },
];

// =============================================
// Ek sütun migration'ları (SQL dosyalarında olmayan)
// =============================================
const EXTRA_MIGRATIONS = [
    {
        desc: 'IsAdmin kolonu ekleniyor',
        check: `SELECT COUNT(*) as Exists FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Identity' AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsAdmin'`,
        sql: `ALTER TABLE [Identity].[Users] ADD [IsAdmin] BIT NOT NULL DEFAULT 0`
    },
    {
        desc: 'Language kolonu ekleniyor',
        check: `SELECT COUNT(*) as Exists FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Identity' AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'Language'`,
        sql: `ALTER TABLE [Identity].[Users] ADD [Language] NVARCHAR(10) NOT NULL DEFAULT 'tr'`
    },
    {
        desc: 'CoverImageUrl kolonu (Tracks) ekleniyor',
        check: `SELECT COUNT(*) as Exists FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Music' AND TABLE_NAME = 'Tracks' AND COLUMN_NAME = 'CoverImageUrl'`,
        sql: `ALTER TABLE [Music].[Tracks] ADD CoverImageUrl NVARCHAR(500) NULL`
    },
    {
        desc: 'Metadata kolonu (Messages) ekleniyor',
        check: `SELECT COUNT(*) as Exists FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Interaction' AND TABLE_NAME = 'Messages' AND COLUMN_NAME = 'Metadata'`,
        sql: `ALTER TABLE [Interaction].[Messages] ADD [Metadata] NVARCHAR(MAX) NULL`
    },
    {
        desc: 'CoverImageUrl kolonu (Users) ekleniyor',
        check: `SELECT COUNT(*) as Exists FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Identity' AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'CoverImageUrl'`,
        sql: `ALTER TABLE [Identity].[Users] ADD [CoverImageUrl] NVARCHAR(500) NULL`
    },
];

// =============================================
// nodeapp SQL kullanıcı oluşturma
// =============================================
const CREATE_LOGIN_SQL = `
USE master;

-- Login oluştur (yoksa)
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'nodeapp')
BEGIN
    CREATE LOGIN [nodeapp] WITH PASSWORD = 'NodeApp123!', DEFAULT_DATABASE = [FrekansDB];
    PRINT '✅ nodeapp login oluşturuldu';
END
ELSE
    PRINT 'ℹ️  nodeapp login zaten mevcut';

USE FrekansDB;

-- User oluştur (yoksa)
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'nodeapp')
BEGIN
    CREATE USER [nodeapp] FOR LOGIN [nodeapp];
    PRINT '✅ nodeapp user oluşturuldu';
END
ELSE
    PRINT 'ℹ️  nodeapp user zaten mevcut';

-- Yetkiler
ALTER ROLE db_datareader ADD MEMBER [nodeapp];
ALTER ROLE db_datawriter ADD MEMBER [nodeapp];
GRANT EXECUTE TO [nodeapp];
GRANT CREATE TABLE TO [nodeapp];
GRANT ALTER ON SCHEMA::Identity TO [nodeapp];
GRANT ALTER ON SCHEMA::Music TO [nodeapp];
GRANT ALTER ON SCHEMA::Interaction TO [nodeapp];
GRANT ALTER ON SCHEMA::Feedback TO [nodeapp];

PRINT '✅ nodeapp yetkileri verildi';
`;

// =============================================
// YARDIMCI FONKSİYONLAR
// =============================================

function splitSqlBatches(sqlContent) {
    // GO ifadelerinden böl (satır başında tek başına GO)
    return sqlContent
        .split(/^\s*GO\s*$/gim)
        .map(batch => batch.trim())
        .filter(batch => batch.length > 0);
}

async function executeSqlFile(pool, filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠️  ${filePath} bulunamadı, atlanıyor...`);
        return false;
    }
    
    const sqlContent = fs.readFileSync(fullPath, 'utf-8');
    const batches = splitSqlBatches(sqlContent);
    
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        if (!batch || batch.startsWith('--') && !batch.includes('\n')) continue;
        
        try {
            await pool.request().query(batch);
        } catch (err) {
            // Bazı hatalar tolere edilebilir (zaten var gibi)
            if (err.message.includes('already exists') || 
                err.message.includes('zaten mevcut') ||
                err.message.includes('Cannot create a duplicate')) {
                // Devam et
            } else {
                console.log(`  ⚠️  Uyarı (batch ${i + 1}): ${err.message.substring(0, 120)}`);
            }
        }
    }
    
    return true;
}

// =============================================
// ANA KURULUM FONKSİYONU
// =============================================

async function setupDatabase() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   🎵 FREKANS - Veritabanı Otomatik Kurulum         ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    
    let masterPool = null;
    let dbPool = null;
    
    try {
        // =============================================
        // ADIM 1: Master DB'ye bağlan
        // =============================================
        console.log('📡 ADIM 1: SQL Server\'a bağlanılıyor...');
        console.log(`   Server: ${MASTER_CONFIG.server}${MASTER_CONFIG.port ? ':' + MASTER_CONFIG.port : ''}`);
        console.log(`   Auth: ${MASTER_CONFIG.user ? 'SQL Auth (' + MASTER_CONFIG.user + ')' : 'Windows Auth'}`);
        console.log('');
        
        masterPool = await new sql.ConnectionPool(MASTER_CONFIG).connect();
        console.log('   ✅ SQL Server bağlantısı başarılı!\n');
        
        // =============================================
        // ADIM 2: Veritabanını oluştur (01_CreateDatabase.sql)
        // =============================================
        console.log('🗄️  ADIM 2: FrekansDB veritabanı oluşturuluyor...');
        
        // Önce veritabanını doğrudan master pool üzerinden oluştur
        const createDbFile = SQL_FILES.shift(); // İlk dosyayı al
        await executeSqlFile(masterPool, createDbFile.file, createDbFile.desc);
        console.log('   ✅ FrekansDB oluşturuldu!\n');
        
        // Master bağlantısını kapat
        await masterPool.close();
        
        // =============================================
        // ADIM 3: FrekansDB'ye bağlan
        // =============================================
        console.log('📡 ADIM 3: FrekansDB\'ye bağlanılıyor...');
        
        const dbConfig = { ...MASTER_CONFIG, database: 'FrekansDB' };
        dbPool = await new sql.ConnectionPool(dbConfig).connect();
        console.log('   ✅ FrekansDB bağlantısı başarılı!\n');
        
        // =============================================
        // ADIM 4: SQL dosyalarını sırasıyla çalıştır
        // =============================================
        console.log('📜 ADIM 4: SQL dosyaları çalıştırılıyor...');
        console.log('   ─────────────────────────────────────────');
        
        let successCount = 0;
        let skipCount = 0;
        
        for (const sqlFile of SQL_FILES) {
            process.stdout.write(`   📄 ${sqlFile.desc}... `);
            const success = await executeSqlFile(dbPool, sqlFile.file, sqlFile.desc);
            if (success) {
                console.log('✅');
                successCount++;
            } else {
                console.log('⏭️  atlandı');
                skipCount++;
            }
        }
        
        console.log(`   ─────────────────────────────────────────`);
        console.log(`   ✅ ${successCount} dosya çalıştırıldı, ${skipCount} atlandı\n`);
        
        // =============================================
        // ADIM 5: Ek sütun migration'ları
        // =============================================
        console.log('🔧 ADIM 5: Ek migration\'lar uygulanıyor...');
        
        for (const migration of EXTRA_MIGRATIONS) {
            try {
                const result = await dbPool.request().query(migration.check);
                if (result.recordset[0].Exists === 0) {
                    await dbPool.request().query(migration.sql);
                    console.log(`   ✅ ${migration.desc}`);
                } else {
                    console.log(`   ℹ️  ${migration.desc} (zaten var)`);
                }
            } catch (err) {
                console.log(`   ⚠️  ${migration.desc}: ${err.message.substring(0, 80)}`);
            }
        }
        console.log('');
        
        // =============================================
        // ADIM 6: nodeapp login/user oluştur
        // =============================================
        console.log('👤 ADIM 6: nodeapp SQL kullanıcısı oluşturuluyor...');
        
        // master'a tekrar bağlan login oluşturmak için
        await dbPool.close();
        masterPool = await new sql.ConnectionPool({ ...MASTER_CONFIG, database: 'master' }).connect();
        
        const loginBatches = splitSqlBatches(CREATE_LOGIN_SQL);
        for (const batch of loginBatches) {
            try {
                await masterPool.request().query(batch);
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    console.log(`   ⚠️  ${err.message.substring(0, 80)}`);
                }
            }
        }
        console.log('   ✅ nodeapp kullanıcısı hazır!\n');
        
        await masterPool.close();
        
        // =============================================
        // ADIM 7: Doğrulama
        // =============================================
        console.log('🔍 ADIM 7: Kurulum doğrulanıyor...');
        
        const verifyConfig = { ...MASTER_CONFIG, database: 'FrekansDB' };
        dbPool = await new sql.ConnectionPool(verifyConfig).connect();
        
        // Tablo sayısı
        const tables = await dbPool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        
        // SP sayısı
        const procs = await dbPool.request().query(`
            SELECT SCHEMA_NAME(schema_id) AS SchemaName, name 
            FROM sys.procedures 
            ORDER BY SchemaName, name
        `);
        
        // Trigger sayısı
        const triggers = await dbPool.request().query(`
            SELECT name FROM sys.triggers WHERE parent_class = 1
        `);
        
        // View sayısı
        const views = await dbPool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.VIEWS
        `);
        
        // Schema sayısı
        const schemas = await dbPool.request().query(`
            SELECT name FROM sys.schemas 
            WHERE name IN ('Identity', 'Music', 'Interaction', 'Feedback', 'Analysis', 'Audit')
        `);
        
        console.log('');
        console.log('   ┌─────────────────────────────────────────┐');
        console.log('   │          📊 KURULUM RAPORU               │');
        console.log('   ├─────────────────────────────────────────┤');
        console.log(`   │  Şemalar:           ${String(schemas.recordset.length).padStart(3)}               │`);
        console.log(`   │  Tablolar:          ${String(tables.recordset.length).padStart(3)}               │`);
        console.log(`   │  Stored Procedures: ${String(procs.recordset.length).padStart(3)}               │`);
        console.log(`   │  View'lar:          ${String(views.recordset.length).padStart(3)}               │`);
        console.log(`   │  Trigger'lar:       ${String(triggers.recordset.length).padStart(3)}               │`);
        console.log('   └─────────────────────────────────────────┘');
        console.log('');
        
        // Tablo listesi
        console.log('   📋 Tablolar:');
        const grouped = {};
        tables.recordset.forEach(t => {
            if (!grouped[t.TABLE_SCHEMA]) grouped[t.TABLE_SCHEMA] = [];
            grouped[t.TABLE_SCHEMA].push(t.TABLE_NAME);
        });
        Object.entries(grouped).forEach(([schema, tableNames]) => {
            console.log(`      ${schema}: ${tableNames.join(', ')}`);
        });
        
        console.log('');
        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║   ✅ KURULUM TAMAMLANDI!                            ║');
        console.log('╠══════════════════════════════════════════════════════╣');
        console.log('║                                                      ║');
        console.log('║   Şimdi sunucuyu başlatabilirsin:                    ║');
        console.log('║     npm start                                        ║');
        console.log('║                                                      ║');
        console.log('╚══════════════════════════════════════════════════════╝');
        console.log('');
        
        await dbPool.close();
        process.exit(0);
        
    } catch (error) {
        console.error('');
        console.error('╔══════════════════════════════════════════════════════╗');
        console.error('║   ❌ KURULUM HATASI                                 ║');
        console.error('╚══════════════════════════════════════════════════════╝');
        console.error('');
        console.error('   Hata:', error.message);
        console.error('');
        
        if (error.message.includes('Failed to connect') || error.message.includes('ESOCKET')) {
            console.error('   💡 Çözüm önerileri:');
            console.error('   1. SQL Server\'ın çalıştığından emin ol');
            console.error('   2. .env dosyasında DB_SERVER ve DB_PORT doğru mu kontrol et');
            console.error('   3. SQL Server Configuration Manager\'da TCP/IP aktif mi bak');
            console.error('   4. Windows Auth kullanıyorsan .env\'de DB_USER satırını sil/yorum yap');
            console.error('');
        }
        
        if (error.message.includes('Login failed')) {
            console.error('   💡 Çözüm önerileri:');
            console.error('   1. SA şifreni kontrol et');  
            console.error('   2. SQL Server Mixed Mode Authentication aktif mi?');
            console.error('   3. Windows Auth için .env\'de DB_USER satırını sil');
            console.error('');
        }
        
        if (masterPool) await masterPool.close().catch(() => {});
        if (dbPool) await dbPool.close().catch(() => {});
        process.exit(1);
    }
}

// =============================================
// ÇALIŞTIR
// =============================================
setupDatabase();
