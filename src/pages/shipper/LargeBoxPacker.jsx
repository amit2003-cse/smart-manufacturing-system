import React, { useState, useEffect } from 'react';
import { Trash2, Printer, CheckCircle, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import bwipjs from 'bwip-js';
import { db } from '../../firebase';
import { doc, writeBatch, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRecoilState, useRecoilValue } from 'recoil';

import { masterData } from '../../data/masterData';
import { unitBoxesDBState, qcState, combinedBoxesDBState } from '../../store/atoms';
import BarcodeInput from '../../components/shared/BarcodeInput';
import AppDataGrid from '../../components/shared/AppDataGrid';
import ConfirmModal from '../../components/shared/ConfirmModal';

const LargeBoxPacker = () => {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [mode, setMode] = useState('GENERATE'); // 'GENERATE' | 'VIEW'
  
  // Rule: 10 units = 1 Large Box
  const boxCapacity = 10;

  const unitBoxesDB = useRecoilValue(unitBoxesDBState);
  const qcDB = useRecoilValue(qcState);
  const [combinedBoxesDB, setCombinedBoxesDB] = useRecoilState(combinedBoxesDBState);

  // Session Logic
  const [currentSession, setCurrentSession] = useState(() => {
    const saved = localStorage.getItem('packing_session');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeBatch, setActiveBatch] = useState(() => {
    const saved = localStorage.getItem('active_batch_lock');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('packing_session', JSON.stringify(currentSession));
    localStorage.setItem('active_batch_lock', JSON.stringify(activeBatch));
    if (activeBatch && currentSession.length !== activeBatch.capacity) {
        setShowPreview(false);
    }
  }, [currentSession, activeBatch]);

  const currentItemInfo = activeBatch ? masterData.find(i => i.itemCode === activeBatch.itemCode) : null;

  const handleScan = (barcode) => {
    if (!barcode) return false;
    
    // 1. Validate against SSoT (unitBoxesDBState)
    const boxInDB = unitBoxesDB.find(b => b.barcode === barcode);
    if (!boxInDB) {
        toast.error("Invalid Barcode: Box not found in system.");
        return false;
    }

    // 2. Validate against QC State
    const qcRecord = qcDB.find(q => q.barcode === barcode);
    if (!qcRecord) {
        toast.error("QC Request not found for this box!");
        return false;
    }

    if (qcRecord.status !== 'APPROVED') {
        toast.error(`QC Status: ${qcRecord.status}. Only APPROVED boxes allowed.`);
        return false;
    }

    if (!activeBatch) {
      setActiveBatch({
          code: boxInDB.batchCode,
          itemCode: boxInDB.itemCode,
          capacity: boxCapacity // Uses the 10 from line 19
      });
    } else if (boxInDB.batchCode !== activeBatch.code) {
      toast.error(`Batch Mismatch! Expected: ${activeBatch.code}`);
      return false;
    }

    if (currentSession.length >= boxCapacity) {
      toast.warning(`Capacity Full! Generate Large Box now.`);
      return false;
    }

    if (currentSession.find(b => b.barcode === barcode)) {
      toast.error('Already in this Large Box!');
      return false;
    }

    // 3. Verify it hasn't already been packed in another combined box
    const alreadyPacked = combinedBoxesDB.some(cb => cb.unitBoxes.some(ub => ub.barcode === barcode));
    if (alreadyPacked) {
        toast.error('This box has already been packed in another Carton!');
        return false;
    }

    setCurrentSession(prev => [...prev, boxInDB]);
    toast.success('Box Validated & Added');
    return true;
  };

  const handleViewScan = async (barcode) => {
    if (!barcode) return;
    setLoading(true);
    try {
      // Prioritize SSoT Local State
      const existing = combinedBoxesDB.find(cb => cb.barcode === barcode);
      if (existing) {
        setCurrentSession(existing.unitBoxes);
        setActiveBatch({ itemCode: existing.itemCode, code: existing.batchCode, capacity: existing.unitBoxes.length });
        setShowPreview(true);
        toast.info("Carton loaded from Local State.");
      } else {
        // Fallback: Check Firestore
        const docRef = doc(db, "combined_boxes", barcode);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const cartonData = { id: docSnap.id, ...docSnap.data() };
          setCurrentSession(cartonData.unitBoxes);
          setActiveBatch({ itemCode: cartonData.itemCode, code: cartonData.batchCode, capacity: cartonData.unitBoxes.length });
          setShowPreview(true);
          setCombinedBoxesDB(prev => [...prev, cartonData]);
          toast.info("Carton loaded from Cloud Database.");
        } else {
          toast.error("Packaging not found");
        }
      }
    } catch (e) {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndSave = async () => {
      setShowConfirm(false);
      if (currentSession.length !== boxCapacity) return;
      setLoading(true);

      try {
          // 1. DUPLICATE CHECK: Check if combined box already exists for this Item + Batch
          const existing = combinedBoxesDB.find(cb => cb.itemCode === activeBatch.itemCode && cb.batchCode === activeBatch.code);
          
          if (existing) {
              toast.info("A combined box already exists for this Item + Batch. Loading existing records.");
              setCurrentSession(existing.unitBoxes);
              setShowPreview(true);
              setLoading(false);
              return;
          }

          const cartonNo = `M224C0L${Math.floor(Math.random() * 90000) + 10000}`;
          const newCombinedBox = {
              id: cartonNo,
              itemCode: activeBatch.itemCode,
              batchCode: activeBatch.code,
              barcode: cartonNo,
              createdAt: new Date().toISOString(),
              unitBoxes: currentSession
          };

          const batch = writeBatch(db);
          const cartonRef = doc(db, "combined_boxes", cartonNo);
          batch.set(cartonRef, newCombinedBox);

          await batch.commit();

          // Save to Local SSoT
          setCombinedBoxesDB(prev => [newCombinedBox, ...prev]);

          setShowPreview(true);
          toast.success("Packaging successful! Combined Box generated.");
      } catch (error) {
          toast.error("Failed to save Packaging to System.");
      } finally {
          setLoading(false);
      }
  };

  const handleClearSession = () => {
    setCurrentSession([]);
    setActiveBatch(null);
    setShowPreview(false);
    toast.info("Session Cleared");
  };

  useEffect(() => {
    if (showPreview && currentSession.length > 0) {
      setTimeout(() => {
        try {
            const combinedBox = combinedBoxesDB.find(cb => cb.itemCode === activeBatch?.itemCode && cb.batchCode === activeBatch?.code) || { barcode: 'N/A' };

            bwipjs.toCanvas('qrPreview', { bcid: 'qrcode', text: combinedBox.barcode, scale: 2 });
            bwipjs.toCanvas('cartonPreview', { bcid: 'code128', text: combinedBox.barcode, scale: 2, height: 10, includetext: true });
            
            currentSession.forEach((box, index) => {
              const canvasId = `unit-preview-${index}`;
              if (document.getElementById(canvasId)) {
                bwipjs.toCanvas(canvasId, { bcid: 'code128', text: box.barcode.split('-').pop(), scale: 2, height: 10, includetext: true });
              }
            });
        } catch (e) { console.error(e); }
      }, 100);
    }
  }, [showPreview, currentSession, combinedBoxesDB, activeBatch]);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Packaging & Labeling</h2>
        <p className="help-text">
          Scan approved unit boxes to consolidate them into a shipping carton. The system will prevent duplicate generation for the same batch.
        </p>
      </div>

      <div className="filter-card card no-print">
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={mode === 'GENERATE'} onChange={() => { setMode('GENERATE'); handleClearSession(); }} /> 
            <strong>Generate Packaging</strong>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={mode === 'VIEW'} onChange={() => { setMode('VIEW'); handleClearSession(); }} /> 
            <strong>View Existing Packaging</strong>
          </label>
        </div>
        <div className="filter-grid" style={{ gridTemplateColumns: '1fr' }}>
          {mode === 'GENERATE' ? (
            <BarcodeInput 
              label="SCAN UNIT BOX"
              placeholder="Scan unit box serial (auto-submits)..."
              onScan={handleScan}
              disabled={loading || showPreview}
            />
          ) : (
            <BarcodeInput 
              label="SCAN CARTON BARCODE"
              placeholder="Scan carton barcode..."
              onScan={handleViewScan}
              disabled={loading}
            />
          )}
        </div>
      </div>

      <div className="packing-split-container">
        <div className="grid-section card no-print">
          <div className="section-header">
            <h4>Scanned Items ({currentSession.length} / 10)</h4>
            <div className="header-btn-group">
                {activeBatch && <span className="batch-tag">{activeBatch.code}</span>}
                <button onClick={handleClearSession} className="btn btn-secondary" style={{ padding: '4px 10px', minHeight: 'auto', fontSize: '12px' }}>
                    Clear Box
                </button>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <AppDataGrid 
              dataSource={currentSession} 
              height="100%"
              showActions={!showPreview}
              actionWidth={60}
              actionRender={(d) => (
                  mode === 'GENERATE' ? (
                    <button onClick={() => { setCurrentSession(prev => prev.filter(b => b.barcode !== d.data.barcode)); setShowPreview(false); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  ) : null
              )}
            />
          </div>

          {mode === 'GENERATE' && !showPreview && (
            <button 
                className={`btn btn-success ${loading ? 'btn-loading' : ''}`}
                onClick={() => setShowConfirm(true)} 
                disabled={currentSession.length !== boxCapacity || loading}
                style={{ width: '100%', marginTop: '16px' }}
            >
              <CheckCircle size={18} /> {loading ? '' : 'Generate & Save Carton'}
            </button>
          )}
        </div>

        <div className="preview-section card">
          <div className="section-header">
            <h4>Label Preview</h4>
            {showPreview && (
              <button className="btn btn-primary" onClick={() => window.print()} style={{ padding: '6px 12px', minHeight: 'auto' }}>
                <Printer size={16} /> Print
              </button>
            )}
          </div>
          
          <div className="preview-content-box print-area">
            {showPreview ? (
              <div className="label-production-preview">
                 <div className="label-header">
                    <div className="model-info">MODEL: {currentItemInfo?.modelName}</div>
                    <div className="carton-info">
                        <span>Carton No.: {combinedBoxesDB.find(cb => cb.itemCode === activeBatch?.itemCode && cb.batchCode === activeBatch?.code)?.barcode}</span>
                        <button 
                          onClick={() => {
                            const bc = combinedBoxesDB.find(cb => cb.itemCode === activeBatch?.itemCode && cb.batchCode === activeBatch?.code)?.barcode;
                            navigator.clipboard.writeText(bc);
                            toast.success("Barcode copied!");
                          }}
                          style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                          className="no-print"
                        >
                          Copy
                        </button>
                        <canvas id="cartonPreview"></canvas>
                    </div>
                 </div>
                 <div className="label-body">
                    <div className="barcode-column">
                        {currentSession.slice(0, 6).map((box, i) => (
                            <div key={i} className="unit-item"><canvas id={`unit-preview-${i}`}></canvas></div>
                        ))}
                    </div>
                    <div className="center-info-column">
                        <div className="pcs-count">{currentSession.length} PCS</div>
                        <div className="sn-label">SN</div>
                        <div className="qr-box"><canvas id="qrPreview"></canvas></div>
                    </div>
                    <div className="barcode-column">
                        {currentSession.slice(6, 12).map((box, i) => (
                            <div key={i} className="unit-item"><canvas id={`unit-preview-${i + 6}`}></canvas></div>
                        ))}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="empty-preview">
                 <Package size={48} />
                 <p>Scan all required boxes to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        title="Generate & Save Carton"
        message={`This will permanently group ${currentSession.length} units into a single Carton. Are you sure you want to perform this action?`}
        onConfirm={handleGenerateAndSave}
        onCancel={() => setShowConfirm(false)}
      />

      <style>{`
        .packing-split-container { display: flex; gap: 24px; flex: 1; min-height: 0; }
        .grid-section { flex: 1; display: flex; flex-direction: column; min-height: 0; margin: 0; }
        .preview-section { flex: 1.2; display: flex; flex-direction: column; min-height: 0; margin: 0; }
        
        @media (max-width: 1024px) {
          .packing-split-container { flex-direction: column; height: auto; flex: none; }
          .grid-section, .preview-section { flex: none; width: 100%; height: 500px; }
          .preview-section { height: auto; min-height: 400px; }
        }

        .section-header { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; margin-bottom: 16px; }
        .batch-tag { background: #eff6ff; color: #1e3a8a; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .preview-content-box { border: 1px solid #e2e8f0; border-radius: 12px; flex: 1; background: #ffffff; padding: 24px; display: flex; justify-content: center; overflow-y: auto; }
        .label-production-preview { background: white; width: 100%; max-width: 600px; padding: 20px; border: 1px solid #eee; font-family: sans-serif; color: black; }
        .label-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .carton-info { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: bold; }
        #cartonPreview { height: 40px !important; width: 160px !important; }
        .label-body { display: flex; justify-content: space-between; align-items: flex-start; }
        .barcode-column { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .unit-item canvas { height: 35px !important; width: 140px !important; }
        .center-info-column { flex: 0.8; display: flex; flex-direction: column; align-items: center; }
        .pcs-count { font-size: 24px; font-weight: 800; }
        .qr-box canvas { height: 100px !important; width: 100px !important; }
        .empty-preview { text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; width: 100%; }
        
        @media print {
            .no-print { display: none !important; }
            .page-container { padding: 0 !important; }
            .preview-section { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; background: white; z-index: 9999; }
            .preview-content-box { border: none; padding: 0; background: white; overflow: visible; }
        }
      `}</style>
    </div>
  );
};

export default LargeBoxPacker;
