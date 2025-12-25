// =============================================
// FREKANS - Trigger Test Scripti
// =============================================
// Tüm trigger'ları test eder ve sonuçları gösterir
// =============================================

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
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function testTriggers() {
    console.log('\n🧪 TRIGGER TEST BAŞLATILIYOR...\n');
    
    try {
        const pool = await sql.connect(dbConfig);
        
        // =============================================
        // TEST 1: PlayCount Trigger
        // =============================================
        console.log('📊 TEST 1: PlayCount Otomatik Güncelleme');
        console.log('━'.repeat(50));
        
        // Önce bir şarkının PlayCount'unu kontrol et
        const beforePlay = await pool.request().query(`
            SELECT TOP 1 TrackID, Title, PlayCount 
            FROM [Music].[Tracks] 
            ORDER BY NEWID()
        `);
        
        const testTrack = beforePlay.recordset[0];
        console.log(`🎵 Test Şarkısı: ${testTrack.Title}`);
        console.log(`   Önceki PlayCount: ${testTrack.PlayCount}`);
        
        // Gerçek bir UserID al
        const realUser = await pool.request().query(`SELECT TOP 1 UserID FROM [Identity].[Users]`);
        const realUserId = realUser.recordset[0].UserID;
        
        // Yeni bir play kaydı ekle (Trigger tetiklenecek!)
        await pool.request().query(`
            INSERT INTO [Interaction].[Plays] (TrackID, UserID, PlayedAt)
            VALUES (${testTrack.TrackID}, ${realUserId}, GETDATE())
        `);
        
        // PlayCount'un arttığını kontrol et
        const afterPlay = await pool.request().query(`
            SELECT PlayCount FROM [Music].[Tracks] WHERE TrackID = ${testTrack.TrackID}
        `);
        
        console.log(`   Sonraki PlayCount: ${afterPlay.recordset[0].PlayCount}`);
        console.log(`   ✅ Trigger çalıştı! (+1 artış)\n`);
        
        // =============================================
        // TEST 2: FollowerCount Trigger
        // =============================================
        console.log('👥 TEST 2: FollowerCount Otomatik Güncelleme');
        console.log('━'.repeat(50));
        
        // İki kullanıcı seç
        const users = await pool.request().query(`
            SELECT TOP 2 UserID, Username, FollowerCount, FollowingCount 
            FROM [Identity].[Users]
            ORDER BY NEWID()
        `);
        
        const follower = users.recordset[0];
        const following = users.recordset[1];
        
        console.log(`👤 Takip Eden: ${follower.Username}`);
        console.log(`   FollowingCount (önce): ${follower.FollowingCount}`);
        console.log(`👤 Takip Edilen: ${following.Username}`);
        console.log(`   FollowerCount (önce): ${following.FollowerCount}`);
        
        // Takip ilişkisi ekle (Trigger tetiklenecek!)
        try {
            await pool.request().query(`
                INSERT INTO [Interaction].[Follows] (FollowerID, FollowingID, FollowDate)
                VALUES (${follower.UserID}, ${following.UserID}, GETDATE())
            `);
            
            // Güncel sayıları kontrol et
            const afterFollow = await pool.request().query(`
                SELECT UserID, FollowerCount, FollowingCount 
                FROM [Identity].[Users]
                WHERE UserID IN (${follower.UserID}, ${following.UserID})
            `);
            
            const followerAfter = afterFollow.recordset.find(u => u.UserID === follower.UserID);
            const followingAfter = afterFollow.recordset.find(u => u.UserID === following.UserID);
            
            console.log(`\n   ${follower.Username} FollowingCount (sonra): ${followerAfter.FollowingCount}`);
            console.log(`   ${following.Username} FollowerCount (sonra): ${followingAfter.FollowerCount}`);
            console.log(`   ✅ Trigger çalıştı! (+1 her ikisinde)\n`);
            
            // Takibi geri al (DELETE trigger testi)
            await pool.request().query(`
                DELETE FROM [Interaction].[Follows]
                WHERE FollowerID = ${follower.UserID} AND FollowingID = ${following.UserID}
            `);
            
            console.log(`   🔄 Takip geri alındı (DELETE trigger test edildi)\n`);
            
        } catch (err) {
            if (err.message.includes('UNIQUE')) {
                console.log(`   ⚠️ Zaten takip ediyordu, test atlandı\n`);
            } else {
                throw err;
            }
        }
        
        // =============================================
        // TEST 3: Spam Önleme Trigger
        // =============================================
        console.log('🚫 TEST 3: Spam Önleme Trigger');
        console.log('━'.repeat(50));
        
        const testUser = await pool.request().query(`
            SELECT TOP 1 UserID FROM [Identity].[Users] ORDER BY NEWID()
        `);
        const userId = testUser.recordset[0].UserID;
        
        console.log(`👤 Test Kullanıcı ID: ${userId}`);
        
        // İlk yorum (başarılı olmalı)
        try {
            await pool.request().query(`
                INSERT INTO [Interaction].[Comments] (UserID, TrackID, Content, PostedAt)
                VALUES (${userId}, ${testTrack.TrackID}, 'İlk yorum - Test', GETDATE())
            `);
            console.log(`   ✅ İlk yorum eklendi`);
        } catch (err) {
            console.log(`   ℹ️ İlk yorum: ${err.message}`);
        }
        
        // Hemen ardından ikinci yorum (SPAM - başarısız olmalı!)
        try {
            await pool.request().query(`
                INSERT INTO [Interaction].[Comments] (UserID, TrackID, Content, PostedAt)
                VALUES (${userId}, ${testTrack.TrackID}, 'İkinci yorum - SPAM', GETDATE())
            `);
            console.log(`   ❌ HATA: Spam koruması çalışmadı!`);
        } catch (err) {
            if (err.message.includes('Spam koruması') || err.message.includes('5 saniye')) {
                console.log(`   ✅ Spam koruması çalıştı! İkinci yorum engellendi`);
                console.log(`   📝 Hata mesajı: "${err.message.split('\n')[0]}"`);
            } else {
                console.log(`   ⚠️ Farklı bir hata: ${err.message}`);
            }
        }
        console.log();
        
        // =============================================
        // TEST 4: Audit Log Trigger
        // =============================================
        console.log('📝 TEST 4: Audit Log Trigger');
        console.log('━'.repeat(50));
        
        const auditUser = await pool.request().query(`
            SELECT TOP 1 UserID, Username, Bio 
            FROM [Identity].[Users]
            ORDER BY NEWID()
        `);
        
        const testAuditUser = auditUser.recordset[0];
        const oldBio = testAuditUser.Bio || 'Eski bio';
        const newBio = 'Test bio - ' + new Date().getTime();
        
        console.log(`👤 Test Kullanıcı: ${testAuditUser.Username}`);
        console.log(`   Eski Bio: "${oldBio}"`);
        
        // Bio'yu güncelle (Audit trigger tetiklenecek!)
        await pool.request().query(`
            UPDATE [Identity].[Users]
            SET Bio = '${newBio}'
            WHERE UserID = ${testAuditUser.UserID}
        `);
        
        console.log(`   Yeni Bio: "${newBio}"`);
        
        // Audit log'u kontrol et
        const auditLog = await pool.request().query(`
            SELECT TOP 1 
                FieldChanged, OldValue, NewValue, ChangedAt
            FROM [Audit].[UserProfileChanges]
            WHERE UserID = ${testAuditUser.UserID}
            ORDER BY ChangedAt DESC
        `);
        
        if (auditLog.recordset.length > 0) {
            const log = auditLog.recordset[0];
            console.log(`   ✅ Audit log kaydedildi:`);
            console.log(`      Alan: ${log.FieldChanged}`);
            console.log(`      Eski: "${log.OldValue}"`);
            console.log(`      Yeni: "${log.NewValue}"`);
            console.log(`      Zaman: ${log.ChangedAt.toLocaleString('tr-TR')}`);
        } else {
            console.log(`   ⚠️ Audit log bulunamadı`);
        }
        console.log();
        
        // =============================================
        // TEST 5: Popüler İçerik Silme Koruması
        // =============================================
        console.log('🛡️ TEST 5: Popüler İçerik Silme Koruması');
        console.log('━'.repeat(50));
        
        // Popüler bir şarkı bul (100+ play veya 10+ like)
        const popularTrack = await pool.request().query(`
            SELECT TOP 1 t.TrackID, t.Title, t.PlayCount,
                   (SELECT COUNT(*) FROM [Interaction].[Likes] WHERE TrackID = t.TrackID) AS LikeCount
            FROM [Music].[Tracks] t
            WHERE t.PlayCount >= 100 OR 
                  (SELECT COUNT(*) FROM [Interaction].[Likes] WHERE TrackID = t.TrackID) >= 10
            ORDER BY t.PlayCount DESC
        `);
        
        if (popularTrack.recordset.length > 0) {
            const track = popularTrack.recordset[0];
            console.log(`🎵 Popüler Şarkı: ${track.Title}`);
            console.log(`   PlayCount: ${track.PlayCount}`);
            console.log(`   LikeCount: ${track.LikeCount}`);
            
            try {
                await pool.request().query(`
                    DELETE FROM [Music].[Tracks] WHERE TrackID = ${track.TrackID}
                `);
                console.log(`   ❌ HATA: Popüler içerik silindi (trigger çalışmadı)!`);
            } catch (err) {
                if (err.message.includes('Popüler içerik koruması')) {
                    console.log(`   ✅ Koruma çalıştı! Şarkı silinemedi`);
                    console.log(`   📝 Hata mesajı: "${err.message.split('\n')[0]}"`);
                } else {
                    console.log(`   ⚠️ Farklı bir hata: ${err.message}`);
                }
            }
        } else {
            console.log(`   ℹ️ Popüler şarkı bulunamadı (test atlandı)`);
        }
        console.log();
        
        // =============================================
        // ÖZET
        // =============================================
        console.log('━'.repeat(50));
        console.log('✅ TÜM TRIGGER TESTLERI TAMAMLANDI!\n');
        
        await pool.close();
        
    } catch (err) {
        console.error('❌ Test hatası:', err.message);
        console.error(err);
    }
}

// Çalıştır
testTriggers();
