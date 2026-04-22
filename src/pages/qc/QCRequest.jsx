import React, { useState, useEffect } from 'react';
import { Trash2, Save, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useRecoilState, useRecoilValue } from 'recoil';

import { masterData } from '../../data/masterData';
import { unitBoxesDBState, qcState } from '../../store/atoms';
import BarcodeInput from '../../components/shared/BarcodeInput';
import AppDataGrid from '../../components/shared/AppDataGrid';
import ConfirmModal from '../../components/shared/ConfirmModal';

const QCRequest = () => {
  const [activeBatch, setActiveBatch] = useState(() => {
    const saved = localStorage.getItem('qc_active_batch');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetCapacity] = useState(10);

  const unitBoxesDB = useRecoilValue(unitBoxesDBState);
  const [qcDB, setQcDB] = useRecoilState(qcState);

  // Session State with Persistence
  const [scannedList, setScannedList] = useState(() => {
    const saved = localStorage.getItem('qc_request_session');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('qc_request_session', JSON.stringify(scannedList));
    localStorage.setItem('qc_active_batch', JSON.stringify(activeBatch));
  }, [scannedList, activeBatch]);

  // Target capacity is fixed at 10 as per rules

  const handleScan = (barcode) => {
    if (!barcode) return false;
    
    // 1. Validate against SSoT (unitBoxesDBState)
    const boxInDB = unitBoxesDB.find(b => b.barcode === barcode);

    if (!boxInDB) {
        toast.error("Box not generated! Please generate shipper first.");
        return false;
    }

    if (!boxInDB.isScanned) {
        toast.error("Box has not been scanned yet in the Scan Shipper module!");
        return false;
    }

    if (!activeBatch) {
      setActiveBatch({
          code: boxInDB.batchCode,
          itemCode: boxInDB.itemCode
      });
    } else if (boxInDB.batchCode !== activeBatch.code) {
        toast.error(`Batch Mismatch! Expected: ${activeBatch.code}`);
        return false;
    }

    // 2. Validate against existing QC Requests
    const existingQC = qcDB.find(q => q.barcode === barcode);
    if (existingQC) {
        toast.warning(`Box already has QC Request (Status: ${existingQC.status})!`);
        return false;
    }

    if (scannedList.find(b => b.barcode === barcode)) {
        toast.warning("Already in current list!");
        return false;
    }

    setScannedList(prev => [...prev, { ...boxInDB, timestamp: new Date().toLocaleString() }]);
    toast.success("Box added to QC Request list");
    return true;
  };

  const handleSave = async () => {
    setShowConfirm(false);
    if (scannedList.length === 0) return;
    setLoading(true);

    try {
        const batch = writeBatch(db);
        const newQCRecords = [];
        
        scannedList.forEach(box => {
            const newQCRef = doc(collection(db, "qc_requests"));
            const qcRecord = {
                id: newQCRef.id, // Generate ID early for local state
                barcode: box.barcode,
                itemCode: box.itemCode,
                batchCode: box.batchCode,
                status: 'PENDING_QC',
                requestedAt: new Date().toISOString(),
                unitBoxId: box.id || null,
                boxNo: box.boxNo || null
            };
            
            batch.set(newQCRef, qcRecord);
            newQCRecords.push(qcRecord);
        });

        await batch.commit();

        // Update Local SSoT
        setQcDB(prev => [...prev, ...newQCRecords]);

        setScannedList([]);
        setActiveBatch(null);
        toast.success("QC Requests raised successfully!");
    } catch (e) {
        toast.error("Save Failed. Check network connection.");
    } finally {
        setLoading(false);
    }
  };

  const isComplete = scannedList.length === targetCapacity && targetCapacity > 0;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Initiate QC Request</h2>
        <p className="help-text">
          Select Item and Batch, then scan unit boxes to request Quality Control. Boxes must be generated and scanned prior to this step.
        </p>
      </div>

      <div className="filter-card card no-print">
        <div className="filter-grid" style={{ gridTemplateColumns: '1fr' }}>
          <BarcodeInput 
            label="SCAN BARCODE"
            placeholder="Scan unit box (auto-submits)..."
            onScan={handleScan}
          />
        </div>
      </div>

      <div className="grid-card card">
        <div className="section-header">
            <h4 style={{ margin: 0, color: '#1e293b' }}>Scanned for QC ({scannedList.length} / {targetCapacity > 0 ? targetCapacity : '?'})</h4>
             <div className="header-btn-group">
                {activeBatch && <span className="batch-tag">{activeBatch.code}</span>}
                <button 
                    className={`btn btn-success ${loading ? 'btn-loading' : ''}`} 
                    onClick={() => setShowConfirm(true)} 
                    disabled={!isComplete || loading}
                >
                    <Save size={16} /> <span>{loading ? '' : 'Raise QC Request'}</span>
                </button>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => { setScannedList([]); setActiveBatch(null); }}
                >
                    <XCircle size={14} />
                    <span>Clear</span>
                </button>
            </div>
        </div>

        <AppDataGrid 
            dataSource={scannedList} 
            showActions={true}
            actionWidth={80}
            actionRender={(cellData) => (
                <button 
                    onClick={() => setScannedList(prev => prev.filter(b => b.barcode !== cellData.data.barcode))} 
                    className="btn btn-secondary"
                    style={{ padding: '4px', minWidth: 'auto', minHeight: 'auto', color: '#ef4444', borderColor: '#fee2e2' }}
                >
                    <Trash2 size={18} />
                </button>
            )}
        />
      </div>
      <ConfirmModal 
        isOpen={showConfirm}
        title="Raise QC Request"
        message={`This will raise a QC Request for ${scannedList.length} boxes from batch ${activeBatch?.code}. Are you sure you want to perform this action?`}
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default QCRequest;
