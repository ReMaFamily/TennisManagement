import { headers } from "next/headers";

export default function ExportPage() {
  const h = headers();
  const host = h.get("host") ?? "vas-projekt.vercel.app";
  const proto = host.includes("localhost") ? "http" : "https";
  const token = process.env.EXPORT_API_TOKEN;
  const csvUrl = `${proto}://${host}/api/export${token ? `?token=${token}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-medium text-gray-900 mb-2">Odkaz pro Excel (Power Query)</h2>
        {token ? (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Tento odkaz obsahuje tajný přístupový token - nikam ho nesdílejte. Použijte ho v Excelu
              v Power Query jako zdroj dat.
            </p>
            <code className="block bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs break-all select-all">
              {csvUrl}
            </code>
          </>
        ) : (
          <p className="text-sm text-red-600">
            Proměnná prostředí <code>EXPORT_API_TOKEN</code> není nastavena. Nastavte ji ve Vercelu
            (Project Settings → Environment Variables) a znovu nasaďte aplikaci.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="font-medium text-gray-900 mb-3">Postup v Excelu</h2>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
          <li>V Excelu: záložka <strong>Data</strong> → <strong>Získat data</strong> → <strong>Z jiných zdrojů</strong> → <strong>Z webu</strong>.</li>
          <li>Vložte odkaz výše a potvrďte.</li>
          <li>Power Query načte tabulku se sloupci: svěřenec, datum, rok, měsíc (YYYY-MM), den v měsíci, místo (hala/venku), jednotka, platba přes oddíl, částka.</li>
          <li>Klikněte na <strong>Zavřít a načíst do…</strong> a zvolte <strong>Pouze vytvořit připojení</strong> (přidá se do datového modelu).</li>
          <li>Vložte <strong>Kontingenční tabulku</strong> z tohoto připojení na nový list.</li>
          <li>Do řádků přetáhněte <strong>svěřenec</strong>, do sloupců <strong>den v měsíci</strong>, do hodnot <strong>součet z částka</strong>.</li>
          <li>Do filtru přetáhněte <strong>rok_měsíc</strong>. Poté v menu Kontingenční tabulka → Analýza → Možnosti → <strong>Zobrazit stránky filtru sestavy</strong> - Excel automaticky vytvoří samostatný list pro každý měsíc.</li>
          <li>Celkový součet za měsíc se zobrazí automaticky v posledním řádku/sloupci kontingenční tabulky.</li>
          <li>Při příští návštěvě stačí kliknout pravým tlačítkem na tabulku → <strong>Aktualizovat</strong>, čímž se stáhnou nová data z aplikace.</li>
        </ol>
      </div>
    </div>
  );
}
