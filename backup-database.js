// =============================================
// FREKANS - Veritabanı Yedekleme Scripti
// =============================================
// SQL Server veritabanını yedekler (.bak dosyası)
// Ayrıca tüm tabloları JSON formatında export eder
// =============================================

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Veritabanı yapılandırması
const dbConfig = {
    server: 'localhost',
    port: 52548,
    database: 'FrekansDB',
    user: 'nodeapp',
    password: 'NodeApp123!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    }
};

// Yedekleme klasörü
const backupDir = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

// =============================================
// Ana Yedekleme Fonksiyonu
// =============================================
async function createBackup() {
    console.log('\n🔄 FREKANS Veritabanı Yedekleme Başladı...\n');
    console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
    
    try {
        // Backup klasörünü oluştur
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            console.log(`✅ Backup klasörü oluşturuldu: ${backupDir}`);
        }

        // SQL Server bağlantısı
        const pool = await sql.connect(dbConfig);
        console.log('✅ Veritabanı bağlantısı kuruldu\n');

        // 1. SQL Server native backup (.bak)
        await createSQLBackup(pool);

        // 2. Tablo verilerini JSON olarak export et
        await exportTablesToJSON(pool);

        // 3. Stored Procedures'ları yedekle
        await backupStoredProcedures(pool);

        // 4. Dosya sistemini yedekle (uploads klasörü)
        await backupUploads();

        await pool.close();
        
        console.log('\n✅ TÜM YEDEKLEME İŞLEMLERİ BAŞARIYLA TAMAMLANDI!');
        console.log(`📂 Yedekler: ${backupDir}\n`);

    } catch (err) {
        console.error('❌ Yedekleme hatası:', err.message);
        throw err;
    }
}

// =============================================
// 1. SQL Server Native Backup (.bak)
// =============================================
async function createSQLBackup(pool) {
    try {
        const backupFile = path.join(backupDir, `FrekansDB_${timestamp}.bak`);
        
        console.log('📦 SQL Server native backup oluşturuluyor...');
        console.log(`   Dosya: ${backupFile}`);

        const query = `
            BACKUP DATABASE [FrekansDB]
            TO DISK = '${backupFile.replace(/\\/g, '\\\\')}'
            WITH FORMAT,
                 MEDIANAME = 'FrekansBackup',
                 NAME = 'Full Backup of FrekansDB - ${timestamp}',
                 COMPRESSION,
                 STATS = 10
        `;

        await pool.request().query(query);
        
        const stats = fs.statSync(backupFile);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SQL Backup tamamlandı (${sizeInMB} MB)\n`);
        
    } catch (err) {
        console.error('⚠️  SQL Backup hatası (devam ediliyor...):', err.message);
        console.log('   Not: Backup komutu için SQL Server izinleri gerekebilir\n');
    }
}

// =============================================
// 2. Tabloları JSON Olarak Export Et
// =============================================
async function exportTablesToJSON(pool) {
    console.log('📋 Tablo verileri JSON formatına export ediliyor...\n');

    const jsonBackupDir = path.join(backupDir, `json_${timestamp}`);
    if (!fs.existsSync(jsonBackupDir)) {
        fs.mkdirSync(jsonBackupDir, { recursive: true });
    }

    // Tüm tabloları listele
    const tablesQuery = `
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_SCHEMA IN ('Identity', 'Music', 'Interaction')
        ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;

    const result = await pool.request().query(tablesQuery);
    const tables = result.recordset;

    console.log(`   Toplam ${tables.length} tablo export edilecek...\n`);

    for (const table of tables) {
        const schema = table.TABLE_SCHEMA;
        const tableName = table.TABLE_NAME;
        const fullName = `[${schema}].[${tableName}]`;

        try {
            // Tablo verilerini çek
            const dataResult = await pool.request().query(`SELECT * FROM ${fullName}`);
            const data = dataResult.recordset;

            // JSON dosyasına kaydet
            const fileName = `${schema}_${tableName}.json`;
            const filePath = path.join(jsonBackupDir, fileName);
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            
            console.log(`   ✓ ${fullName}: ${data.length} kayıt`);
            
        } catch (err) {
            console.log(`   ✗ ${fullName}: Hata - ${err.message}`);
        }
    }

    console.log(`\n✅ JSON export tamamlandı: ${jsonBackupDir}\n`);
}

// =============================================
// 3. Stored Procedures'ları Yedekle
// =============================================
async function backupStoredProcedures(pool) {
    console.log('⚙️  Stored Procedures yedekleniyor...\n');

    const spBackupDir = path.join(backupDir, `stored_procedures_${timestamp}`);
    if (!fs.existsSync(spBackupDir)) {
        fs.mkdirSync(spBackupDir, { recursive: true });
    }

    const spQuery = `
        SELECT 
            s.name AS SchemaName,
            p.name AS ProcedureName,
            OBJECT_DEFINITION(p.object_id) AS Definition
        FROM sys.procedures p
        JOIN sys.schemas s ON p.schema_id = s.schema_id
        WHERE s.name IN ('Identity', 'Music', 'Interaction')
        ORDER BY s.name, p.name
    `;

    const result = await pool.request().query(spQuery);
    const procedures = result.recordset;

    for (const proc of procedures) {
        const fileName = `${proc.SchemaName}_${proc.ProcedureName}.sql`;
        const filePath = path.join(spBackupDir, fileName);
        
        fs.writeFileSync(filePath, proc.Definition, 'utf8');
        console.log(`   ✓ ${proc.SchemaName}.${proc.ProcedureName}`);
    }

    console.log(`\n✅ ${procedures.length} Stored Procedure yedeklendi\n`);
}

// =============================================
// 4. Upload Klasörünü Yedekle
// =============================================
async function backupUploads() {
    console.log('📁 Upload klasörü yedekleniyor...\n');

    const uploadsSource = path.join(__dirname, 'public', 'uploads');
    const uploadsBackupDir = path.join(backupDir, `uploads_${timestamp}`);

    if (!fs.existsSync(uploadsSource)) {
        console.log('   ⚠️  Uploads klasörü bulunamadı, atlanıyor...\n');
        return;
    }

    // Klasörü recursive kopyala
    copyFolderRecursive(uploadsSource, uploadsBackupDir);

    const stats = getFolderStats(uploadsBackupDir);
    console.log(`✅ Upload klasörü yedeklendi: ${stats.files} dosya, ${stats.sizeInMB} MB\n`);
}

// =============================================
// Yardımcı Fonksiyonlar
// =============================================

function copyFolderRecursive(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);

    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyFolderRecursive(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}

function getFolderStats(folderPath) {
    let totalSize = 0;
    let fileCount = 0;

    function walkDir(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.lstatSync(filePath);

            if (stats.isDirectory()) {
                walkDir(filePath);
            } else {
                totalSize += stats.size;
                fileCount++;
            }
        });
    }

    if (fs.existsSync(folderPath)) {
        walkDir(folderPath);
    }

    return {
        files: fileCount,
        sizeInMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
}

// =============================================
// Scripti Çalıştır
// =============================================
createBackup()
    .then(() => {
        console.log('👍 İşlem başarılı!');
        process.exit(0);
    })
    .catch(err => {
        console.error('💥 Fatal hata:', err);
        process.exit(1);
    });
