import React, { useState, useMemo, useEffect } from 'react';
import { Printer, X, Box, Search } from 'lucide-react';
import bwipjs from 'bwip-js';
import { toast } from 'react-toastify';
import { db } from '../../firebase';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { useRecoilState } from 'recoil';

import { masterData } from '../../data/masterData';
import { unitBoxesDBState } from '../../store/atoms';
import AppSelect from '../../components/shared/AppSelect';
import AppDataGrid from '../../components/shared/AppDataGrid';
import ConfirmModal from '../../components/shared/ConfirmModal';
    
const GenerateShipper = () => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [unitBoxesDB, setUnitBoxesDB] = useRecoilState(unitBoxesDBState);
  
  // Persistence Logic only for UI Selection
  const [selectedItem, setSelectedItem] = useState(() => sessionStorage.getItem('gen_item') || null);
  const [selectedBatch, setSelectedBatch] = useState(() => sessionStorage.getItem('gen_batch') || null);
  const [displayData, setDisplayData] = useState(() => {
    const saved = sessionStorage.getItem('gen_display_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    sessionStorage.setItem('gen_item', selectedItem || '');
    sessionStorage.setItem('gen_batch', selectedBatch || '');
    sessionStorage.setItem('gen_display_data', JSON.stringify(displayData));
  }, [selectedItem, selectedBatch, displayData]);

  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const availableBatches = useMemo(() => {
    const item = masterData.find(i => i.itemCode === selectedItem);
    return item ? item.batches : [];
  }, [selectedItem]);

  const isExistingBatch = useMemo(() => {
    if (!selectedItem || !selectedBatch) return false;
    return unitBoxesDB.some(b => b.itemCode === selectedItem && b.batchCode === selectedBatch);
  }, [selectedItem, selectedBatch, unitBoxesDB]);

  const handleSearchBatch = async () => {
    if (!selectedItem || !selectedBatch) return;
    setLoading(true);
    try {
      const localExisting = unitBoxesDB.filter(b => b.itemCode === selectedItem && b.batchCode === selectedBatch);
      if (localExisting.length > 0) {
        setDisplayData(localExisting);
        toast.info(`Loaded ${localExisting.length} unit boxes.`);
      } else {
        const q = query(collection(db, "unit_boxes"), where("itemCode", "==", selectedItem), where("batchCode", "==", selectedBatch));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const existing = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDisplayData(existing);
          const otherBatches = unitBoxesDB.filter(b => !(b.itemCode === selectedItem && b.batchCode === selectedBatch));
          setUnitBoxesDB([...otherBatches, ...existing]);
          toast.info(`Loaded ${existing.length} unit boxes from Cloud.`);
        } else {
          toast.error("No records found.");
        }
      }
    } catch (error) { toast.error("Error fetching data."); }
    finally { setLoading(false); }
  };

  const handleGenerateBatch = async () => {
    setShowConfirm(false);
    if (!selectedItem || !selectedBatch) return;
    setLoading(true);
    const itemInfo = masterData.find(i => i.itemCode === selectedItem);
    try {
        const q = query(collection(db, "unit_boxes"), where("itemCode", "==", selectedItem), where("batchCode", "==", selectedBatch));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          toast.warning("Batch already exists! Use Search.");
          return;
        }
        const newBoxes = [];
        const batch = writeBatch(db);
        for (let i = 1; i <= itemInfo.boxCapacity; i++) {
          const sequence = String(i).padStart(3, '0');
          const barcode = `${selectedItem}-${selectedBatch}-U${sequence}`;
          const boxData = {
            itemCode: selectedItem,
            itemName: itemInfo.itemName,
            modelName: itemInfo.modelName,
            batchCode: selectedBatch,
            boxNo: i,
            barcode: barcode,
            isScanned: false,
            isPacked: false,
            createdAt: new Date().toISOString()
          };
          const docRef = doc(collection(db, "unit_boxes"));
          batch.set(docRef, boxData);
          newBoxes.push({ id: docRef.id, ...boxData });
        }
        await batch.commit();
        setUnitBoxesDB(prev => [...prev, ...newBoxes]);
        setDisplayData(newBoxes);
        toast.success(`Generated ${itemInfo.boxCapacity} boxes!`);
    } catch (error) { toast.error("Failed to generate."); }
    finally { setLoading(false); }
  };

  // Single Barcode Generation Effect
  useEffect(() => {
    if (showModal && selectedRecord) {
      setTimeout(() => {
        try {
          bwipjs.toCanvas('barcodeCanvas', {
            bcid: 'code128',
            text: selectedRecord.barcode,
            scale: 3,
            height: 12,
            includetext: true,
            textxalign: 'center',
          });
        } catch (e) { console.error(e); }
      }, 100);
    }
  }, [showModal, selectedRecord]);

  // Bulk Barcode Generation Effect
  useEffect(() => {
    if (showBulkModal && displayData.length > 0) {
      setTimeout(() => {
        displayData.forEach((record, index) => {
          try {
            bwipjs.toCanvas(`bulk-barcode-${index}`, {
              bcid: 'code128',
              text: record.barcode,
              scale: 2,
              height: 10,
              includetext: true,
              textxalign: 'center',
            });
          } catch (e) { console.error(`Bulk Barcode Error (${index}):`, e); }
        });
      }, 300);
    }
  }, [showBulkModal, displayData]);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Generate Unit Boxes</h2>
        <p className="help-text">
          Select an Item and Batch to generate base unit boxes for production. These boxes must be generated before they can be scanned.
        </p>
      </div>

      {/* Filter Section */}
      <div className="filter-card card no-print">
        <div className="filter-grid">
          <AppSelect 
            label="Item Code"
            dataSource={masterData.map(i => i.itemCode)} 
            value={selectedItem}
            onValueChanged={(e) => {
              setSelectedItem(e.value);
              setSelectedBatch(null);
              setDisplayData([]);
            }}
            placeholder="Select..." 
          />
          
          <AppSelect 
            label="Batch Code"
            dataSource={availableBatches} 
            value={selectedBatch}
            onValueChanged={(e) => {
              setSelectedBatch(e.value);
              setDisplayData([]);
            }}
            disabled={!selectedItem}
            placeholder="Select..." 
          />

          <div className="filter-actions" style={{ alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
            <button 
              className={`btn btn-primary ${loading && isExistingBatch ? 'btn-loading' : ''}`} 
              onClick={handleSearchBatch} 
              disabled={loading || !selectedBatch || !isExistingBatch}
              style={{ minWidth: '120px', height: '42px' }}
            >
              <Search size={18} />
              <span>{loading && isExistingBatch ? '' : 'Search'}</span>
            </button>
            <button 
              className={`btn btn-success ${loading && !isExistingBatch ? 'btn-loading' : ''}`} 
              onClick={() => setShowConfirm(true)} 
              disabled={loading || !selectedBatch || isExistingBatch}
              style={{ minWidth: '120px', height: '42px' }}
            >
              <Box size={18} />
              <span>{loading && !isExistingBatch ? '' : 'Generate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      {displayData.length > 0 ? (
        <div className="grid-card card no-print">
          <div className="grid-header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <strong>Total Units: {displayData.length}</strong>
                <span style={{ color: '#64748b' }}>Model: {displayData[0].modelName}</span>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowBulkModal(true)}
              style={{ padding: '8px 16px' }}
            >
              <Printer size={16} />
              <span>Print All Labels</span>
            </button>
          </div>
          <AppDataGrid 
            dataSource={displayData}
            showActions={true}
            actionWidth={160}
            actionRender={(cellData) => (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', minHeight: 'auto', fontSize: '12px' }}
                  onClick={() => { 
                    setSelectedRecord(cellData.data); 
                    setShowModal(true); 
                  }}
                >
                  <Printer size={14} />
                  <span>Print Label</span>
                </button>
            )}
          />
        </div>
      ) : (
        !loading && (
          <div className="no-data-msg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Select Batch to view or generate unit boxes.
          </div>
        )
      )}

      {/* Single Barcode Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="barcode-card print-area single-label">
            <div className="card-header no-print">
              <h3>SHIPPING LABEL</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="card-body">
              <div className="company-info">
                <h4>FRESH LOGISTICS PVT LTD</h4>
                <p>Manufacturing Unit - 01</p>
              </div>

              <div className="product-details">
                <div className="detail-row">
                  <span>Product:</span> <strong>{selectedRecord?.itemName}</strong>
                </div>
                <div className="detail-row">
                  <span>Item Code:</span> <strong>{selectedRecord?.itemCode}</strong>
                </div>
                <div className="detail-row">
                  <span>Batch Code:</span> <strong>{selectedRecord?.batchCode}</strong>
                </div>
              </div>

              <div className="barcode-container">
                <canvas id="barcodeCanvas"></canvas>
              </div>
            </div>

            <div className="card-footer no-print">
              <button className="print-btn" onClick={() => window.print()}>
                <Printer size={18} /> Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Barcode Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="bulk-print-container print-area">
             <div className="bulk-header no-print">
                <h3>Bulk Label Printing - Batch: {selectedBatch}</h3>
                <div className="header-btn-group">
                   <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Print All</button>
                   <button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}><X size={18} /> Close</button>
                </div>
             </div>
             
             <div className="labels-grid">
                {displayData.map((record, idx) => (
                   <div key={idx} className="barcode-card bulk-label-item">
                      <div className="card-body">
                         <div className="company-info" style={{ marginBottom: '5px' }}>
                           <h5 style={{ margin: 0, fontSize: '10px' }}>FRESH LOGISTICS PVT LTD</h5>
                         </div>
                         <div className="product-details" style={{ fontSize: '9px', gap: '2px' }}>
                           <div className="detail-row"><span>Product:</span> <strong>{record.itemName}</strong></div>
                           <div className="detail-row"><span>Item/Batch:</span> <strong>{record.itemCode} / {record.batchCode}</strong></div>
                         </div>
                         <div className="barcode-container" style={{ marginTop: '5px' }}>
                           <canvas id={`bulk-barcode-${idx}`}></canvas>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showConfirm}
        title="Generate / Load Batch"
        message={`This will generate or load unit boxes for item ${selectedItem} in batch ${selectedBatch}. Are you sure?`}
        onConfirm={handleGenerateBatch}
        onCancel={() => setShowConfirm(false)}
      />

      <style>{`
        .bulk-print-container { background: white; width: 95%; max-width: 1200px; max-height: 90vh; overflow-y: auto; border-radius: 12px; padding: 20px; }
        .bulk-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; position: sticky; top: 0; background: white; z-index: 10; }
        .labels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
        .bulk-label-item { border: 1.5px solid #000 !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; }
        
        @media print {
            .no-print { display: none !important; }
            .modal-overlay { position: static; background: none; padding: 0; display: block; overflow: visible; }
            .bulk-print-container { width: 100%; max-height: none; overflow: visible; padding: 0; }
            .labels-grid { display: block; }
            .bulk-label-item { 
                page-break-inside: avoid; 
                margin-bottom: 20px !important; 
                border: 1px solid black !important;
                width: 3.5in !important; /* Standard label size */
                height: 2in !important;
                display: inline-block;
                margin-right: 10px;
            }
        }
      `}</style>
    </div>
  );
};

export default GenerateShipper;
