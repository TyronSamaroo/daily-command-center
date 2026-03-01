/**
 * Import OCB contest prep data from HTML export into Turso DB.
 *
 * Usage:
 *   npx tsx scripts/import-prep-data.ts <html-path> [userId]
 *
 * If userId is omitted, it uses the first user in the database.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { prepEntries, users } from "../src/lib/db/schema";

const htmlPath = process.argv[2];
const userIdArg = process.argv[3];

if (!htmlPath) {
  console.error("Usage: npx tsx scripts/import-prep-data.ts <html-path> [userId]");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

interface ParsedRow {
  date: string;
  workout: string | null;
  weight: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  steps: number | null;
}

function parseNumber(str: string): number | null {
  const cleaned = str.replace(/,/g, "").replace(/[^\d.]/g, "").trim();
  if (!cleaned || cleaned === "—") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseHtml(html: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let currentYear = 2026;
  let currentMonth = 1;

  // Match month headers to track what month we're in
  const monthHeaderRegex = /<tr class="week-header"><td[^>]*>(\w+ \d{4})<\/td><\/tr>/g;
  const monthMap: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };

  // Split HTML into daily rows — each starts with a date like "Thu 1/1" or "Mon 2/26"
  // Pattern: <tr ...> or <tr> followed by <td>Day M/D</td>
  const rowRegex = /<tr[^>]*>\s*<td>(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\/(\d{1,2})<\/td>\s*<td>(?:<span class="badge badge-(\w+)">(\w+)<\/span>|([^<]*))<\/td>\s*<td[^>]*>([\d.,]*)<\/td>[\s\S]*?<\/tr>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const workoutType = match[4] || match[5] || null;
    const weightStr = match[6];

    const dateStr = `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Now extract the rest of the cells from the full match
    const fullRow = match[0];

    // Extract all <td> contents
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(fullRow)) !== null) {
      // Strip HTML tags from cell content
      cells.push(tdMatch[1].replace(/<[^>]+>/g, "").trim());
    }

    // cells layout:
    // [0] = Date (Mon 1/5)
    // [1] = Type (Push/Pull/Legs/Rest)
    // [2] = Scale weight
    // [3] = Δ weight
    // [4] = Trend weight
    // [5] = Calories
    // [6] = TDEE
    // [7] = Deficit
    // [8] = P / F / C
    // [9] = Fiber
    // [10] = Steps
    // [11] = Sets
    // [12] = Volume
    // [13] = Window
    // [14] = Late%

    const weight = parseNumber(cells[2] || "");
    const calories = parseNumber(cells[5] || "");
    const steps = parseNumber(cells[10] || "");

    // Parse P / F / C - format like "191 / 34 / 100"
    let protein: number | null = null;
    let fat: number | null = null;
    let carbs: number | null = null;

    const pfcStr = cells[8] || "";
    const pfcParts = pfcStr.split("/").map((s) => s.trim());
    if (pfcParts.length === 3) {
      protein = parseNumber(pfcParts[0]);
      fat = parseNumber(pfcParts[1]);
      carbs = parseNumber(pfcParts[2]);
    }

    rows.push({
      date: dateStr,
      workout: workoutType && workoutType !== "—" ? workoutType : null,
      weight,
      calories,
      protein,
      fat,
      carbs,
      steps: steps !== null ? Math.round(steps) : null,
    });
  }

  return rows;
}

async function main() {
  const html = readFileSync(htmlPath, "utf-8");
  const rows = parseHtml(html);

  console.log(`Parsed ${rows.length} daily entries from HTML`);

  if (rows.length === 0) {
    console.error("No rows parsed. Check the HTML format.");
    process.exit(1);
  }

  // Get user ID
  let userId = userIdArg;
  if (!userId) {
    const [owner] = await db.select().from(users).limit(1);
    if (!owner) {
      console.error("No users found in database. Please sign in first, or pass a userId.");
      process.exit(1);
    }
    userId = owner.id;
    console.log(`Using user: ${owner.name || owner.email} (${userId})`);
  }

  // Upsert rows
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    // Check if entry exists
    const existing = await db
      .select({ id: prepEntries.id })
      .from(prepEntries)
      .where(eq(prepEntries.date, row.date));

    const existingForUser = existing.length > 0
      ? await db
          .select({ id: prepEntries.id })
          .from(prepEntries)
          .where(eq(prepEntries.date, row.date))
      : [];

    try {
      await db
        .insert(prepEntries)
        .values({
          userId,
          date: row.date,
          weight: row.weight,
          calories: row.calories,
          protein: row.protein,
          fat: row.fat,
          carbs: row.carbs,
          steps: row.steps,
          workout: row.workout,
        })
        .onConflictDoUpdate({
          target: [prepEntries.userId, prepEntries.date],
          set: {
            weight: row.weight,
            calories: row.calories,
            protein: row.protein,
            fat: row.fat,
            carbs: row.carbs,
            steps: row.steps,
            workout: row.workout,
          },
        });

      if (existingForUser.length > 0) {
        updated++;
      } else {
        inserted++;
      }
    } catch (err) {
      console.error(`Error upserting row ${row.date}:`, err);
    }
  }

  console.log(`Done! Inserted: ${inserted}, Updated: ${updated}`);
  console.log(`\nSample entries:`);
  rows.slice(0, 3).forEach((r) => {
    console.log(`  ${r.date}: ${r.workout || "Rest"} | ${r.weight}lbs | ${r.calories}cal | P${r.protein}/F${r.fat}/C${r.carbs} | ${r.steps} steps`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
