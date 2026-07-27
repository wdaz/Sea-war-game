# BattleShip — Tactical Command UI Redesign

**Tarix:** 2026-07-27  
**Məhsul:** BattleShip  
**Əhatə:** Placement, Battle və Game Over ekranlarının vizual redesign-i  
**Mənbə:** Mövcud Vanilla JS/HTML/CSS codebase və aktiv Pencil `.pen` sənədi

## 1. Məqsəd

Mövcud işlək oyunu müasir dəniz komanda mərkəzi vizual dilinə keçirmək. Redesign:

- `placement → battle → gameover` axınını dəyişməməlidir;
- iki 10×10 lövhəni əsas oyun obyekti kimi saxlamalıdır;
- yerləşdirmə, hücum və nəticə vəziyyətlərini rəngdən əlavə forma, ikon və mətnlə fərqləndirməlidir;
- desktop və mobil görünüşdə əsas əmrləri asan əlçatan etməlidir;
- mövcud `data-*` selektorları və oyun davranışları ilə uyğun implementasiya oluna bilməlidir.

## 2. Seçilmiş vizual istiqamət

**Tactical Command Center** — dərin lacivərdi fon üzərində radar-cyan məlumat qatları, narıncı əsas əmrlər və qırmızı təhlükə/zərbə vəziyyətləri.

Alternativlərdən retro xəritə vizual olaraq daha dekorativ, neon arcade isə daha enerjili olardı. Tactical Command Center grid oxunaqlığına, adaptiv AI mövzusuna və oyunun qərarvermə xarakterinə daha yaxşı xidmət edir.

Vizual dil hərbi simulyatoru təqlid etməməlidir. İnterfeys texniki və atmosferik, eyni zamanda rahat oxunan və portfolio səviyyəsində təmiz qalmalıdır.

## 3. İnformasiya arxitekturası

### Üst komanda paneli

- BattleShip wordmark və sadə radar nişanı
- Cari mərhələ: `DONANMANI YERLƏŞDİR`, `DÖYÜŞ`, yaxud `NƏTİCƏ`
- Oyunçu və AI hesabı
- `Yeni oyun` secondary əmri

### Əsas oyun sahəsi

- Oyunçu lövhəsi: gəmilər və AI hücum nəticələri görünür
- AI lövhəsi: gizli donanma, oyunçunun hit/miss nəticələri görünür
- Hər lövhədə A–J sütun və 1–10 sətir koordinatları
- Aktiv lövhə sərhəd, başlıq və status işarəsi ilə vurğulanır

### Aşağı əməliyyat paneli

Panel mərhələyə görə məzmun dəyişir:

- Placement: cari gəmi ölçüsü, qalan gəmi sayı, istiqamət və avtomatik yerləşdirmə
- Battle: növbə/status mesajı və son hücum nəticəsi
- Game Over: qalib/məğlub statusu, yekun hesab və yenidən oyun əmri

## 4. Ekranlar

### 4.1 Placement Phase

- Oyunçu lövhəsi əsas, AI lövhəsi isə kilidli/standby vəziyyətində göstərilir.
- Cari gəmi məlumatı `4 xanalı gəmi · 10 gəmi qalıb` formatında verilir.
- `Fırlat (R)` istiqaməti həm ikon, həm `Üfüqi/Şaquli` mətn etiketi ilə göstərir.
- `Avtomatik yerləşdir` əsas sürətli əməl olaraq qalır.
- Valid preview cyan, invalid preview qırmızı diaqonal işarə və xəbərdarlıq mətni ilə göstərilir.
- Son gəmi uğurla yerləşdirildikdə mövcud davranışa uyğun olaraq Battle Phase avtomatik başlayır.

### 4.2 Battle Phase

- AI lövhəsi əsas hədəf sahəsinə çevrilir; oyunçu lövhəsi müdafiə statusu kimi görünür.
- Hücum edilə bilən xana hover/focus zamanı radar nişangahı ilə göstərilir.
- Miss: mavi halqa və nöqtə.
- Hit: qırmızı mərkəz, partlayış halqası və `Vuruldu` statusu.
- Sunk: əlaqəli xanalar qırmızı kontur və aşağı opacity gəmi izi ilə işarələnir.
- Artıq hücum edilmiş xana disabled görünüş alır və `Bu koordinata artıq hücum edilib` mesajı göstərilir.
- Son oyunçu və AI nəticəsi əməliyyat panelində bir cümləlik combat log kimi saxlanılır.

### 4.3 Game Over

- Lövhələr kontekstdə görünməyə davam edir; nəticə modalı onları tam gizlətmir.
- Nəticə panelində qalib/məğlub başlığı, cari hesab və `Yenidən oyna` primary əmri yerləşir.
- Qələbə cyan/narıncı, məğlubiyyət isə qırmızı vurğu ilə göstərilir.
- `Yenidən oyna` mövcud restart davranışından istifadə edir və ümumi hesabı qoruyur.

## 5. Vizual sistem

### Rənglər

| Token | Dəyər | İstifadə |
|---|---|---|
| `bg-deep` | `#07111F` | Səhifə fonu |
| `surface` | `#0D1B2E` | Panel fonu |
| `surface-raised` | `#13253B` | Aktiv panel və toolbar |
| `grid` | `#24435C` | Grid xətləri |
| `cyan` | `#45D6D0` | Radar, focus, aktiv vəziyyət |
| `orange` | `#F5A84B` | Primary əmrlər və hesab |
| `danger` | `#F05A67` | Hit və invalid vəziyyət |
| `text-primary` | `#EDF7F6` | Əsas mətn |
| `text-muted` | `#88A5B8` | Köməkçi mətn |

Kontrast WCAG AA hədəfinə uyğun saxlanmalıdır. Rəng heç bir vəziyyətin yeganə göstəricisi olmayacaq.

### Tipoqrafiya

- Başlıqlar və taktiki etiketlər: `Rajdhani`, 600–700
- Mətn, düymə və statuslar: `Inter`, 400–600
- Başlıqlarda ölçülü letter-spacing istifadə olunur; uzun mesajlarda geniş letter-spacing tətbiq edilmir.

### Forma və effekt

- Panellər 8–12 px radiusla, nazik cyan/steel konturla göstərilir.
- Kölgə minimum səviyyədədir; dərinlik əsasən səth rəngləri və konturla qurulur.
- Dekorativ radar xətləri aşağı opacity ilə yalnız böyük boş sahələrdə istifadə olunur.
- Animasiya 150–450 ms aralığında, `prefers-reduced-motion` üçün söndürülə bilən olmalıdır.

## 6. Komponentlər

- `CommandHeader`
- `PhaseBadge`
- `ScoreCluster`
- `BoardPanel`
- `CoordinateGrid`
- `BoardCell`
- `FleetStatus`
- `PlacementToolbar`
- `CombatStatus`
- `ResultPanel`
- `ActionButton`

Pencil sənədində təkrarlanan UI elementləri reusable component kimi qurulmalıdır. Placement və Battle ekranları eyni header, board shell və button component-lərindən istifadə etməlidir.

## 7. Codebase uyğunluğu

Redesign aşağıdakı mövcud davranışları qoruyur:

- `[data-phase]`: mərhələ səviyyəsində görünüş dəyişməsi
- `[data-board="player"]` və `[data-board="ai"]`: board render hədəfləri
- `[data-action="rotate"]`
- `[data-action="auto-place"]`
- `[data-action="new-game"]`
- `[data-message]`
- `.ship`, `.hit`, `.miss`, `.sunk`, `.preview`, `.preview--bad`

Koordinat etiketləri və əlavə dekorativ wrapper-lər board-un 100 birbaşa `.cell` uşağını pozmamalıdır. Əgər implementasiya zamanı koordinatlar əlavə edilərsə, onlar `.board` xaricində ayrıca grid shell qatında yerləşdirilməlidir.

Fleet status və ətraflı combat log sonrakı implementasiyada mövcud `Game`, `Board` və `UI` state-dən törədilməlidir; domain class-lara yeni vizual state yazılmamalıdır.

## 8. Responsive davranış

- `≥ 1024 px`: iki lövhə yan-yana, ortaq əməliyyat paneli aşağıda
- `768–1023 px`: lövhələr daha kompakt, header iki sətrə keçə bilər
- `< 768 px`: lövhələr şaquli düzülür, primary əmrlər viewport-un altına yaxın qalır
- Standalone düymə və əmrlərin touch hədəfləri minimum 44×44 px olmalıdır
- 10×10 spatial grid xanaları mobil görünüşdə minimum 28×28 px olmalı və aydın pressed/focus feedback verməlidir
- 10×10 grid viewport-a sığmalı, üfüqi scroll yaratmamalıdır

## 9. Xəta və boş vəziyyətlər

- Invalid placement: qırmızı preview, xəbərdarlıq ikonu və mətn
- Repeated attack: xana disabled, mesaj dəyişir, növbə keçmir
- AI lövhəsi placement zamanı: kilid ikonu və `Donanma gizlidir` statusu
- Mesaj boş olduqda layout hündürlüyü dəyişməməlidir
- Uzun Azərbaycan dilində status mesajları toolbar-dan daşmamalıdır

## 10. Yoxlama meyarları

Pencil redesign tamamlandıqda:

1. Placement, Battle və Game Over vəziyyətləri ayrıca görünür.
2. Hər ekranın layout-u collapse və clip problemi olmadan render olunur.
3. İki board-un 10×10 strukturu vizual olaraq aydındır.
4. Ship, preview, invalid, hit, miss və sunk vəziyyətləri fərqlənir.
5. Əsas mətn və əmrlər kontrast baxımından oxunaqlıdır.
6. Reusable component-lər təkrarlanan elementlərdə istifadə olunur.
7. Desktop ekranları mövcud codebase davranışlarına xəritələnə bilir.
8. Responsive implementasiya üçün ölçü və hierarchy qeyri-müəyyənliyi qalmır.

## 11. Əhatədən kənar

- Multiplayer və backend
- Yeni AI mexanikası və çətinlik seçimi
- Səs effektləri
- Hesab/profil sistemi
- Mövcud oyun qaydalarının dəyişdirilməsi
- Bu mərhələdə HTML/CSS/JavaScript implementasiyası
