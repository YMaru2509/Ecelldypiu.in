// Syncs one fully-approved attendance request to the Master Attendance Google
// Sheet. Idempotent on Request ID: searches column A for an existing row with
// this request's ID and updates it in place instead of appending a duplicate,
// so retries (or re-syncing after an edit) never create a second row.
//
// Needs three env vars to actually run (not needed for the rest of the app):
//   GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID
// Until those are set, syncRequestToSheet() throws a clear "not configured"
// error that callers record as a Sync Failed state — approvals still work
// fully without Sheets configured, sync just stays pending until it is.
import { google } from 'googleapis';

const SHEET_NAME = process.env.GOOGLE_SHEETS_TAB_NAME || 'Master Attendance';
const HEADER_ROW = [
    'Request ID', 'Member Name', 'Email', 'Department', 'E-Cell Vertical',
    'Lecture Date', 'Start Time', 'End Time', 'Faculty', 'Subject', 'Classroom',
    'Work Description', 'Vertical Head', 'VH Approved At', 'Board Member', 'Board Approved At', 'Synced At',
];

function isConfigured() {
    return !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY && process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
}

let sheetsClient = null;
function getSheetsClient() {
    if (sheetsClient) return sheetsClient;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
    return sheetsClient;
}

async function ensureHeaderRow(sheets, spreadsheetId) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAME}!A1:Q1` });
    const existing = res.data.values?.[0];
    if (!existing || existing.length === 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [HEADER_ROW] },
        });
    }
}

async function findRowByRequestId(sheets, spreadsheetId, requestId) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAME}!A2:A` });
    const rows = res.data.values || [];
    const idx = rows.findIndex((row) => row[0] === requestId);
    return idx === -1 ? null : idx + 2; // +2: 1-indexed, plus header row
}

function buildRow(request, history) {
    const vhEntry = history.find((h) => h.stage === 'vertical_head' && h.action === 'approve');
    const boardEntry = history.find((h) => h.stage === 'board_member' && h.action === 'approve');

    const toDate = (ts) => (ts?.toDate ? ts.toDate().toISOString() : '');

    return [
        request.requestId,
        request.memberSnapshot?.name || '',
        request.memberSnapshot?.email || '',
        request.memberSnapshot?.branch || '',
        request.verticalNameSnapshot || '',
        request.lectureDate,
        request.lectureStartTime,
        request.lectureEndTime,
        request.facultyName,
        request.subject,
        request.classroom,
        request.workDescription,
        vhEntry?.actorNameSnapshot || '',
        toDate(vhEntry?.decidedAt),
        boardEntry?.actorNameSnapshot || '',
        toDate(boardEntry?.decidedAt),
        new Date().toISOString(),
    ];
}

// request: the attendance_requests doc data. history: its approval_history entries.
// Returns { rowNumber } on success. Throws on failure (caller records Sync Failed).
export async function syncRequestToSheet(request, history) {
    if (!isConfigured()) {
        throw new Error('Google Sheets sync is not configured (missing GOOGLE_SHEETS_* env vars)');
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    await ensureHeaderRow(sheets, spreadsheetId);
    const row = buildRow(request, history);
    const existingRow = await findRowByRequestId(sheets, spreadsheetId, request.requestId);

    if (existingRow) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!A${existingRow}:Q${existingRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [row] },
        });
        return { rowNumber: existingRow };
    }

    const appendRes = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:Q`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });
    const updatedRange = appendRes.data.updates?.updatedRange || '';
    const match = updatedRange.match(/!A(\d+)/);
    return { rowNumber: match ? Number(match[1]) : null };
}

// Writes a grid of values onto a worksheet tab of the configured spreadsheet:
// creates the tab on first use and replaces its contents on every later
// export, so re-exporting an event never stacks duplicate rows. RAW input
// stores everything as literal text, so a name like "=HYPERLINK(...)" can
// never run as a formula. `sheets` is injectable for tests.
export async function writeTab(sheets, spreadsheetId, tabName, values) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
    let sheet = meta.data.sheets?.find((s) => s.properties.title === tabName);
    if (!sheet) {
        const created = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
        });
        sheet = { properties: created.data.replies[0].addSheet.properties };
    }

    const range = `'${tabName.replace(/'/g, "''")}'`;
    await sheets.spreadsheets.values.clear({ spreadsheetId, range });
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${range}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
    });

    return {
        tabName,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheet.properties.sheetId}`,
    };
}

export async function writeValuesToTab(tabName, values) {
    if (!isConfigured()) {
        throw new Error('Google Sheets is not connected yet (missing GOOGLE_SHEETS_* env vars)');
    }
    return writeTab(getSheetsClient(), process.env.GOOGLE_SHEETS_SPREADSHEET_ID, tabName, values);
}

export { isConfigured as isSheetsSyncConfigured };
