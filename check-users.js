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

async function checkUsers() {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT TOP 10 UserID, Username, Email, [IsAdmin] FROM [Identity].[Users] ORDER BY UserID');
        
        console.log('\n📋 Kullanıcılar:\n');
        result.recordset.forEach(u => {
            console.log(`ID: ${u.UserID} | Username: ${u.Username} | Email: ${u.Email} | Admin: ${u.IsAdmin ? 'Evet' : 'Hayır'}`);
        });
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sql.close();
    }
}

checkUsers();
