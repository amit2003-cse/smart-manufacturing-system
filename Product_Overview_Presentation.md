# Product Overview & Workflow
---

## 1. Executive Summary
The **Smart Manufacturing System** is a mission-critical digital solution designed to streamline wire production, quality control, and logistics. It ensures 100% traceability from the initial reel generation to the final customer dispatch, powered by an integrated AI System Assistant for real-time SOP compliance.

---

## 2. Dashboard: Centralized Manufacturing Hub
The Home Page serves as the "Nerve Center" for production managers. It provides high-level visibility and immediate access to core operations.

- **Purpose:** Real-time monitoring and quick-action navigation.
- **Key Features:**
  - **Live Stats:** Total Reels Produced, Scanned, QC Status, and Master Spools.
  - **Operational Shortcuts:** One-click access to labeling and scanning.
  - **AI Integration:** Direct access to the system assistant for on-the-job guidance.

---

## 3. Production Phase: Reel Management
The journey begins with the creation of individual wire reels, each uniquely identified for full traceability.

### 3.1 Generate Reel
- **Objective:** Create identity for physical wire reels.
- **Workflow:**
  1. Select **Item Category** and **Batch Number**.
  2. System generates a unique **Serial Barcode**.
  3. Real-time **Label Preview** and high-resolution printing.
  
### 3.2 Scan Reel
- **Objective:** Track progress and verify physical inventory.
- **Workflow:**
  1. Operator scans the reel barcode.
  2. System validates existence and current status.
  3. Logs the scan event in the database for **Audit Trails**.

---

## 4. Quality Assurance: QC Workflow
A dual-step validation process ensures only premium products reach the customer.

### 4.1 Wire QC Requirement Raise
- **Action:** Marking a reel for inspection.
- **Logic:** Once a reel is produced, a QC ticket is "Raised" to notify the inspection team. This prevents further processing until cleared.

### 4.2 QC Decision
- **Action:** Final determination of product quality.
- **Workflow:**
  ```mermaid
  graph LR
    A[Scan Reel] --> B{Inspection}
    B -- Pass --> C[APPROVED]
    B -- Fail --> D[REJECTED]
    C --> E[Proceed to Packaging]
    D --> F[Segregate/Rework]
  ```
- **Constraint:** Only "APPROVED" reels can move to the Master Spool Packer.

---

## 5. Logistics Phase: Packaging & Dispatch
Consolidating individual units into bulk shipments while maintaining accuracy.

### 5.1 Master Spool Packer (Consolidation)
- **Objective:** Group 10 approved reels into a single Master Spool/Carton.
- **Workflow:**
  1. **Batch Lock:** Scan the first reel to lock the Batch and Item.
  2. **Validation:** System checks:
     - Is it QC Approved?
     - Does it match the current Batch?
     - Is it already packed elsewhere?
  3. **Completion:** Once 10 units are scanned, system generates a **Master Spool Label** containing all unit serials.

### 5.2 Dispatch Scanning
- **Objective:** Final verification before vehicle loading.
- **Workflow:**
  1. Scan Master Spool at the loading dock.
  2. System verifies "Ready for Shipment" status.
  3. Updates inventory to **"Dispatched"**.

---

## 6. Technical Edge: AI System Assistant
The system includes a cutting-edge **RAG (Retrieval-Augmented Generation)** Assistant.

- **Capability:** Answers questions specifically from uploaded SOPs, manuals, and manufacturing rules.
- **Benefit:** Reduces human error by providing instant, accurate answers to questions like *"What is the tolerance for 2.5mm wire?"* or *"How to handle a rejected spool?"*

---

## 7. Operational Benefits
| Feature | Impact |
| :--- | :--- |
| **Traceability** | Know exactly which batch a reel belongs to in seconds. |
| **Error Prevention** | Batch mismatch alerts and QC-only packaging logic. |
| **AI Support** | 24/7 access to technical manuals and safety SOPs. |
| **Digitization** | Elimination of paper logs and manual entry errors. |

---
*End of Document*
