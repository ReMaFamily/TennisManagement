import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const expected = process.env.EXPORT_API_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Neplatný nebo chybějící token." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("export_attendance")
    .select(
      "trainee_name, session_date, year, month, year_month, day_number, location, training_unit_name, payment_via_club, amount"
    )
    .order("session_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headerRow = [
    "svěřenec",
    "datum",
    "rok",
    "měsíc",
    "rok_měsíc",
    "den_v_měsíci",
    "místo",
    "jednotka",
    "platba_přes_oddíl",
    "částka",
  ];

  const rows = (data ?? []).map((r) =>
    [
      r.trainee_name,
      r.session_date,
      r.year,
      r.month,
      r.year_month,
      r.day_number,
      r.location === "hala" ? "hala" : "venku",
      r.training_unit_name,
      r.payment_via_club ? "ano" : "ne",
      r.amount,
    ]
      .map(csvEscape)
      .join(";")
  );

  // BOM na začátku pomáhá Excelu správně rozpoznat kódování UTF-8 (diakritika).
  const csv = "﻿" + [headerRow.join(";"), ...rows].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dochazka.csv"',
      "Cache-Control": "no-store",
    },
  });
}
