# Mile 12 Warrior — Money Tracker (Google Sheets)

These CSV files are templates. Import them into **one** Google Spreadsheet so income, expenses, accounts, and vendors stay together.

## Create the Google Sheet (about 10 minutes)

1. Go to [https://sheets.google.com](https://sheets.google.com) → **Blank** spreadsheet.
2. Name it: `Mile12Warrior-Money-Tracker`.
3. You need **5 tabs**. Rename the first tab to `Accounts`.
4. Add more sheets (bottom-left **+**): `Income`, `Expenses`, `Vendors`, `Transfers`.
5. For each tab:
   - Open that tab
   - **File → Import → Upload**
   - Choose the matching CSV from this folder
   - Import location: **Replace current sheet**
6. Move the finished spreadsheet into your Drive vault:  
   `Mile12Warrior-Business/05-Money-Out-Receipts/` (or a sibling folder `04-05-Money/`).

### Files in this folder

| CSV | Sheet tab |
|-----|-----------|
| `01-Accounts.csv` | Accounts |
| `02-Income.csv` | Income |
| `03-Expenses.csv` | Expenses |
| `04-Vendors.csv` | Vendors |
| `05-Transfers.csv` | Transfers |

There is **no live Google link** until you create the sheet in your own Google account (that keeps your money private).

---

## Receipt workflow (printer scan → track)

### Folder habit (do this once)

Inside your vault create:

```
05-Money-Out-Receipts/
  2026/
    01/
    02/
    ...
    08/
```

Use year/month so you can find things later.

### Naming scanned receipts

After you scan, rename the file before you forget what it was:

`YYYY-MM-DD_Vendor_Amount.pdf`  
Examples:
- `2026-08-08_Railway_20.00.pdf`
- `2026-08-01_OfficeDepot_47.32.pdf`

Photos from your phone are fine too (`.jpg` / `.png`).

### “Break down” a receipt (what that means)

A receipt can have several lines. You do **not** need to enter every gum pack separately. Use judgment:

| Situation | What to enter in Expenses |
|-----------|---------------------------|
| One business purpose (e.g. whole receipt is office supplies) | **One row** for the total |
| Mixed personal + business | One row for the **business portion only** (note “partial” in Notes) |
| Truly different categories on one receipt (rare) | Split into **2+ rows** that add up to the business total |
| Subscription invoice (Railway, domain, RSM) | One row; paste invoice PDF in that month’s folder |

Columns that matter on **Expenses**:
- Date  
- Vendor  
- Category  
- Amount  
- Paid from (which bank/card)  
- Receipt file name (or Drive link)  
- Notes  

### Weekly rhythm (15–20 minutes)

1. Scan new paper receipts into that month’s folder (or air-drop phone photos there).
2. Rename files with the pattern above.
3. Open the **Expenses** tab → add one row per receipt (or split if needed).
4. Put the **exact file name** in the `Receipt_File` column so you can search the folder later.

### Finding a receipt later

1. Search the Expenses sheet for the vendor or amount.  
2. Open `Receipt_File` name in that month’s folder.  
   Or search Drive for `2026-08` + vendor name.

### Tip if your printer scan is awkward

Phone photo into the same month folder is 100% acceptable for most small-business recordkeeping. Ask your CPA at year-end if they prefer PDF over photos for large items.
