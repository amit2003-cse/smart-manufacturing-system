import React, { useState, useEffect } from 'react';
import { Trash2, Printer, CheckCircle, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import bwipjs from 'bwip-js';
import { db } from '../../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useRecoilState, useRecoilValue } from 'recoil';

import { masterData } from '../../data/masterData';
import { unitBoxesDBState, qcState, combinedBoxesDBState } from '../../store/atoms';
import BarcodeInput from '../../components/shared/BarcodeInput';
import AppSelect from '../../components/shared/AppSelect';
import AppDataGrid from '../../components/shared/AppDataGrid';
import ConfirmModal from '../../components/shared/ConfirmModal';

const LargeBoxPacker = () => {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [mode, setMode] = useState('GENERATE'); // 'GENERATE' | 'VIEW'
  const [viewSelectedItem, setViewSelectedItem] = useState(null);
  const [viewSelectedBatch, setViewSelectedBatch] = useState(null);
  
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
    if (activeBatch && currentSession.length !== activeBatch.capacity && mode === 'GENERATE') {
        setShowPreview(false);
    }
  }, [currentSession, activeBatch, mode]);

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

  const handleFetchExisting = async (itemCode, batchCode) => {
    if (!itemCode || !batchCode) return;
    setLoading(true);
    try {
      const existing = combinedBoxesDB.find(cb => cb.itemCode === itemCode && cb.batchCode === batchCode);
      if (existing) {
        setCurrentSession(existing.unitBoxes);
        setActiveBatch({ itemCode: existing.itemCode, code: existing.batchCode, capacity: existing.unitBoxes.length });
        setShowPreview(true);
      } else {
        toast.error("Packaging not found for this batch");
      }
    } finally {
      setLoading(false);
    }
  };

  const availableViewItems = React.useMemo(() => {
    const uniqueItems = [...new Set(combinedBoxesDB.map(cb => cb.itemCode))];
    return uniqueItems;
  }, [combinedBoxesDB]);

  const availableViewBatches = React.useMemo(() => {
    if (!viewSelectedItem) return [];
    return combinedBoxesDB
      .filter(cb => cb.itemCode === viewSelectedItem)
      .map(cb => cb.batchCode);
  }, [viewSelectedItem, combinedBoxesDB]);

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

  const handleClearSession = (silent = false) => {
    setCurrentSession([]);
    setActiveBatch(null);
    setShowPreview(false);
    if (!silent) toast.info("Session Cleared");
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
                bwipjs.toCanvas(canvasId, { bcid: 'code128', text: box.barcode, scale: 3, height: 10, includetext: true });
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
        <div className="segmented-control-container">
          <div className="segmented-control">
            <button 
              className={`segmented-item ${mode === 'GENERATE' ? 'active' : ''}`}
              onClick={() => { setMode('GENERATE'); handleClearSession(true); }}
            >
              Barcode Scan Mode
            </button>
            <button 
              className={`segmented-item ${mode === 'VIEW' ? 'active' : ''}`}
              onClick={() => { setMode('VIEW'); handleClearSession(true); }}
            >
              Batch Selection Mode
            </button>
          </div>
        </div>
        <div className="filter-grid" style={{ gridTemplateColumns: mode === 'GENERATE' ? '1fr' : '1fr 1fr' }}>
          {mode === 'GENERATE' ? (
            <BarcodeInput 
              label="SCAN UNIT BOX"
              placeholder="Scan unit box serial (auto-submits)..."
              onScan={handleScan}
              disabled={loading || showPreview}
            />
          ) : (
            <>
              <AppSelect 
                label="Select Item"
                dataSource={availableViewItems}
                value={viewSelectedItem}
                onValueChanged={(e) => {
                  setViewSelectedItem(e.value);
                  setViewSelectedBatch(null);
                  handleClearSession(true);
                }}
                placeholder="Select Item..."
              />
              <AppSelect 
                label="Select Batch"
                dataSource={availableViewBatches}
                value={viewSelectedBatch}
                onValueChanged={(e) => {
                  setViewSelectedBatch(e.value);
                  handleFetchExisting(viewSelectedItem, e.value);
                }}
                disabled={!viewSelectedItem}
                placeholder="Select Batch..."
              />
            </>
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
                        <div className="carton-text-group">
                          <span>Carton No.:</span>
                          <canvas id="cartonPreview"></canvas>
                        </div>
                        <button 
                          onClick={() => {
                            const bc = combinedBoxesDB.find(cb => cb.itemCode === activeBatch?.itemCode && cb.batchCode === activeBatch?.code)?.barcode;
                            navigator.clipboard.writeText(bc);
                            toast.success("Barcode copied!");
                          }}
                          style={{ padding: '2px 8px', fontSize: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                          className="no-print"
                        >
                          Copy
                        </button>
                    </div>
                 </div>
                 <div className="label-body">
                    <div className="barcode-column">
                        {currentSession.slice(0, 6).map((box, i) => (
                            <div key={i} className="unit-item"><canvas id={`unit-preview-${i}`}></canvas></div>
                        ))}
                    </div>
                    <div className="center-info-column">
                        <div className="pcs-count">{currentSession.length}PCS</div>
                        <div className="sn-label">SN</div>
                        <div className="v-line"></div>
                        <div className="qr-box"><canvas id="qrPreview"></canvas></div>
                        <div className="v-line"></div>
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
        .label-production-preview { background: white; width: 100%; max-width:1000px; padding: 25px; border: px solid #ddd; font-family: 'Inter', sans-serif; color: black; }
        .label-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; border-bottom: 1.5px solid #000; padding-bottom: 8px; }
        .model-info { font-size: 16px; font-weight: 700; text-transform: uppercase; }
        .carton-info { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .carton-text-group { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; }
        #cartonPreview { height: 40px !important; width: 160px !important; }
        .label-body { display: flex; justify-content: space-between; align-items: stretch; gap: 10px; }
        .barcode-column { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .unit-item { padding: 1px; }
        .unit-item canvas { height: 34px !important; width: 135px !important; }
        .center-info-column { flex: 0.5; display: flex; flex-direction: column; align-items: center; padding-top: 10px; }
        .pcs-count { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
        .sn-label { font-size: 12px; font-weight: 800; margin-bottom: 5px; }
        .v-line { width: 2px; height: 30px; background: #000; margin: 5px 0; }
        .qr-box canvas { height: 85px !important; width: 85px !important; }
        .empty-preview { text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; width: 100%; }

        /* Segmented Control Styles */
        .segmented-control-container { display: flex; justify-content: center; margin-bottom: 24px; }
        .segmented-control { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; gap: 4px; width: 100%; max-width: 500px; }
        .segmented-item { flex: 1; border: none; background: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .segmented-item:hover { color: #1e293b; }
        .segmented-item.active { background: white; color: #1e3a8a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        
        @media (max-width: 640px) {
          .segmented-control { flex-direction: column; }
        }
        
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
