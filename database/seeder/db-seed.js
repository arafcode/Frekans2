// =============================================
// SoundCloud Clone - Big Data Seeder
// =============================================
// 50.000+ kayıt için optimize edilmiş bulk insert
// =============================================

const sql = require('mssql');
const { faker } = require('@faker-js/faker');

// =============================================
// Database Configuration
// =============================================
const config = {
    server: 'localhost',
    port: 52548,                     // SQL Server dynamic port
    database: 'FrekansDB',
    user: 'nodeapp',
    password: 'NodeApp123!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 300000       // 5 dakika timeout (bulk insert için)
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// =============================================
// Data Generation Targets
// =============================================
const TARGETS = {
    USERS: 1000,           // Sanatçılar
    GENRES: 50,            // Müzik türleri
    ALBUMS: 2000,          // Albümler
    TRACKS: 50000,         // Şarkılar (Ana hedef!)
    PLAYS: 100000,         // Dinlemeler
    LIKES: 30000,          // Beğeniler
    COMMENTS: 20000,       // Yorumlar
    FOLLOWS: 5000          // Takip ilişkileri
};

const CHUNK_SIZE = 1000;  // Her seferinde 1000 kayıt gönder

// =============================================
// Helper Functions
// =============================================

/**
 * İlerleme çubuğu göster
 */
function showProgress(current, total, label) {
    const percentage = ((current / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r${label}: [${bar}] ${current}/${total} (${percentage}%)`);
    if (current === total) console.log(''); // Yeni satıra geç
}

/**
 * Rastgele sanatçı adı üret (SoundCloud tarzı)
 */
function generateArtistName() {
    const prefixes = ['Lil', 'DJ', 'MC', 'Big', 'Young', 'Kid', 'Lord'];
    const suffixes = ['Beats', 'Vibes', 'Wave', 'Flow', 'Code', 'SQL', 'Data', 'Bass'];
    
    const rand = Math.random();
    if (rand < 0.3) {
        return `${faker.helpers.arrayElement(prefixes)} ${faker.word.adjective()}`;
    } else if (rand < 0.6) {
        return `${faker.person.firstName()} ${faker.helpers.arrayElement(suffixes)}`;
    } else {
        return faker.internet.userName().replace(/[^a-zA-Z0-9]/g, '');
    }
}

/**
 * Waveform data üret (100 adet 0-100 arası rastgele değer)
 */
function generateWaveform() {
    const waveform = [];
    for (let i = 0; i < 100; i++) {
        waveform.push(Math.floor(Math.random() * 100));
    }
    return JSON.stringify(waveform);
}

/**
 * Şarkı adı üret (Havalı ve gerçekçi)
 */
function generateTrackTitle() {
    const adjectives = ['Midnight', 'Neon', 'Lost', 'Dark', 'Golden', 'Electric', 'Digital', 'Crystal'];
    const nouns = ['Dreams', 'Nights', 'Vibes', 'Beats', 'Waves', 'Echoes', 'Memories', 'Paradise'];
    const verbs = ['Falling', 'Rising', 'Dancing', 'Floating', 'Running', 'Flying'];
    
    const rand = Math.random();
    if (rand < 0.4) {
        return `${faker.helpers.arrayElement(adjectives)} ${faker.helpers.arrayElement(nouns)}`;
    } else if (rand < 0.7) {
        return `${faker.helpers.arrayElement(verbs)} ${faker.helpers.arrayElement(nouns)}`;
    } else {
        return faker.music.songName();
    }
}

/**
 * URL-friendly slug oluştur
 */
function generateSlug(title, id) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + id;
}

/**
 * Chunk'lar halinde bulk insert yap
 */
async function bulkInsert(pool, tableName, columns, dataArray, label) {
    const total = dataArray.length;
    let inserted = 0;

    for (let i = 0; i < dataArray.length; i += CHUNK_SIZE) {
        const chunk = dataArray.slice(i, i + CHUNK_SIZE);
        
        // SQL VALUES kısmını oluştur
        const values = chunk.map(row => {
            const formattedValues = columns.map(col => {
                const value = row[col];
                if (value === null || value === undefined) return 'NULL';
                if (typeof value === 'string') return `N'${value.replace(/'/g, "''")}'`;
                if (typeof value === 'boolean') return value ? '1' : '0';
                if (value instanceof Date) return `'${value.toISOString()}'`;
                return value;
            });
            return `(${formattedValues.join(', ')})`;
        }).join(',\n');

        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values}`;
        
        try {
            await pool.request().query(query);
            inserted += chunk.length;
            showProgress(inserted, total, label);
        } catch (err) {
            console.error(`\n❌ Error inserting chunk at ${i}:`, err.message);
            throw err;
        }
    }
}

// =============================================
// Data Generators
// =============================================

async function seedUsers(pool) {
    console.log('\n📊 Generating Users (Artists)...');
    const users = [];
    const usedUsernames = new Set();
    
    for (let i = 1; i <= TARGETS.USERS; i++) {
        let username = generateArtistName();
        // Ensure uniqueness by adding counter if duplicate
        let finalUsername = username;
        let counter = 1;
        while (usedUsernames.has(finalUsername)) {
            finalUsername = `${username}_${counter}`;
            counter++;
        }
        usedUsernames.add(finalUsername);
        
        users.push({
            Username: finalUsername.substring(0, 50),
            Email: faker.internet.email().toLowerCase(),
            PasswordHash: faker.string.alphanumeric(60),
            Bio: faker.lorem.sentence(),
            AvatarUrl: `/avatars/${finalUsername.toLowerCase().replace(/\s/g, '-')}.jpg`,
            HeaderImageUrl: `/headers/${faker.string.alphanumeric(10)}.jpg`,
            IsVerified: Math.random() < 0.05 ? 1 : 0, // 5% verified
            CreatedAt: faker.date.past({ years: 2 })
        });
        
        if (i % 100 === 0) showProgress(i, TARGETS.USERS, 'Users');
    }
    
    await bulkInsert(pool, '[Identity].[Users]', 
        ['Username', 'Email', 'PasswordHash', 'Bio', 'AvatarUrl', 'HeaderImageUrl', 'IsVerified', 'CreatedAt'],
        users, 'Inserting Users');
    
    console.log('✅ Users seeded successfully!');
    return users.length;
}

async function seedGenres(pool) {
    console.log('\n📊 Generating Genres...');
    const baseGenres = [
        'Trap', 'Lo-Fi', 'House', 'Hip-Hop', 'Electronic', 'Ambient', 'Techno', 'Dubstep',
        'Drum & Bass', 'Trance', 'Chillwave', 'Vaporwave', 'Future Bass', 'Deep House',
        'Progressive House', 'Electro', 'Hardstyle', 'Melodic Techno', 'Minimal', 'UK Garage'
    ];
    
    const genres = [];
    for (let i = 0; i < TARGETS.GENRES; i++) {
        if (i < baseGenres.length) {
            genres.push({ Name: baseGenres[i] });
        } else {
            genres.push({ Name: `${faker.music.genre()} ${i}` });
        }
    }
    
    await bulkInsert(pool, '[Music].[Genres]', ['Name'], genres, 'Inserting Genres');
    console.log('✅ Genres seeded successfully!');
    return genres.length;
}

async function seedAlbums(pool, userCount) {
    console.log('\n📊 Generating Albums...');
    
    // Önce gerçek UserID'leri alalım
    const result = await pool.request().query('SELECT UserID FROM [Identity].[Users]');
    const validUserIDs = result.recordset.map(r => r.UserID);
    
    if (validUserIDs.length === 0) {
        throw new Error('No users found in database!');
    }
    
    const albums = [];
    
    for (let i = 1; i <= TARGETS.ALBUMS; i++) {
        const artistID = validUserIDs[Math.floor(Math.random() * validUserIDs.length)];
        const title = `${faker.word.adjective()} ${faker.word.noun()}`;
        
        albums.push({
            ArtistID: artistID,
            Title: title.substring(0, 200),
            CoverImageUrl: `/covers/${faker.string.alphanumeric(15)}.jpg`,
            ReleaseDate: faker.date.past({ years: 3 }),
            Description: faker.lorem.paragraph()
        });
        
        if (i % 100 === 0) showProgress(i, TARGETS.ALBUMS, 'Albums');
    }
    
    await bulkInsert(pool, '[Music].[Albums]', 
        ['ArtistID', 'Title', 'CoverImageUrl', 'ReleaseDate', 'Description'],
        albums, 'Inserting Albums');
    
    console.log('✅ Albums seeded successfully!');
    return albums.length;
}

async function seedTracks(pool, userCount, albumCount, genreCount) {
    console.log('\n📊 Generating 50,000 Tracks... (This may take a few minutes)');
    
    // Gerçek ID'leri al
    const [userResult, albumResult, genreResult] = await Promise.all([
        pool.request().query('SELECT UserID FROM [Identity].[Users]'),
        pool.request().query('SELECT AlbumID FROM [Music].[Albums]'),
        pool.request().query('SELECT GenreID FROM [Music].[Genres]')
    ]);
    
    const validUserIDs = userResult.recordset.map(r => r.UserID);
    const validAlbumIDs = albumResult.recordset.map(r => r.AlbumID);
    const validGenreIDs = genreResult.recordset.map(r => r.GenreID);
    
    const tracks = [];
    
    for (let i = 1; i <= TARGETS.TRACKS; i++) {
        const artistID = validUserIDs[Math.floor(Math.random() * validUserIDs.length)];
        const albumID = Math.random() < 0.7 ? validAlbumIDs[Math.floor(Math.random() * validAlbumIDs.length)] : null; // 30% singles
        const genreID = validGenreIDs[Math.floor(Math.random() * validGenreIDs.length)];
        const title = generateTrackTitle();
        const slug = generateSlug(title, i);
        
        tracks.push({
            ArtistID: artistID,
            AlbumID: albumID,
            GenreID: genreID,
            Title: title.substring(0, 200),
            Slug: slug.substring(0, 250),
            AudioUrl: `/audio/${faker.string.alphanumeric(20)}.mp3`,
            DurationSeconds: Math.floor(Math.random() * 300) + 60, // 1-6 dakika
            WaveformData: generateWaveform(),
            UploadDate: faker.date.past({ years: 2 }),
            IsPublic: Math.random() < 0.95 ? 1 : 0, // 95% public
            PlayCount: 0
        });
        
        // Her 500 kayıtta ilerleme göster (performans için)
        if (i % 500 === 0) showProgress(i, TARGETS.TRACKS, 'Tracks');
    }
    
    console.log('\n⏳ Inserting 50,000 tracks in chunks...');
    await bulkInsert(pool, '[Music].[Tracks]', 
        ['ArtistID', 'AlbumID', 'GenreID', 'Title', 'Slug', 'AudioUrl', 'DurationSeconds', 'WaveformData', 'UploadDate', 'IsPublic', 'PlayCount'],
        tracks, 'Inserting Tracks');
    
    console.log('✅ Tracks seeded successfully!');
    return tracks.length;
}

async function seedPlays(pool, trackCount, userCount) {
    console.log('\n📊 Generating Plays (100K)...');
    
    const [trackResult, userResult] = await Promise.all([
        pool.request().query('SELECT TrackID FROM [Music].[Tracks]'),
        pool.request().query('SELECT UserID FROM [Identity].[Users]')
    ]);
    
    const validTrackIDs = trackResult.recordset.map(r => r.TrackID);
    const validUserIDs = userResult.recordset.map(r => r.UserID);
    
    const plays = [];
    
    for (let i = 1; i <= TARGETS.PLAYS; i++) {
        const trackID = validTrackIDs[Math.floor(Math.random() * validTrackIDs.length)];
        const userID = Math.random() < 0.8 ? validUserIDs[Math.floor(Math.random() * validUserIDs.length)] : null; // 20% guest
        
        plays.push({
            TrackID: trackID,
            UserID: userID,
            PlayedAt: faker.date.recent({ days: 30 })
        });
        
        if (i % 1000 === 0) showProgress(i, TARGETS.PLAYS, 'Plays');
    }
    
    await bulkInsert(pool, '[Interaction].[Plays]', 
        ['TrackID', 'UserID', 'PlayedAt'],
        plays, 'Inserting Plays');
    
    console.log('✅ Plays seeded successfully!');
}

async function seedLikes(pool, trackCount, userCount) {
    console.log('\n📊 Generating Likes (30K)...');
    
    const [trackResult, userResult] = await Promise.all([
        pool.request().query('SELECT TrackID FROM [Music].[Tracks]'),
        pool.request().query('SELECT UserID FROM [Identity].[Users]')
    ]);
    
    const validTrackIDs = trackResult.recordset.map(r => r.TrackID);
    const validUserIDs = userResult.recordset.map(r => r.UserID);
    
    const likes = [];
    const uniquePairs = new Set();
    
    let attempts = 0;
    while (likes.length < TARGETS.LIKES && attempts < TARGETS.LIKES * 2) {
        const userID = validUserIDs[Math.floor(Math.random() * validUserIDs.length)];
        const trackID = validTrackIDs[Math.floor(Math.random() * validTrackIDs.length)];
        const pair = `${userID}-${trackID}`;
        
        if (!uniquePairs.has(pair)) {
            uniquePairs.add(pair);
            likes.push({
                UserID: userID,
                TrackID: trackID,
                LikedAt: faker.date.recent({ days: 30 })
            });
            
            if (likes.length % 1000 === 0) showProgress(likes.length, TARGETS.LIKES, 'Likes');
        }
        attempts++;
    }
    
    await bulkInsert(pool, '[Interaction].[Likes]', 
        ['UserID', 'TrackID', 'LikedAt'],
        likes, 'Inserting Likes');
    
    console.log('✅ Likes seeded successfully!');
}

async function seedComments(pool, trackCount, userCount) {
    console.log('\n📊 Generating Comments (20K)...');
    
    const [trackResult, userResult] = await Promise.all([
        pool.request().query('SELECT TrackID FROM [Music].[Tracks]'),
        pool.request().query('SELECT UserID FROM [Identity].[Users]')
    ]);
    
    const validTrackIDs = trackResult.recordset.map(r => r.TrackID);
    const validUserIDs = userResult.recordset.map(r => r.UserID);
    
    const comments = [];
    
    for (let i = 1; i <= TARGETS.COMMENTS; i++) {
        const userID = validUserIDs[Math.floor(Math.random() * validUserIDs.length)];
        const trackID = validTrackIDs[Math.floor(Math.random() * validTrackIDs.length)];
        const hasTimestamp = Math.random() < 0.7; // 70% zaman damgalı yorum
        
        comments.push({
            UserID: userID,
            TrackID: trackID,
            Content: faker.lorem.sentence(),
            TimestampSeconds: hasTimestamp ? Math.floor(Math.random() * 300) : null,
            PostedAt: faker.date.recent({ days: 30 })
        });
        
        if (i % 1000 === 0) showProgress(i, TARGETS.COMMENTS, 'Comments');
    }
    
    await bulkInsert(pool, '[Interaction].[Comments]', 
        ['UserID', 'TrackID', 'Content', 'TimestampSeconds', 'PostedAt'],
        comments, 'Inserting Comments');
    
    console.log('✅ Comments seeded successfully!');
}

async function seedFollows(pool, userCount) {
    console.log('\n📊 Generating Follows (5K)...');
    
    const userResult = await pool.request().query('SELECT UserID FROM [Identity].[Users]');
    const validUserIDs = userResult.recordset.map(r => r.UserID);
    
    const follows = [];
    const uniquePairs = new Set();
    
    let attempts = 0;
    while (follows.length < TARGETS.FOLLOWS && attempts < TARGETS.FOLLOWS * 2) {
        const followerID = validUserIDs[Math.floor(Math.random() * validUserIDs.length)];
        const followingID = validUserIDs[Math.floor(Math.random() * validUserIDs.length)];
        const pair = `${followerID}-${followingID}`;
        
        if (followerID !== followingID && !uniquePairs.has(pair)) {
            uniquePairs.add(pair);
            follows.push({
                FollowerID: followerID,
                FollowingID: followingID,
                FollowDate: faker.date.recent({ days: 60 })
            });
            
            if (follows.length % 500 === 0) showProgress(follows.length, TARGETS.FOLLOWS, 'Follows');
        }
        attempts++;
    }
    
    await bulkInsert(pool, '[Interaction].[Follows]', 
        ['FollowerID', 'FollowingID', 'FollowDate'],
        follows, 'Inserting Follows');
    
    console.log('✅ Follows seeded successfully!');
}

// =============================================
// Main Execution
// =============================================

async function main() {
    console.log('🚀 SoundCloud Clone Big Data Seeder');
    console.log('=====================================');
    console.log('Target: 50,000+ Records');
    console.log('=====================================\n');
    
    const startTime = Date.now();
    let pool;
    
    try {
        // Database bağlantısı
        console.log('🔌 Connecting to MSSQL...');
        pool = await sql.connect(config);
        console.log('✅ Connected to FrekansDB\n');
        
        // Verileri temizle (isteğe bağlı)
        console.log('🗑️  Cleaning existing data...');
        await pool.request().query('DELETE FROM [Interaction].[Follows]');
        await pool.request().query('DELETE FROM [Interaction].[Comments]');
        await pool.request().query('DELETE FROM [Interaction].[Likes]');
        await pool.request().query('DELETE FROM [Interaction].[Plays]');
        await pool.request().query('DELETE FROM [Music].[Tracks]');
        await pool.request().query('DELETE FROM [Music].[Albums]');
        await pool.request().query('DELETE FROM [Music].[Genres]');
        await pool.request().query('DELETE FROM [Identity].[Users]');
        console.log('✅ Database cleaned\n');
        
        // Seed işlemleri (sırayla)
        const userCount = await seedUsers(pool);
        const genreCount = await seedGenres(pool);
        const albumCount = await seedAlbums(pool, userCount);
        const trackCount = await seedTracks(pool, userCount, albumCount, genreCount);
        
        // Interactions
        await seedPlays(pool, trackCount, userCount);
        await seedLikes(pool, trackCount, userCount);
        await seedComments(pool, trackCount, userCount);
        await seedFollows(pool, userCount);
        
        // Özet
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('\n\n🎉 =====================================');
        console.log('   SEEDING COMPLETED SUCCESSFULLY!');
        console.log('=====================================');
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log(`📊 Total Records Inserted: ${TARGETS.USERS + TARGETS.GENRES + TARGETS.ALBUMS + TARGETS.TRACKS + TARGETS.PLAYS + TARGETS.LIKES + TARGETS.COMMENTS + TARGETS.FOLLOWS}`);
        console.log('\n📈 Breakdown:');
        console.log(`   - Users:    ${TARGETS.USERS.toLocaleString()}`);
        console.log(`   - Genres:   ${TARGETS.GENRES.toLocaleString()}`);
        console.log(`   - Albums:   ${TARGETS.ALBUMS.toLocaleString()}`);
        console.log(`   - Tracks:   ${TARGETS.TRACKS.toLocaleString()}`);
        console.log(`   - Plays:    ${TARGETS.PLAYS.toLocaleString()}`);
        console.log(`   - Likes:    ${TARGETS.LIKES.toLocaleString()}`);
        console.log(`   - Comments: ${TARGETS.COMMENTS.toLocaleString()}`);
        console.log(`   - Follows:  ${TARGETS.FOLLOWS.toLocaleString()}`);
        console.log('=====================================\n');
        
    } catch (err) {
        console.error('\n\n❌ FATAL ERROR:', err);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Database connection closed.');
        }
    }
}

// Script'i çalıştır
main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
