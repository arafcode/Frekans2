// Veritabanı istatistiklerini al
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: 'localhost',
    port: 52548,
    database: 'FrekansDB',
    user: 'nodeapp',
    password: 'NodeApp123!',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function getStats() {
    try {
        const pool = await sql.connect(dbConfig);
        
        console.log('\n📊 FREKANS VERİTABANI İSTATİSTİKLERİ\n');
        console.log('='.repeat(60));
        
        // Tüm tabloların kayıt sayıları
        const tables = [
            { schema: 'Identity', table: 'Users', turkce: 'Kullanıcılar' },
            { schema: 'Music', table: 'Genres', turkce: 'Türler' },
            { schema: 'Music', table: 'Albums', turkce: 'Albümler' },
            { schema: 'Music', table: 'Tracks', turkce: 'Şarkılar' },
            { schema: 'Music', table: 'Playlists', turkce: 'Çalma Listeleri' },
            { schema: 'Music', table: 'PlaylistTracks', turkce: 'Playlist Şarkıları' },
            { schema: 'Interaction', table: 'Plays', turkce: 'Dinlemeler' },
            { schema: 'Interaction', table: 'Likes', turkce: 'Beğeniler' },
            { schema: 'Interaction', table: 'Comments', turkce: 'Yorumlar' },
            { schema: 'Interaction', table: 'Follows', turkce: 'Takipler' },
            { schema: 'Interaction', table: 'Messages', turkce: 'Mesajlar' },
        ];
        
        console.log('\nTABLO KAYIT SAYILARI:');
        console.log('-'.repeat(60));
        
        for (const t of tables) {
            const result = await pool.request().query(`
                SELECT COUNT(*) as count FROM [${t.schema}].[${t.table}]
            `);
            const count = result.recordset[0].count;
            console.log(`${t.schema}.${t.table.padEnd(20)} (${t.turkce.padEnd(20)}) : ${count.toLocaleString('tr-TR')}`);
        }
        
        // Audit tablosu
        try {
            const audit = await pool.request().query(`
                SELECT COUNT(*) as count FROM [Audit].[UserProfileChanges]
            `);
            console.log(`Audit.UserProfileChanges (Profil Değişiklikleri)    : ${audit.recordset[0].count.toLocaleString('tr-TR')}`);
        } catch (e) {
            console.log(`Audit.UserProfileChanges (Profil Değişiklikleri)    : 0`);
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Veritabanı boyutu
        const dbSize = await pool.request().query(`
            SELECT 
                SUM(size) * 8 / 1024 AS SizeMB
            FROM sys.master_files
            WHERE database_id = DB_ID('FrekansDB')
        `);
        
        console.log(`\nTOPLAM VERİTABANI BOYUTU: ${dbSize.recordset[0].SizeMB.toFixed(2)} MB`);
        
        // Index sayısı
        const indexCount = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM sys.indexes 
            WHERE object_id IN (
                SELECT object_id FROM sys.tables 
                WHERE schema_id IN (
                    SCHEMA_ID('Identity'), 
                    SCHEMA_ID('Music'), 
                    SCHEMA_ID('Interaction')
                )
            )
            AND type_desc = 'NONCLUSTERED'
        `);
        
        console.log(`TOPLAM NON-CLUSTERED INDEX: ${indexCount.recordset[0].count}`);
        
        // Stored Procedure sayısı
        const spCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM sys.procedures
        `);
        
        console.log(`TOPLAM STORED PROCEDURE: ${spCount.recordset[0].count}`);
        
        // Trigger sayısı
        const triggerCount = await pool.request().query(`
            SELECT COUNT(*) as count FROM sys.triggers WHERE parent_class = 1
        `);
        
        console.log(`TOPLAM TRIGGER: ${triggerCount.recordset[0].count}`);
        
        console.log('\n' + '='.repeat(60));
        
        await pool.close();
        
    } catch (err) {
        console.error('Hata:', err.message);
    }
}

getStats();
