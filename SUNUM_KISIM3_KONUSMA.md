# 🎤 BÖLÜM 3 KONUŞMA METNİ (Kişi 3 - Siz)
## Stored Procedures, Triggers ve Backup Sistemi

**⏱️ Süre:** 5 dakika  
**🎯 Amaç:** Frontend üzerinden göstererek, basit ve anlaşılır anlatım

---

## 🎬 GİRİŞ (30 saniye)

**[Gülerek başlayın]**

> "Merhaba, ben projenin 3. bölümünü anlatacağım. Stored Procedure'ler, Trigger'lar ve Backup sistemimizi göstereceğim."
> 
> **[Ekrana frontend'i açın - index.html]**
> 
> "Şimdi bunları sadece kod olarak değil, gerçekten nasıl çalıştıklarını frontend üzerinden göstereceğim. Çünkü kodda yazılan şeyler burada, kullanıcının gördüğü yerde nasıl işliyor, onu görmek önemli."

---

## 📝 BÖLÜM 1: STORED PROCEDURES NEDİR? (1.5 dakika)

### A. Basit Açıklama

> "Önce Stored Procedure nedir onu açıklayayım."
> 
> "Stored Procedure yani kısaca SP, veritabanında **önceden hazırlanmış SQL sorguları**. Yani biz her seferinde uzun uzun SQL sorgusu yazmak yerine, bir kere yazıp kaydediyoruz. Sonra ismini çağırdığımızda çalışıyor."
>
> **[Analoji kullanın]**
> 
> "Şöyle düşünün: Her gün kahvaltıda yumurta yapıyorsunuz. Her seferinde 'tavayı al, yağı koy, yumurtayı kır' demek yerine, annenize 'kahvaltı hazırla' diyorsunuz. İşte Stored Procedure da bu. Kompleks işlemleri tek bir komutla yapıyoruz."

---

### B. Frontend'de Canlı Gösterim

**[Browser'da track-detail.html sayfasını açın - herhangi bir şarkı]**

> "Bakın, şu anda bir şarkının detay sayfasındayız. Burası 'Midnight Trap' şarkısı."
>
> **[Sayfayı işaret edin]**
> 
> "Burada şarkının adı, sanatçısı, kaç kere dinlendiği, yorumlar... hepsi var. Peki bunlar nasıl geldi?"

**[F12 - DevTools açın, Network sekmesine gidin]**

> "Şimdi sayfayı yenileyeceğim..."
> 
> **[Sayfayı yenileyin, F5]**
> 
> "Bakın, burada `GET /api/tracks/42` diye bir istek var."
>
> **[İstek detaylarını gösterin]**
> 
> "Frontend buradan backend'e 'Bana 42 numaralı şarkının bilgilerini ver' diyor."

**[VS Code'u açın - server.js dosyasını bulun]**

> "Backend'de server.js dosyamız var. Şurada..."
> 
> **[Kod satırını gösterin - yaklaşık satır 250-280]**

```javascript
app.get('/api/tracks/:id', async (req, res) => {
    const result = await pool.request()
        .input('TrackID', sql.Int, req.params.id)
        .execute('Music.sp_GetTrackDetails');  // 👈 İŞTE BURADA!
    res.json(result.recordset[0]);
});
```

> "Görüyorsunuz, burada `sp_GetTrackDetails` diye bir Stored Procedure çağırıyoruz."

**[SQL dosyasını açın - database/09_StoredProcedures.sql]**

> "Bu SP'nin koduna bakalım..."

```sql
CREATE PROCEDURE Music.sp_GetTrackDetails
    @TrackID INT
AS
BEGIN
    SELECT 
        t.TrackID, t.Title, t.AudioUrl, t.PlayCount,
        u.Username AS ArtistName,
        g.Name AS GenreName
    FROM Music.Tracks t
    INNER JOIN Identity.Users u ON t.ArtistID = u.UserID
    LEFT JOIN Music.Genres g ON t.GenreID = g.GenreID
    WHERE t.TrackID = @TrackID
END
```

> "Burada 3 tabloyu birleştiriyoruz: Tracks, Users, Genres. Şarkı bilgisi, sanatçı adı, tür adı... hepsini tek seferde getiriyor."
>
> "Eğer SP olmasaydı, backend'de bu 3 tabloyu tek tek sorgulamamız gerekirdi. Ama şimdi tek satırda `sp_GetTrackDetails` diyoruz, işimiz bitiyor."

---

### C. İkinci Örnek: Playlist'ler

**[Browser'da library.html açın]**

> "Şimdi başka bir örnek. Kullanıcının playlist sayfası."
>
> **[Playlist'leri gösterin]**
> 
> "Burda 'Favorilerim' diye bir playlist var. İçinde 3 şarkı var, toplam 10 dakika sürmüş."
>
> "Peki bu sayılar nereden geliyor? Yine bir SP var: `sp_GetUserPlaylists`"

**[SQL dosyasını gösterin]**

> "Bu SP biraz daha ilginç, çünkü **CURSOR** kullanıyor."
>
> **[CURSOR kavramını basitçe açıklayın]**
> 
> "CURSOR ne demek? Veritabanında satırları **tek tek** işlemek demek."
>
> "Mesela bu kullanıcının 5 tane playlist'i var. SP, her playlist'i teker teker alıyor, içindeki şarkıları sayıyor, toplam süreyi hesaplıyor."
>
> "Yani bir loop gibi düşünün. `for each playlist...` mantığı."

---

## ⚡ BÖLÜM 2: TRIGGERS - OTOMATİK PİLOT (2 dakika)

### A. Trigger Nedir?

> "Tamam, Stored Procedure'leri anladık. Şimdi Trigger'lara bakalım."
>
> "**Trigger**, veritabanında **otomatik çalışan kodlar**. Yani biz bir şey yaptığımızda, arka planda başka bir şey de otomatik olarak oluyor."
>
> **[Analoji]**
> 
> "Ev alarmı gibi. Kapıyı açtığınızda alarm otomatik kapanır. Siz 'alarmı kapat' diye komut vermiyorsunuz, zaten otomatik. İşte Trigger da öyle."

---

### B. Canlı Demo: PlayCount Trigger

**[Browser'da bir şarkı açın - track-detail.html]**

> "Bakın, şu şarkının dinlenme sayısı 15,234."
>
> **[PlayCount sayısını gösterin]**
> 
> "Şimdi ben bu şarkıyı dinleyeceğim..."
>
> **[Play butonuna basın, 2-3 saniye bekleyin]**
> 
> **[Sayfayı yenileyin]**
> 
> "Bakın! Şimdi 15,235 oldu. +1 arttı."
>
> "Peki biz kod olarak 'PlayCount +1 arttır' diye bir şey yazdık mı? **Hayır!**"
>
> "Bu otomatik oldu. Nasıl? **Trigger sayesinde!**"

**[VS Code'da trigger dosyasını açın - database/14_Triggers.sql]**

```sql
CREATE TRIGGER Interaction.trg_UpdatePlayCount
ON Interaction.Plays
AFTER INSERT
AS
BEGIN
    UPDATE Music.Tracks
    SET PlayCount = PlayCount + 1
    FROM Music.Tracks t
    INNER JOIN inserted i ON t.TrackID = i.TrackID
END
```

> "Bakın, bu trigger **Plays tablosuna** bağlı."
>
> "Ne zaman `Plays` tablosuna yeni bir kayıt eklense, bu trigger otomatik çalışıyor ve `PlayCount`'u 1 arttırıyor."
>
> **[Akışı açıklayın]**
> 
> "Yani şöyle oluyor:"
> 
> "1. Kullanıcı şarkıyı dinledi"
> "2. Backend, `Plays` tablosuna kayıt ekledi: 'User 5, Track 42'yi dinledi'"
> "3. Trigger otomatik çalıştı: 'Track 42'nin PlayCount'unu +1 arttır'"
> "4. Biz hiçbir şey yapmadık, otomatik oldu!"

---

### C. İkinci Demo: Takip Sistemi

**[Profile sayfasını açın - profile.html]**

> "Başka bir örnek. Şu sanatçının profili."
>
> **[FollowerCount'u gösterin]**
> 
> "Bakın, 1,245 takipçisi var."
>
> "Şimdi ben bu sanatçıyı takip edeceğim..."
>
> **[Follow butonuna tıklayın]**
> 
> **[Sayfayı yenileyin]**
> 
> "Bakın, şimdi 1,246 oldu!"
>
> "Yine trigger. `trg_UpdateFollowerCount_Insert` adında bir trigger var."
>
> "Ne zaman biri birini takip etse, otomatik olarak takipçi sayısı artıyor."
>
> **[Ters işlem de gösterebilirsiniz]**
> 
> "Eğer takipten çıksam..."
>
> **[Unfollow yapın]**
> 
> "1,245'e geri döndü. Çünkü başka bir trigger var: `trg_UpdateFollowerCount_Delete`. Takipten çıkınca sayıyı azaltıyor."

---

### D. Güvenlik Trigger'ı: Spam Koruması

**[Yorum bölümünü gösterin]**

> "Son bir trigger örneği: **Spam koruması**."
>
> "Mesela şu şarkıya yorum yapacağım..."
>
> **[Bir yorum yazın, gönder]**
> 
> "Tamam, yorum gitti."
>
> "Şimdi hemen arkasından 2. yorum yazmaya çalışacağım..."
>
> **[Hemen 2. yorum yazıp göndermeyi deneyin]**
> 
> **[Hata mesajı çıkacak: "Spam koruması: 5 saniye bekleyin!"]**
> 
> "Bakın, izin vermedi! **'5 saniye bekle'** diyor."
>
> "Bu da bir trigger: `trg_PreventCommentSpam`"
>
> "5 saniye içinde 2. yorum yapamıyorsunuz. Spam engellemek için."

---

## 💾 BÖLÜM 3: BACKUP SİSTEMİ (1.5 dakika)

### A. Backup Neden Önemli?

> "Son olarak Backup sistemimize bakalım."
>
> "Backup yani **yedekleme** çok önemli. Çünkü ne olur ne olmaz..."
>
> **[Senaryo anlatın]**
> 
> "Mesela elektrik kesildi, sistem çöktü, ya da yanlışlıkla bir şeyi sildik. İşte o zaman backup sayesinde her şeyi geri getirebiliyoruz."
>
> "Bizim projede **4 katmanlı** backup sistemi var."

---

### B. 4 Katman

**[VS Code'da backups klasörünü gösterin]**

> "Bakın, `backups` klasörümüz var."

**1. Katman: SQL Backup**

> "**Birinci katman:** SQL Server'ın kendi backup'ı."
>
> **[.bak dosyalarını gösterin]**
> 
> "`FrekansDB_full_2025-12-23.bak` - Bu tam yedek. Tüm veritabanı."
>
> "65 MB. İçinde her şey var: tablolar, veriler, stored procedure'ler, trigger'lar..."

**2. Katman: JSON Export**

> "**İkinci katman:** Her tabloyu JSON olarak export ediyoruz."
>
> **[json_2025-12-23 klasörünü gösterin]**
> 
> "Bakın, burada her tablo ayrı JSON dosyası."
>
> "`Identity_Users.json` - 1,010 kullanıcı"
> "`Music_Tracks.json` - 50,020 şarkı"
>
> "Neden JSON? Çünkü başka sistemlere import etmek kolay. Mesela MySQL'e, MongoDB'ye taşımak istersek, JSON'dan hemen yapabiliriz."

**3. Katman: Stored Procedure Backup**

> "**Üçüncü katman:** Tüm Stored Procedure'lerin kodlarını ayrı ayrı kaydediyoruz."
>
> **[stored_procedures klasörünü gösterin]**
> 
> "Her SP bir SQL dosyası. Mesela `Music_sp_GetTrackDetails.sql`"
>
> "Böylece eğer bir SP bozulursa, buradan tekrar yükleyebiliriz."

**4. Katman: Upload Dosyaları**

> "**Dördüncü katman:** Kullanıcıların yüklediği dosyalar."
>
> **[uploads klasörünü gösterin]**
> 
> "`audio/` - Şarkı dosyaları (MP3)"
> "`covers/` - Albüm kapakları (resimler)"
>
> "Bunlar da kopyalanıyor. Çünkü veritabanında sadece dosya **yolları** var. Asıl dosyalar burada."

---

### C. Otomatik Backup

**[backup.ps1 dosyasını gösterin]**

> "Bu backupleri her seferinde elle yapmıyoruz. **PowerShell script** ile otomatik."

```powershell
# backup.ps1
.\backup.ps1 -BackupType full
```

> "Bu komutu çalıştırdığınızda:"
> 
> "1. SQL backup alıyor"
> "2. JSON export yapıyor"
> "3. SP'leri kaydediyor"
> "4. Upload klasörünü kopyalıyor"
>
> "Hepsi **otomatik**, 2-3 dakikada bitiyor."

**[Windows Task Scheduler'ı bahsedin - opsiyonel]**

> "Bunu Windows'un **Task Scheduler**'ına ekledik."
>
> "Her gece saat 02:00'da otomatik çalışıyor. Biz uyurken backup alınıyor!"

---

### D. Backup Test

> "Backup alınca geri yükleme de yapabiliyoruz."

**[restore-database.js dosyasını gösterin - sadece bahsedin]**

> "Mesela restore script'imiz de var: `restore-database.js`"
>
> "Eğer veritabanı bozulursa, bu script ile backuptan geri yükleyebiliyoruz."

---

## 🎯 SONUÇ (30 saniye)

> "Tamam, özetleyelim:"
>
> "**1. Stored Procedures:** Hazır SQL sorguları. Frontend'den çağırdık, karmaşık işlemleri tek komutla yaptık."
>
> "**2. Triggers:** Otomatik pilot. PlayCount, FollowerCount otomatik güncelleniyor. Spam koruması otomatik."
>
> "**3. Backup:** 4 katmanlı yedekleme. SQL + JSON + SP + Upload dosyaları. Otomatik, her gece çalışıyor."
>
> **[Gülümseyerek bitirin]**
> 
> "İşte bu kadardı. Sorularınız varsa alabilirim!"

---

## 📌 EKSTRA İPUÇLARI

### Sunum Sırasında:

✅ **Frontend'i gerçekten açın** - Sadece kod göstermeyin, kullanıcının gördüğü ekranı gösterin

✅ **DevTools kullanın (F12)** - Network sekmesi, hangi API'lerin çağrıldığını gösterir

✅ **Canlı demo yapın** - Şarkı dinleyin, takip edin, yorum yapın. Sayıların değiştiğini gösterin

✅ **Basit analojiler kullanın** - Kahvaltı örneği, alarm örneği gibi

✅ **Elinizi kullanın** - Ekranda nerede ne var, işaret edin

✅ **Heyecanlı olun** - "Bakın şimdi ilginç bir şey olacak!" gibi ifadeler kullanın

❌ **Çok teknik detaya girmeyin** - "ACID properties", "transaction isolation" gibi şeylerden bahsetmeyin

❌ **Hata yapmaktan korkmayın** - Canlı demo'da hata olabilir, gülün geçin

❌ **Hızlı konuşmayın** - 5 dakika yeterli, acele etmeyin

---

## 🎬 AÇILIŞTA ŞAKALARİNIZ (Opsiyonel - Buz Kırıcı)

> "Merhaba, ben 3. bölümü anlatacağım. Neden 3. bölüm en iyisi biliyor musunuz? Çünkü trigger'lar var! Ben bir şey yapmadan her şey oluyor!" 😄
>
> ya da
>
> "Backup yapmak ev ödevi yapmak gibi... Herkes 'yaparım' der ama son gece yapılır. Bizim projede otomatik yapılıyor, çok şükür!" 😄

---

## ⏱️ ZAMAN KONTROLÜ

- **0:00-0:30** → Giriş
- **0:30-2:00** → Stored Procedures (1.5 dk)
- **2:00-4:00** → Triggers (2 dk)
- **4:00-5:00** → Backup (1 dk)
- **5:00** → Sonuç

**Toplam:** 5 dakika ⏱️

---

## 💪 BAŞARILAR DİLERİM!

Rahat olun, bildiklerinizi anlatın. Frontend'i göstererek anlatınca çok daha anlaşılır oluyor. Hocalar da kodu değil, **çalışan sistemi** görmek ister.

Kolay gelsin! 🚀
