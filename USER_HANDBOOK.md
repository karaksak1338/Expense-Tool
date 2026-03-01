# 📘 DCBI Expense Tool: User Handbook

Welcome to the DCBI Expense Tool. This guide will help you navigate the system based on your role and master the new AI-powered features.

---

## 🎭 1. Roles & Permissions

- **Staff**: Create, edit, and submit expense claims. Manage your own receipt library.
- **Manager**: Review and approve/reject claims for your assigned team and entity.
- **Accountant**: Verify claims, perform month-end accruals, and sync data to D365FO.
- **Admin**: Full system control. Manage users, entities, exchange rates, and AI settings.

---

## 📁 2. The Receipts Library (Your Digital Shoe-box)

The Receipts Library is where you store receipts before they are attached to a claim.

- **Upload**: Drag-and-drop or click "+ Upload" to add receipts.
- **🤖 AI Extraction**: Once uploaded, the system automatically extracts the Date, Vendor, Currency, and Amount. 
- **Verifying AI**: Click "Edit" on a receipt to confirm or correct the AI-extracted data. The "Manual Override" flag will be logged for audit purposes.
- **Duplicate Detection**: The system flags potential duplicates based on file content and metadata (Vendor + Date + Amount).

---

## 📄 3. Creating a New Expense Claim

1.  **Start Your Claim**: Click "My Expenses" -> "Create New Claim".
2.  **Select Entity & Currency**: Choose the Legal Entity and the currency you wish to be reimbursed in.
3.  **Attach Receipts**: Drag receipts from your library into the claim. The form will auto-fill based on the receipt data.
4.  **Multi-Currency**: If you spent money in a different currency (e.g., USD for a EUR claim), the system will automatically apply the official monthly exchange rate defined by the Admin.
5.  **Submit**: Once all lines are complete, click "Submit for Approval".

---

## 💳 4. Company Card Imports

For expenses paid via corporate card, the process is slightly different:

1.  **Bank Statements**: Go to the "Bank Statements" tab.
2.  **Upload Statement**: Upload your CSV or PDF card statement.
3.  **Matched Lines**: The system will create a Draft Claim where all statement lines are **authoritative and locked**. You cannot change the date or amount.
4.  **🪄 Auto-Allocate**: Click the magic wand button to automatically link receipts from your library to the statement lines based on Date and Amount proximity.
5.  **Audit Trail**: The original statement is persistently attached to the claim header for auditor review.

---

## ✅ 5. Approval Workflow (Managers)

- **Pending Queue**: Claims awaiting your review appear in the "Approvals Queue".
- **Reviewing**: You can see individual line items, converted amounts, and preview the attached receipts/statements.
- **Decision**: You can Approve or Reject. If rejecting, please provide a clear reason in the comments for the employee.

---

## 🏦 6. Finance & Compliance (Accountants)

- **Compliance Hub**: Review all submitted and approved claims.
- **Month-End Accrual**: Mark claims as "Accrued" to lock them for the current financial period.
- **D365FO Sync**: Click "Sync & Close" to push verified records to the enterprise resource planning (ERP) system.

---

## ⚙️ 7. Admin Tasks

- **Exchange Rates**: Maintain the "Exchange Rates" registry monthly to ensure accurate conversions.
- **User Health**: Deactivate users who have left the company to prevent unauthorized access.
- **AI Tuning**: Use the "AI Prompts" tab in the Control Center to refine how the extraction engine understands specific receipt formats.

---

Need more help? Contact your local Finance representative or IT Support.
