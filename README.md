# 🏭 Smart Manufacturing Management System (SMMS)
> A next-generation, fixed-viewport manufacturing execution system built for speed, precision, and zero-scroll efficiency.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Recoil](https://img.shields.io/badge/Recoil-3578E5?style=for-the-badge&logo=recoil&logoColor=white)](https://recoiljs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=A52A2A)](https://firebase.google.com/)
[![DevExtreme](https://img.shields.io/badge/DevExtreme-FF5722?style=for-the-badge&logo=devexpress&logoColor=white)](https://js.devexpress.com/)

---

## ✨ Overview
The **Smart Manufacturing Management System** is a production-grade interface designed to handle high-volume barcode scanning, quality control, and logistics. It eliminates traditional page scrolling in favor of a **Pinned-Viewport Architecture**, ensuring that critical headers, filters, and footers remain static while data grids provide internal virtual scrolling.

---

## 🚀 Key Modules

### 🛠️ Production & Scanning
*   **Mass Generation:** Generate unit boxes with automated sequence tracking.
*   **Precision Scan:** Real-time barcode validation against the master database.
*   **Duplicate Prevention:** Native checks to ensure no barcode is double-processed.

### 🧪 Quality Control (QC)
*   **Request Lifecycle:** Seamlessly transition from production to QC review.
*   **Decision Matrix:** Bulk approve or reject scanned units with audit trails.
*   **Dynamic Validation:** Enforced capacity rules (10 units per batch).

### 📦 Smart Packaging
*   **Carton Consolidation:** Auto-group 10 unit boxes into a single "Large Box" (Carton).
*   **Label Engine:** Real-time generation of shipping labels with integrated QR codes and Barcodes.
*   **Print-Ready UI:** Specialized CSS for direct thermal label printing.

### 🚚 Delivery & Dispatch
*   **Dual-Flow Validation:** Dispatch via Batch Selection or Barcode Scan Mode.
*   **Carton Hierarchy:** Automatic expansion of cartons to show linked unit boxes.
*   **Export Ready:** One-click CSV reporting for logistics partners.

---

## 🎨 UI/UX Design Philosophy
*   **Zero-Scroll Layout:** Everything is visible at once. Fixed Header/Footer.
*   **Glassmorphism & Shadows:** Premium card-based UI with soft elevations.
*   **Debounced Scanning:** Optimized input handlers for physical barcode scanners (1s debounce).
*   **Status Tags:** High-contrast semantic colors for QC and Process states.

---

## 🛠️ Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Hooks), SCSS |
| **State Management** | Recoil (with Persistence) |
| **UI Components** | DevExtreme (Enterprise Grids), Lucide Icons |
| **Backend/DB** | Firebase Firestore (Real-time Sync) |
| **Labeling** | BWIP-JS (Barcode Writer in Pure JS) |

---

## 📂 Installation
1. Clone the repository:
   ```bash
   git clone [repo-url]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm start
   ```

---

## 🛡️ Data Integrity Rules
*   **SSoT:** Recoil Atoms act as the Single Source of Truth across all tabs.
*   **Batch Locking:** Systems locks the current batch during packaging to prevent cross-batch errors.
*   **Capacity Guard:** Strict enforcement of 10-unit rules for QC and Packaging consistency.

---

<div align="center">
  <p>Built with ❤️ by <b>Amit Kumar</b> | Software Developer</p>
</div>
