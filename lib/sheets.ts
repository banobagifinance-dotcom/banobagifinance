import * as fs from "fs";
import { google } from "googleapis";
import type { Asset } from "./supabase";

const SHEET_NAME = "Assets";
const HEADERS = ["asset_id", "name", "date", "price", "description", "image_url", "created_at"];

function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SPREADSHEET_ID");
  }
  let credentials: { client_email?: string; private_key?: string };
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (raw) {
    credentials = JSON.parse(raw) as { client_email?: string; private_key?: string };
  } else if (credPath) {
    const content = fs.readFileSync(credPath, "utf8");
    credentials = JSON.parse(content) as { client_email?: string; private_key?: string };
  } else {
    throw new Error("Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS");
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}

function parsePrice(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const s = String(value).trim().replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function rowToAsset(row: unknown[], _rowIndex: number): Asset {
  const asset_id = String(row[0] ?? "");
  return {
    id: asset_id,
    asset_id,
    name: String(row[1] ?? ""),
    date: String(row[2] ?? ""),
    price: parsePrice(row[3]),
    description: row[4] != null && row[4] !== "" ? String(row[4]) : null,
    image_url: row[5] != null && row[5] !== "" ? String(row[5]) : null,
    created_at: String(row[6] ?? ""),
  };
}

function assetToRow(a: Omit<Asset, "id" | "created_at"> & { created_at?: string }): unknown[] {
  const created_at = a.created_at ?? new Date().toISOString();
  return [
    a.asset_id,
    a.name,
    a.date,
    a.price,
    a.description ?? "",
    a.image_url ?? "",
    created_at,
  ];
}

/** ดึงข้อมูล assets ทั้งหมดจาก Sheet (เรียง created_at ใหม่ล่าสุดก่อน) */
export async function listAssets(): Promise<Asset[]> {
  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });
  const rows = (res.data.values ?? []) as unknown[][];
  const assets = rows.map((row, i) => rowToAsset(row, i + 2));
  assets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return assets;
}

/** หา asset จาก asset_id */
export async function getAssetByAssetId(asset_id: string): Promise<Asset | null> {
  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });
  const rows = (res.data.values ?? []) as unknown[][];
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === asset_id) {
      return rowToAsset(rows[i], i + 2);
    }
  }
  return null;
}

/** หาแถวและ index จาก asset_id */
async function findRowIndexByAssetId(asset_id: string): Promise<{ rowIndex: number; asset: Asset } | null> {
  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  });
  const rows = (res.data.values ?? []) as unknown[][];
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === asset_id) {
      return { rowIndex: i + 2, asset: rowToAsset(rows[i], i + 2) };
    }
  }
  return null;
}

/** เช็คว่า asset_id ซ้ำหรือยัง (ใช้ตอนสร้าง) */
export async function existsAssetId(asset_id: string): Promise<boolean> {
  const found = await getAssetByAssetId(asset_id);
  return found != null;
}

/** สร้าง asset ใหม่ (append แถว) */
export async function createAsset(
  data: Omit<Asset, "id" | "created_at"> & { created_at?: string }
): Promise<Asset> {
  const { sheets, spreadsheetId } = getSheetsClient();
  const row = assetToRow(data);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return rowToAsset(row, 0);
}

/** อัปเดต asset ตาม asset_id */
export async function updateAsset(
  asset_id: string,
  updates: Partial<Omit<Asset, "id" | "asset_id" | "created_at">>
): Promise<Asset | null> {
  const found = await findRowIndexByAssetId(asset_id);
  if (!found) return null;
  const { rowIndex, asset } = found;
  const updated: Asset = {
    ...asset,
    ...updates,
    id: asset.id,
    asset_id: asset.asset_id,
    created_at: asset.created_at,
  };
  const { sheets, spreadsheetId } = getSheetsClient();
  const row = assetToRow({ ...updated, created_at: updated.created_at });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowIndex}:G${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return updated;
}

/** ลบ asset ตาม asset_id (ลบทั้งแถว) */
export async function deleteAssetByAssetId(asset_id: string): Promise<boolean> {
  const found = await findRowIndexByAssetId(asset_id);
  if (!found) return false;
  const sheetId = await getSheetId();
  const { sheets, spreadsheetId } = getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: found.rowIndex - 1,
              endIndex: found.rowIndex,
            },
          },
        },
      ],
    },
  });
  return true;
}

async function getSheetId(): Promise<number> {
  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets?.find(
    (s) => (s.properties?.title ?? "").trim() === SHEET_NAME.trim()
  );
  if (sheet?.properties?.sheetId == null) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Create a sheet named "${SHEET_NAME}" and set row 1 to: ${HEADERS.join(", ")}`);
  }
  return sheet.properties.sheetId;
}

/** ใช้ตอนเริ่มต้น: ถ้า Sheet ว่าง ให้ใส่ header (row 1) */
export async function ensureHeader(): Promise<void> {
  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:G1`,
  });
  const existing = (res.data.values ?? []) as unknown[][];
  if (existing.length === 0 || !existing[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:G1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADERS] },
    });
  }
}
