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
  const [selectedItem, setSelectedItem] = useState(() => localStorage.getItem('gen_item') || null);
  const [selectedBatch, setSelectedBatch] = useState(() => localStorage.getItem('gen_batch') || null);
  const [displayData, setDisplayData] = useState(() => {
    const saved = localStorage.getItem('gen_display_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('gen_item', selectedItem || '');
    localStorage.setItem('gen_batch', selectedBatch || '');
    localStorage.setItem('gen_display_data', JSON.stringify(displayData));
  }, [selectedItem, selectedBatch, displayData]);

  const [showModal, setShowModal] = useState(false);
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
      // Prioritize SSoT Local State
      const localExisting = unitBoxesDB.filter(b => b.itemCode === selectedItem && b.batchCode === selectedBatch);
      if (localExisting.length > 0) {
        setDisplayData(localExisting);
        toast.info(`Loaded ${localExisting.length} unit boxes from Local State.`);
      } else {
        // Fallback Check Firestore
        const q = query(
          collection(db, "unit_boxes"), 
          where("itemCode", "==", selectedItem), 
          where("batchCode", "==", selectedBatch)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const existing = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDisplayData(existing);
          // Sync SSoT
          const otherBatches = unitBoxesDB.filter(b => !(b.itemCode === selectedItem && b.batchCode === selectedBatch));
          setUnitBoxesDB([...otherBatches, ...existing]);
          toast.info(`Loaded ${existing.length} unit boxes from Cloud Database.`);
        } else {
          toast.error("No records found in database.");
        }
      }
    } catch (error) {
      toast.error("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async () => {
    setShowConfirm(false);
    if (!selectedItem || !selectedBatch) return;
    
    setLoading(true);
    const itemInfo = masterData.find(i => i.itemCode === selectedItem);
    
    try {
        // Ultimate Duplicate Check in Cloud
        const q = query(
          collection(db, "unit_boxes"), 
          where("itemCode", "==", selectedItem), 
          where("batchCode", "==", selectedBatch)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          toast.warning("This batch already exists in the cloud! Use Search instead.");
          const existing = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDisplayData(existing);
          const otherBatches = unitBoxesDB.filter(b => !(b.itemCode === selectedItem && b.batchCode === selectedBatch));
          setUnitBoxesDB([...otherBatches, ...existing]);
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
        setUnitBoxesDB(prev => [...prev, ...newBoxes]); // Sync to SSoT
        setDisplayData(newBoxes);
        toast.success(`Generated and Saved ${itemInfo.boxCapacity} boxes to System!`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  // Barcode Generation Effect
  useEffect(() => {
    if (showModal && selectedRecord) {
      try {
        bwipjs.toCanvas('barcodeCanvas', {
          bcid: 'code128',
          text: selectedRecord.barcode,
          scale: 3,
          height: 12,
          includetext: true,
          textxalign: 'center',
        });
      } catch (e) {
        console.error("Barcode Error:", e);
      }
    }
  }, [showModal, selectedRecord]);

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
          <div className="grid-header-info">
            <strong>Total Units: {displayData.length}</strong>
            <span style={{ color: '#64748b' }}>Model: {displayData[0].modelName}</span>
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

      {/* Modern Barcode Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="barcode-card print-area">
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

      <ConfirmModal 
        isOpen={showConfirm}
        title="Generate / Load Batch"
        message={`This will generate or load unit boxes for item ${selectedItem} in batch ${selectedBatch}. Are you sure?`}
        onConfirm={handleGenerateBatch}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default GenerateShipper;
