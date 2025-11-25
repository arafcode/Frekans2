const sql = require('mssql');

const config = {
    server: 'localhost',
    port: 52548,
    user: 'nodeapp',
    password: 'NodeApp123!',
    database: 'FrekansDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function createAdminUser() {
    try {
        await sql.connect(config);
        console.log('✅ Bağlantı kuruldu');
        
        // Check if admin user already exists
        const checkResult = await sql.query("SELECT UserID FROM [Identity].[Users] WHERE Username = 'admin'");
        
        if (checkResult.recordset.length > 0) {
            console.log('ℹ️ Admin kullanıcı zaten mevcut, güncelleniyor...');
            await sql.query(`
                UPDATE [Identity].[Users] 
                SET PasswordHash = 'admin123', [IsAdmin] = 1 
                WHERE Username = 'admin'
            `);
            console.log('✅ Admin kullanıcı güncellendi');
        } else {
            console.log('➕ Admin kullanıcı oluşturuluyor...');
            await sql.query(`
                INSERT INTO [Identity].[Users] (Username, Email, PasswordHash, Bio, AvatarUrl, IsVerified, [IsAdmin])
                VALUES ('admin', 'admin@frekans.com', 'admin123', 'Platform Administrator', NULL, 1, 1)
            `);
            console.log('✅ Admin kullanıcı oluşturuldu');
        }
        
        // Remove admin from other users
        await sql.query("UPDATE [Identity].[Users] SET [IsAdmin] = 0 WHERE Username != 'admin'");
        console.log('✅ Diğer kullanıcılardan admin yetkisi kaldırıldı');
        
        // Show admin user
        const result = await sql.query("SELECT UserID, Username, Email, [IsAdmin] FROM [Identity].[Users] WHERE Username = 'admin'");
        console.log('\n📋 Admin Kullanıcı:');
        console.log(`ID: ${result.recordset[0].UserID} | Username: ${result.recordset[0].Username} | Email: ${result.recordset[0].Email} | Admin: Evet`);
        console.log('\n🔑 Giriş Bilgileri:');
        console.log('Username: admin');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sql.close();
    }
}

createAdminUser();
