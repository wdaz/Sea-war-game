# Sea War Game — Yenidən Dizayn Spesifikasiyası

**Tarix:** 2026-07-27  
**Layihə:** Sea War (Amiral Batti)  
**Texnologiya:** Vanilla JS (ES Modules), HTML5, CSS3  
**Məqsəd:** Öyrənmə / Portfolio

---

## 1. Məqsəd

Mövcud Sea War oyununun aşağıdakı problemlərini həll edərək yenidən yazmaq:

- Kritik buqlar (oyun heç vaxt bitmir, yenidən başlatma işləmir, implicit global dəyişənlər)
- Qlobal state — bütün dəyişənlər global scope-dadır
- Modul yoxluğu — bütün kod bir-birinə bağlıdır
- Zəif UI — animasiya yoxdur, responsive deyil, oyun vəziyyəti göstərilmir

Nəticə: OOP class arxitekturası, adaptiv AI rəqib, polished UI.

---

## 2. Texniki Yanaşma

**Vanilla JS + ES Modules** — `<script type="module">` ilə qlobal dəyişən sıfıra endirilir. Framework yoxdur. Xarici kitabxana yoxdur.

---

## 3. Fayl Strukturu

```
index.html
main.css
src/
  Ship.js      — gəmi vəziyyəti
  Board.js     — 10×10 ızgara məntiqi
  AI.js        — adaptiv rəqib
  Game.js      — oyun axışı
  UI.js        — render, hadisələr, animasiyalar
  main.js      — giriş nöqtəsi
```

---

## 4. Class İnterfeyslər

### `Ship`

```js
new Ship(size)
ship.place(startIndex, direction)  // direction: 'horizontal' | 'vertical'
ship.hit(index)                    // xananı vurulmuş işarələ
ship.isSunk()                      // → boolean
ship.occupies(index)               // → boolean
```

**Daxili vəziyyət:** `size`, `startIndex`, `direction`, `hits[]`

### `Board`

```js
new Board()
board.placeShip(ship, index, dir)  // → true (uğurlu) | false (etibarsız)
board.receiveAttack(index)         // → 'hit' | 'miss' | 'already-attacked'
board.allSunk()                    // → boolean
board.autoPlace()                  // gəmiləri avtomatik təsadüfi yerləşdir
```

**Gəmi tərkibi (klassik):** 1×4, 2×3, 3×2, 4×1

**Yerləşdirmə qaydaları:**
- Izgaradan kənara çıxa bilməz
- Gəmilər üst-üstə düşə bilməz
- Bitişik xanalar (diaqonal daxil) boş olmalıdır

### `AI`

```js
new AI()
ai.chooseAttack(board)             // → index (hücum xanası)
ai.adjustDifficulty(playerWon)     // playerWon: boolean
```

**Çətinlik sistemi:**
- Diapazon: `0.0` (tam random) → `1.0` (tam ağıllı)
- Başlanğıc: `0.5`
- Oyunçu qalib olduqda: `+0.1` (max `1.0`)
- Oyunçu uduzduqda: `-0.1` (min `0.1`)
- `localStorage`-da `seawar_ai_difficulty` açarı ilə saxlanılır

**Hücum strategiyası:**

| Çətinlik | Davranış |
|---|---|
| `< 0.4` | Tamamilə təsadüfi atəş |
| `0.4 – 0.7` | Hunt & Target: vurduqda ətraf 4 xanaya keçir |
| `> 0.7` | Hunt & Target + istiqamət: ardıcıl 2 hit-dən sonra gəminin xəttini müəyyən edir |

**Adaptasiya oyunçuya görünmür** — UI-da çətinlik göstəricisi yoxdur.

### `Game`

```js
new Game()
game.start()                       // yerləşdirmə mərhələsinə keç
game.playerAttack(index)           // oyunçu hücumu → AI cavab hücumu → UI yenilə
game.checkWin()                    // → 'player' | 'ai' | null
game.restart()                     // eyni AI çətinliyi ilə yenidən başla
```

**Oyun mərhələləri:** `'placement'` → `'battle'` → `'gameover'`

### `UI`

```js
// Board-ları render edir
// CSS animasiyaları tetikləyir
// Oyunçunun gəmi yerləşdirməsini idarə edir
// Oyun vəziyyətini (skor, növbə, mesaj) göstərir
// Game instansına hadisələri ötürür
```

**`main.js`** — `Game` və `UI`-ni birləşdirir, oyunu başladır.

---

## 5. UI Dizayn

### Layout

```
┌─────────────────────────────────────────┐
│             SEA WAR                     │
│   Skor: Oyunçu 2 — AI 1   [Yeni Oyun]  │
├──────────────────┬──────────────────────┤
│   SƏNİN LÖVHƏN   │   AI-NİN LÖVHƏSI    │
│   (gəmilər       │   (hədəflər          │
│    görünür)      │    görünmür)         │
├──────────────────┴──────────────────────┤
│   Mesaj: "Vuruldu! Növbən var."         │
└─────────────────────────────────────────┘
```

**Responsive:** Mobil ekranda (`< 768px`) lövhələr üst-üstə düzülür.

### Oyun Mərhələləri

1. **Yerləşdirmə mərhələsi**
   - Oyunçu gəmiləri klik ilə yerləşdirir
   - R düyməsi ilə gəmini fırladır (horizontal ↔ vertical)
   - "Avtomatik Yerləşdir" düyməsi mövcuddur
   - Etibarsız yerləşdirmə cəhdi vizual olaraq rədd edilir

2. **Döyüş mərhələsi**
   - Oyunçu AI lövhəsinə klik edərək hücum edir
   - AI avtomatik cavab verir
   - Növbə göstəricisi aktiv lövhəni vurğulayır

3. **Nəticə ekranı**
   - Qalib/məğlub mesajı
   - Yekun skor
   - "Yenidən Oyna" düyməsi

### Animasiyalar (CSS)

| Hadisə | Animasiya |
|---|---|
| Miss | Mavi dalğa ripple effekti |
| Hit | Qırmızı partlayış (scale + fade) |
| Sunk | Gəmi tədricən yox olur (fade-out + scale-down) |
| Növbə keçişi | Aktiv lövhə parlaqlıq artımı |

### Rəng Sxemi

| Element | Rəng |
|---|---|
| Fon | `#0a1628` (dərin dəniz gecəsi) |
| Gəmi | `#4a6fa5` (dəniz mavisi) |
| Hit | `#e63946` (qırmızı) |
| Miss | `#457b9d` (açıq mavi) |
| UI accent | `#f4a261` (qızılı) |
| Mətn | `#f1faee` (ağ) |

---

## 6. Xəta İdarəetməsi

**Gəmi yerləşdirməsi:**
- Izgaradan kənara çıxma → `placeShip()` `false` qaytarır, UI xəbərdarlıq göstərir
- Üst-üstə düşmə → eyni davranış
- Bitişik xana pozuntusu → eyni davranış

**Atəş:**
- Artıq hücum edilmiş xana → `'already-attacked'` qaytarılır, UI ipucu göstərir, növbə keçmir

**AI guard:**
- Boş xana qalmayıbsa AI hücumdan imtina edir (praktikada baş verməz)

---

## 7. Manual Test Ssenarisi

Browser konsolunda:

```js
import { Ship } from './src/Ship.js';
import { Board } from './src/Board.js';

// Ship testi
const s = new Ship(3);
s.place(0, 'horizontal');
s.hit(0); s.hit(1); s.hit(2);
console.assert(s.isSunk() === true, 'Ship should be sunk');

// Board testi
const b = new Board();
b.autoPlace();
console.assert(b.allSunk() === false, 'Fresh board should not be all sunk');
console.assert(b.receiveAttack(0) !== 'already-attacked', 'Fresh cell');
console.assert(b.receiveAttack(0) === 'already-attacked', 'Repeat attack');
```

---

## 8. Həll Edilən Mövcud Buqlar

| Buq | Həll |
|---|---|
| `i` reset edilmir — ikinci "Başla" işləmir | `Game.restart()` bütün vəziyyəti sıfırlayır |
| `counter == len` yanlışdır — oyun bitmir | `Board.allSunk()` ilə hər hücumdan sonra yoxlanılır |
| `item`, `helper`, `yoxlama` implicit global | ES Modules — hər şey local scope-dadır |
| `yoxlamaArr` helper-də global yazılır | `Board` metodlarına köçürülür, global yoxdur |

---

## 9. Həyata Keçirilməyənlər (YAGNI)

- Onlayn çox oyunçu
- Backend / server
- Animasiya kitabxanaları (GSAP və s.)
- Test framework (Jest və s.)
- Build tool (Webpack, Vite və s.)
