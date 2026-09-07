# Tenis trenér — evidence tréninků a plateb

Webová aplikace pro jednoho trenéra: zápis odtrénovaných jednotek (hala/venku),
evidence účastníků a jejich plateb, docházka za období a export dat do Excelu
(kontingenční tabulka). Postavena na **Next.js**, databázi **Supabase**
(Postgres) a nasazení na **Vercel**. Funguje na počítači, mobilu i tabletu.

---

## 1. Jak je aplikace navržená (shrnutí rozhodnutí)

Zadání bylo v pár místech otevřené k výkladu. Zvolil jsem tato řešení — pokud
vám nevyhovují, dají se snadno upravit (dejte mi vědět, které místo v kódu):

- **Ceny za trénink (hala/venku) a "platba přes oddíl" jsou nastavené u každé
  tréninkové jednotky zvlášť** (v administraci), protože různé skupiny
  svěřenců typicky platí různě. Při zápisu tréninku se částka automaticky
  přednastaví podle zvolené jednotky a místa (hala/venku), ale jde ji ručně
  přepsat.
- **Přihlášení**: jednoduchý e-mail/heslo účet (Supabase Auth) pro jednoho
  uživatele — trenéra. Bez přihlášení není administrace ani zápis tréninků
  přístupný.
- **Export do Excelu**: aplikace nabízí zabezpečený odkaz (chráněný tajným
  tokenem), který si Excel přes Power Query stáhne jako tabulku. Přímé
  napojení Excelu na databázi jsme zvolili nepoužít, protože by vyžadovalo
  instalaci ODBC ovladače a ukládání přístupových údajů k databázi přímo v
  Excelu — zabezpečený odkaz je bezpečnější a stejně pohodlný.
- **Zaokrouhlení platby**: celková částka za jednotku se vydělí počtem
  přítomných svěřenců a zaokrouhlí nahoru na celé koruny (přesně dle zadání).
- **Smazání svěřence/jednotky**: pokud už mají zapsané tréninky, nejdou
  smazat (kvůli zachování historie plateb) — místo toho jde jednotku nebo
  svěřence "deaktivovat" (přestanou se nabízet, ale historie zůstane).

---

## 2. Co budete potřebovat

- Účet na [supabase.com](https://supabase.com) (zdarma stačí)
- Účet na [vercel.com](https://vercel.com) (zdarma stačí)
- Node.js 20+ nainstalovaný na počítači (pro první otestování před nasazením) — <https://nodejs.org>
- Doporučeno: účet na [github.com](https://github.com) (usnadní nasazení na Vercel)

---

## 3. Založení databáze v Supabase

1. Na [supabase.com](https://supabase.com) klikněte na **New project**.
2. Vyplňte název projektu a heslo do databáze (uložte si ho, ale pro provoz
   aplikace ho nebudete přímo potřebovat).
3. Po vytvoření projektu jděte do **SQL Editor** (ikona v levém menu).
4. Otevřete soubor `supabase/migrations/0001_init.sql` z tohoto projektu,
   zkopírujte celý jeho obsah a vložte ho do SQL editoru v Supabase.
5. Klikněte na **Run**. Vytvoří se všechny potřebné tabulky, zabezpečení
   (Row Level Security) a pohled pro export.
6. Jděte do **Authentication → Users** a klikněte na **Add user → Create new
   user**. Zadejte svůj e-mail a heslo — tím vznikne váš přihlašovací účet
   trenéra. (Zaškrtněte "Auto Confirm User", ať nemusíte potvrzovat e-mail.)
7. Jděte do **Project Settings → API**. Budete potřebovat tři hodnoty:
   - **Project URL**
   - **anon public** klíč
   - **service_role** klíč (⚠️ tajný, nikdy ho nikam nesdílejte a nedávejte
     do klientského kódu)

---

## 4. První spuštění na vlastním počítači (doporučeno pro ověření)

```bash
npm install
cp .env.local.example .env.local
```

Otevřete `.env.local` a doplňte hodnoty ze Supabase (bod 3.7) a vymyslete si
vlastní dlouhý náhodný token do `EXPORT_API_TOKEN` (např. spusťte
`openssl rand -hex 32` v terminálu a výsledek zkopírujte).

```bash
npm run dev
```

Otevřete <http://localhost:3000>, přihlaste se e-mailem a heslem z bodu 3.6.
Zkuste založit svěřence, tréninkovou jednotku a zapsat trénink.

---

## 5. Nasazení na Vercel

Nejjednodušší cesta je přes GitHub:

1. Nahrajte tento projekt do nového GitHub repozitáře (nebo mi dejte vědět a
   pomůžu s příkazy `git init` / `git push`).
2. Na [vercel.com](https://vercel.com) klikněte na **Add New → Project** a
   vyberte svůj GitHub repozitář.
3. V kroku **Environment Variables** přidejte stejné proměnné jako v
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `EXPORT_API_TOKEN`
4. Klikněte na **Deploy**. Za chvíli dostanete adresu typu
   `https://vas-projekt.vercel.app`.
5. Otevřete adresu, přihlaste se a aplikace je připravená k použití na
   počítači, mobilu i tabletu (přidejte si stránku na plochu telefonu jako
   záložku pro rychlý přístup).

> Bez GitHubu lze nasadit i přes příkaz `npx vercel` z terminálu ve složce
> projektu — Vercel vás provede přihlášením a nastavením proměnných.

---

## 6. Používání aplikace

1. **Administrace → Svěřenci**: založte všechny své svěřence.
2. **Administrace → Tréninkové jednotky**: založte skupiny/kroužky, nastavte
   u nich cenu za trénink v hale, cenu za trénink venku, zda platba jde přes
   oddíl, a zaškrtněte, kteří svěřenci do jednotky standardně patří.
3. **Zápis tréninku**: vyberte datum, čas, místo (hala/venku) a jednotku —
   částka a seznam účastníků se přednastaví, obojí můžete upravit. Účastníka
   jde odebrat jen z tohoto konkrétního tréninku, nebo přidat někoho navíc
   (i úplně nového svěřence). Uložením se každému přítomnému zapíše jeho
   podíl platby.
4. **Docházka**: zvolte období (od–do) a uvidíte souhrn plateb za každého
   svěřence i podrobný seznam jednotlivých tréninků.
5. **Administrace → Export do Excelu**: zde najdete odkaz a přesný návod,
   jak si v Excelu vytvořit kontingenční tabulku napojenou na tato data
   (řádky = svěřenci, sloupce = dny v měsíci, samostatný list pro každý
   měsíc, součet dole).

---

## 7. Bezpečnost

- Aplikaci používá jen jeden přihlášený uživatel (vy). Nikomu nesdílejte
  přihlašovací údaje ani odkaz z sekce "Export do Excelu" (obsahuje tajný
  token).
- `SUPABASE_SERVICE_ROLE_KEY` a `EXPORT_API_TOKEN` patří pouze do
  proměnných prostředí na Vercelu / v `.env.local` — nikdy je nevkládejte do
  kódu ani je nikomu neposílejte.

---

## 8. Struktura projektu (pro případné budoucí úpravy)

```
supabase/migrations/0001_init.sql   databázové schéma (spustit v Supabase SQL Editoru)
src/app/trenink/                    zápis/úprava tréninku (hlavní pracovní obrazovka)
src/app/dochazka/                   přehled docházky a plateb za období
src/app/admin/                      administrace (svěřenci, jednotky, export)
src/app/api/export/route.ts         zabezpečené CSV API pro Excel/Power Query
src/app/login/                      přihlašovací stránka
src/lib/supabase/                   Supabase klienti (prohlížeč/server) a middleware
```

Přeji hodně úspěchů s tréninky! 🎾
