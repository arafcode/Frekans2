// =============================================
// FREKANS - Veritabanı Geri Yükleme Scripti
// =============================================
// JSON backup'larından veritabanını geri yükler
// =============================================

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
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

const backupDir = path.join(__dirname, 'backups');

// =============================================
// Kullanıcıdan Giriş Al
// =============================================
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// =============================================
// Ana Geri Yükleme Fonksiyonu
// =============================================
async function restoreFromBackup() {
    console.log('\n🔄 FREKANS Veritabanı Geri Yükleme\n');

    try {
        // Mevcut backup klasörlerini listele
        const backupFolders = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('json_'))
            .sort()
            .reverse();

        if (backupFolders.length === 0) {
            console.log('❌ Hiç JSON backup bulunamadı!');
            console.log(`   Klasör: ${backupDir}\n`);
            process.exit(1);
        }

        console.log('📂 Mevcut Backup\'lar:\n');
        backupFolders.forEach((folder, idx) => {
            const timestamp = folder.replace('json_', '');
            console.log(`   ${idx + 1}. ${timestamp}`);
        });

        const choice = await question('\nHangi backup\'ı geri yüklemek istiyorsunuz? (1-' + backupFolders.length + '): ');
        const selectedIdx = parseInt(choice) - 1;

        if (selectedIdx < 0 || selectedIdx >= backupFolders.length) {
            console.log('❌ Geçersiz seçim!');
            process.exit(1);
        }

        const selectedBackup = backupFolders[selectedIdx];
        const backupPath = path.join(backupDir, selectedBackup);

        console.log(`\n⚠️  DİKKAT: Bu işlem mevcut verileri SİLECEK!`);
        console.log(`   Backup: ${selectedBackup}\n`);

        const confirm = await question('Devam etmek istediğinize emin misiniz? (evet/hayır): ');
        
        if (confirm.toLowerCase() !== 'evet') {
            console.log('❌ İşlem iptal edildi.');
            process.exit(0);
        }

        rl.close();

        // Geri yükleme işlemini başlat
        await performRestore(backupPath);

        console.log('\n✅ GERİ YÜKLEME TAMAMLANDI!\n');

    } catch (err) {
        console.error('❌ Geri yükleme hatası:', err.message);
        throw err;
    }
}

// =============================================
// Geri Yükleme İşlemi
// =============================================
async function performRestore(backupPath) {
    console.log('\n🔄 Geri yükleme başladı...\n');

    const pool = await sql.connect(dbConfig);
    console.log('✅ Veritabanı bağlantısı kuruldu\n');

    // Tablo sıralama (Foreign Key bağımlılıkları göz önünde)
    const tableOrder = [
        // Identity şeması
        'Identity_Users',
        'Identity_UserFollows',
        
        // Music şeması
        'Music_Artists',
        'Music_Albums',
        'Music_Genres',
        'Music_Tracks',
        'Music_TrackGenres',
        'Music_Playlists',
        'Music_PlaylistTracks',
        
        // Interaction şeması
        'Interaction_Likes',
        'Interaction_Comments',
        'Interaction_Listens',
        'Interaction_Reposts',
        'Interaction_TrackFeedback',
        'Interaction_UserActivity'
    ];

    console.log('🗑️  Mevcut veriler siliniyor...\n');

    // Tabloları ters sırada temizle (Foreign Key)
    for (const tableName of tableOrder.slice().reverse()) {
        const [schema, table] = tableName.split('_');
        try {
            await pool.request().query(`DELETE FROM [${schema}].[${table}]`);
            console.log(`   ✓ ${schema}.${table} temizlendi`);
        } catch (err) {
            console.log(`   ⚠️  ${schema}.${table}: ${err.message}`);
        }
    }

    console.log('\n📥 Backup verileri yükleniyor...\n');

    // Tabloları sırayla yükle
    for (const tableName of tableOrder) {
        const fileName = `${tableName}.json`;
        const filePath = path.join(backupPath, fileName);

        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️  ${tableName}: Dosya bulunamadı, atlanıyor`);
            continue;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.length === 0) {
                console.log(`   - ${tableName}: Boş tablo`);
                continue;
            }

            const [schema, table] = tableName.split('_');
            
            // IDENTITY_INSERT kontrolü
            const hasIdentity = await checkIdentityColumn(pool, schema, table);
            
            if (hasIdentity) {
                await pool.request().query(`SET IDENTITY_INSERT [${schema}].[${table}] ON`);
            }

            // Verileri toplu olarak ekle
            for (const row of data) {
                const columns = Object.keys(row);
                const values = Object.values(row);
                
                const columnList = columns.map(c => `[${c}]`).join(', ');
                const paramList = columns.map((c, i) => `@param${i}`).join(', ');
                
                const request = pool.request();
                
                columns.forEach((col, i) => {
                    request.input(`param${i}`, values[i]);
                });
                
                await request.query(`
                    INSERT INTO [${schema}].[${table}] (${columnList})
                    VALUES (${paramList})
                `);
            }
            
            if (hasIdentity) {
                await pool.request().query(`SET IDENTITY_INSERT [${schema}].[${table}] OFF`);
            }

            console.log(`   ✓ ${tableName}: ${data.length} kayıt yüklendi`);
            
        } catch (err) {
            console.log(`   ✗ ${tableName}: Hata - ${err.message}`);
        }
    }

    await pool.close();
}

// =============================================
// IDENTITY Kolonu Kontrolü
// =============================================
async function checkIdentityColumn(pool, schema, table) {
    const result = await pool.request().query(`
        SELECT COLUMNPROPERTY(OBJECT_ID('[${schema}].[${table}]'), 
               COLUMN_NAME, 'IsIdentity') as IsIdentity
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${schema}' 
        AND TABLE_NAME = '${table}'
        AND COLUMNPROPERTY(OBJECT_ID('[${schema}].[${table}]'), 
            COLUMN_NAME, 'IsIdentity') = 1
    `);
    
    return result.recordset.length > 0;
}

// =============================================
// Scripti Çalıştır
// =============================================
restoreFromBackup()
    .then(() => {
        console.log('👍 İşlem başarılı!');
        process.exit(0);
    })
    .catch(err => {
        console.error('💥 Fatal hata:', err);
        rl.close();
        process.exit(1);
    });
