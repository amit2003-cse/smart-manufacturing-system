# 🏭 Smart Manufacturing Management System (SMMS)
> A next-generation, **mobile-first** manufacturing execution system built for speed, precision, and enterprise-grade scalability.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Recoil](https://img.shields.io/badge/Recoil-3578E5?style=for-the-badge&logo=recoil&logoColor=white)](https://recoiljs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=A52A2A)](https://firebase.google.com/)
[![DevExtreme](https://img.shields.io/badge/DevExtreme-FF5722?style=for-the-badge&logo=devexpress&logoColor=white)](https://js.devexpress.com/)

---

## ✨ Overview
The **Smart Manufacturing Management System** is a production-grade interface designed to handle high-volume barcode scanning, quality control, and logistics. This version has been fully transformed into a **Responsive, Mobile-First Application**, ensuring seamless operation across Mobiles, Tablets, and Desktops.

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
*   **Print-Ready UI:** Specialized CSS for direct thermal label printing on any device.

### 🚚 Delivery & Dispatch
*   **Dual-Flow Validation:** Dispatch via Batch Selection or Barcode Scan Mode.
*   **Carton Hierarchy:** Automatic expansion of cartons to show linked unit boxes.
*   **Export Ready:** One-click CSV reporting for logistics partners.

---

## 🎨 UI/UX Responsive Master Plan (New 🔥)
*   **Mobile-First Architecture:** Fluid layouts that adapt from small handheld scanners to large desktop monitors.
*   **Adaptive Sidebar:** Interactive drawer for mobile and persistent navigation for desktop.
*   **Touch-Friendly Targets:** All buttons and inputs follow the 44px minimum touch target standard.
*   **Optimized DataGrids:** Enterprise-grade grids with horizontal scrolling and column management for small screens.
*   **Real-time Dashboard:** Live system statistics (Units, Scans, QC, Cartons) connected via Recoil.

---

## 🛠️ Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Hooks), SCSS (Modern Design System) |
| **State Management** | Recoil (with LocalStorage Persistence) |
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
