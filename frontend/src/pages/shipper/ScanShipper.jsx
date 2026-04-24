import React, { useState, useEffect } from 'react';
import { Trash2, Save, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useRecoilState } from 'recoil';

import { unitBoxesDBState } from '../../store/atoms';
import BarcodeInput from '../../components/shared/BarcodeInput';
import AppDataGrid from '../../components/shared/AppDataGrid';
import ConfirmModal from '../../components/shared/ConfirmModal';

const ScanShipper = () => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [unitBoxesDB, setUnitBoxesDB] = useRecoilState(unitBoxesDBState);

  // Session History (Local UI only, cleared on Save)
  const [scannedData, setScannedData] = useState(() => {
    const saved = localStorage.getItem('scan_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('scan_history', JSON.stringify(scannedData));
  }, [scannedData]);

  const handleScan = (barcode) => {
    if (!barcode) return false;

    // 1. Validate against SSoT (unitBoxesDBState)
    const boxInDB = unitBoxesDB.find(b => b.barcode === barcode);

    if (!boxInDB) {
      toast.error("Box not generated! Please generate shipper first.");
      return false;
    }

    if (boxInDB.isScanned) {
      toast.warning("This box is already marked as scanned in the system!");
      return false;
    }

    if (scannedData.find(item => item.barcode === barcode)) {
      toast.warning('Already scanned in this current session!');
      return false;
    }

    const newItem = {
      ...boxInDB,
      scanTime: new Date().toLocaleTimeString()
    };
    
    setScannedData(prev => [newItem, ...prev]);
    toast.success('Box Scanned Successfully (Pending Save)');
    return true;
  };

  const removeScan = (barcode) => {
    setScannedData(prev => prev.filter(item => item.barcode !== barcode));
  };

  const handleSaveData = async () => {
    setShowConfirm(false);
    if (scannedData.length === 0) return;
    setLoading(true);

    try {
      const batch = writeBatch(db);
      
      scannedData.forEach(box => {
        if (box.id) {
            const boxRef = doc(db, "unit_boxes", box.id);
            // Using set with merge:true instead of update to be more resilient
            batch.set(boxRef, {
                isScanned: true,
                scannedAt: new Date().toISOString()
            }, { merge: true });
        }
      });

      await batch.commit();

      // Update Local SSoT
      const updatedDB = unitBoxesDB.map(dbBox => {
        if (scannedData.find(s => s.barcode === dbBox.barcode)) {
            return { ...dbBox, isScanned: true };
        }
        return dbBox;
      });
      setUnitBoxesDB(updatedDB);

      toast.success(`Successfully saved ${scannedData.length} records to Cloud!`);
      setScannedData([]); // Clear session after successful save
    } catch (error) {
      console.error("Save Error:", error);
      toast.error("Failed to save data to cloud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Scan Shipper</h2>
        <p className="help-text">
          Scan generated unit boxes to mark them as ready for Quality Control. Remember to click "Save Scanned Data" to commit changes.
        </p>
      </div>

      <div className="filter-card card no-print">
        <div className="filter-grid" style={{ gridTemplateColumns: '1fr' }}>
          <BarcodeInput 
            label="SCAN BARCODE / ENTER MANUALLY"
            placeholder="Scan item barcode here (auto-submits after 1s)..."
            onScan={handleScan}
            disabled={loading}
          />
        </div>
      </div>

      {scannedData.length > 0 ? (
        <div className="grid-card card fade-in">
          <div className="grid-header-actions">
             <h4 style={{ margin: 0, color: '#1e293b' }}>Scanned Records ({scannedData.length})</h4>
             <div className="header-btn-group">
                 <button 
                    onClick={() => setShowConfirm(true)} 
                    className={`btn btn-success ${loading ? 'btn-loading' : ''}`} 
                    disabled={loading}
                 >
                    <Save size={16} />
                    <span>{loading ? '' : 'Save Scanned Data'}</span>
                 </button>
                 <button 
                    onClick={() => setScannedData([])} 
                    className="btn btn-secondary" 
                 >
                    <XCircle size={14} />
                    <span>Clear All</span>
                 </button>
             </div>
          </div>
          
          <AppDataGrid 
            dataSource={scannedData}
            showActions={true}
            actionWidth={80}
            actionRender={(cellData) => (
                <button 
                  onClick={() => removeScan(cellData.data.barcode)}
                  className="btn btn-secondary"
                  style={{ padding: '4px', minWidth: 'auto', minHeight: 'auto', color: '#ef4444', borderColor: '#fee2e2' }}
                  title="Remove from session"
                >
                  <Trash2 size={18} />
                </button>
            )}
          />
        </div>
      ) : (
        <div className="no-data-msg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Waiting for first scan...
        </div>
      )}

      <ConfirmModal 
        isOpen={showConfirm}
        title="Save Scanned Data"
        message={`This will mark ${scannedData.length} boxes as scanned in the system. Are you sure you want to perform this action?`}
        onConfirm={handleSaveData}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default ScanShipper;
