const sql = require('mssql');
const fs = require('fs');

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
        connectionTimeout: 30000
    }
};

async function runSQLScript() {
    try {
        // Get SQL file from command line argument
        const sqlFile = process.argv[2];
        
        if (!sqlFile) {
            console.error('❌ Usage: node run-sql.js <path-to-sql-file>');
            process.exit(1);
        }
        
        console.log('📡 Connecting to database...');
        const pool = await sql.connect(dbConfig);
        
        console.log(`📄 Reading SQL file: ${sqlFile}...`);
        const sqlScript = fs.readFileSync(sqlFile, 'utf8');
        
        // Split by GO statements
        const batches = sqlScript.split(/^\s*GO\s*$/gim).filter(batch => batch.trim());
        
        console.log(`🔄 Executing ${batches.length} batches...`);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i].trim();
            if (batch) {
                try {
                    await pool.request().query(batch);
                    console.log(`✅ Batch ${i + 1}/${batches.length} executed`);
                } catch (err) {
                    console.error(`❌ Batch ${i + 1} error:`, err.message);
                }
            }
        }
        
        console.log('✅ SQL script executed successfully!');
        await pool.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

runSQLScript();
