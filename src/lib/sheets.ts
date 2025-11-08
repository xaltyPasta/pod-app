// src/lib/sheets.ts
import { google } from "googleapis";

function normalizePrivateKey(key?: string) {
    if (!key) return undefined;
    return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

export async function getSheetsClient() {
    const email = process.env.GOOGLE_SA_EMAIL;
    const key = normalizePrivateKey(process.env.GOOGLE_SA_KEY);
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!email || !key || !spreadsheetId) {
        throw new Error(
            `Missing Google Sheets env vars. present={ email:${!!email}, key:${!!key}, sheet:${!!spreadsheetId} }`
        );
    }

    const auth = new google.auth.JWT({
        email,
        key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    try {
        await auth.authorize();
    } catch (e: any) {
        const msg = e?.errors?.[0]?.message || e?.message || String(e);
        throw new Error(`JWT authorize failed: ${msg}`);
    }

    return google.sheets({ version: "v4", auth });
}

export async function appendPodRow(values: (string | number)[]) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Pod_data!A:F", // ensure the tab name is exactly Pod_data
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [values] },
        });
    } catch (e: any) {
        const msg =
            e?.response?.data?.error?.message ||
            e?.errors?.[0]?.message ||
            e?.message ||
            String(e);
        throw new Error(`Sheets append error: ${msg}`);
    }
}

export async function ensureHeaderRow() {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    const header = ["AWB", "DateTime(IST)", "Name", "Phone", "URL", "Type"];

    try {
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Pod_data!A1:F1",
        });

        const match =
            existing.data.values &&
            existing.data.values[0] &&
            existing.data.values[0].join("|").toLowerCase() === header.join("|").toLowerCase();

        if (!match) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "Pod_data!A1:F1",
                valueInputOption: "RAW",
                requestBody: { values: [header] },
            });
        }
    } catch (e: any) {
        const msg =
            e?.response?.data?.error?.message ||
            e?.errors?.[0]?.message ||
            e?.message ||
            String(e);
        throw new Error(`Header check/update failed: ${msg}`);
    }
}
