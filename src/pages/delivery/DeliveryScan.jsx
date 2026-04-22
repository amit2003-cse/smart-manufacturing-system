import React, { useState, useMemo } from 'react';
import { Package, Download, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRecoilValue } from 'recoil';

import { combinedBoxesDBState } from '../../store/atoms';
import AppSelect from '../../components/shared/AppSelect';
import BarcodeInput from '../../components/shared/BarcodeInput';
import AppDataGrid from '../../components/shared/AppDataGrid';

const DeliveryScan = () => {
  const combinedBoxesDB = useRecoilValue(combinedBoxesDBState);

  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'select'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [displayData, setDisplayData] = useState([]);
  const [gridContext, setGridContext] = useState(''); // 'carton_info' or 'unit_list'

  // Options derived from packaged data
  const availableItems = useMemo(() => {
    const items = new Set(combinedBoxesDB.map(c => c.itemCode));
    return Array.from(items).map(code => ({ itemCode: code, itemName: code }));
  }, [combinedBoxesDB]);

  const availableBatches = useMemo(() => {
    if (!selectedItem) return [];
    const batches = new Set(combinedBoxesDB.filter(c => c.itemCode === selectedItem).map(c => c.batchCode));
    return Array.from(batches);
  }, [selectedItem, combinedBoxesDB]);

  // Option A: Select Based - Show ONLY unit boxes linked to combined boxes
  const handleSearchBySelect = () => {
    if (!selectedItem || !selectedBatch) return;
    
    const matchedCartons = combinedBoxesDB.filter(c => c.itemCode === selectedItem && c.batchCode === selectedBatch);
    
    if (matchedCartons.length === 0) {
        toast.info("No packaged data found for this selection.");
        setDisplayData([]);
        return;
    }

    // Extract all unit boxes from matched cartons
    const allUnitBoxes = matchedCartons.flatMap(carton => 
        carton.unitBoxes.map(unit => ({
            ...unit,
            cartonBarcode: carton.barcode // Link back to carton for clarity
        }))
    );

    setGridContext('unit_list');
    setDisplayData(allUnitBoxes);
  };

  // Option B: Barcode Based - Show ONLY the matched combined box info
  const handleScanBarcode = (barcode) => {
    if (!barcode) return false;
    const cleanBarcode = barcode.trim();

    const carton = combinedBoxesDB.find(c => c.barcode === cleanBarcode);

    if (!carton) {
        toast.error("Invalid barcode. This module only accepts Combined (Large Box) barcodes from Packaging.");
        setDisplayData([]);
        return false;
    }

    // Extract all unit boxes from the matched carton
    const unitBoxes = carton.unitBoxes.map(unit => ({
        ...unit,
        cartonBarcode: carton.barcode // Link back to carton for clarity
    }));

    setGridContext('unit_list');
    setDisplayData(unitBoxes);
    toast.success(`Carton Found: ${carton.barcode} (${unitBoxes.length} Units)`);
    return true;
  };

  const handleExportCSV = () => {
    if (displayData.length === 0) return;
    
    const headers = gridContext === 'carton_info' 
        ? ['S.No', 'Item Code', 'Batch Code', 'Carton Barcode', 'Units Count', 'Date']
        : ['S.No', 'Item Code', 'Batch Code', 'Unit Barcode', 'Parent Carton'];
        
    let csvContent = headers.join(",") + "\n";
    
    displayData.forEach((row, index) => {
        const rowData = gridContext === 'carton_info'
            ? [index + 1, row.itemCode, row.batchCode, row.barcode, row.boxNo, `"${row.timestamp}"`]
            : [index + 1, row.itemCode, row.batchCode, row.barcode, row.cartonBarcode];
        csvContent += rowData.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Delivery_${gridContext}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Delivery & Dispatch</h2>
        <p className="help-text">
          Validate and report on packaged goods. This module only shows data that has passed through the Packaging stage.
        </p>
      </div>

      <div className="tabs-container no-print">
        <button 
            className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => { setActiveTab('scan'); setDisplayData([]); }}
        >
            Barcode Scan Mode
        </button>
        <button 
            className={`tab-btn ${activeTab === 'select' ? 'active' : ''}`}
            onClick={() => { setActiveTab('select'); setDisplayData([]); }}
        >
            Batch Selection Mode
        </button>
      </div>

      <div className="filter-card card no-print">
        {activeTab === 'scan' ? (
          <div className="filter-grid" style={{ gridTemplateColumns: '1fr' }}>
            <BarcodeInput 
                label="SCAN CARTON BARCODE"
                placeholder="Scan combined box label..."
                onScan={handleScanBarcode}
            />
          </div>
        ) : (
          <div className="filter-grid">
            <AppSelect 
                label="Item Code"
                dataSource={availableItems} 
                displayExpr="itemCode" 
                valueExpr="itemCode"
                value={selectedItem} 
                onValueChanged={e => { setSelectedItem(e.value); setSelectedBatch(null); }}
                placeholder="Select..."
            />
            <AppSelect 
                label="Batch Code"
                dataSource={availableBatches}
                value={selectedBatch} 
                onValueChanged={e => setSelectedBatch(e.value)}
                disabled={!selectedItem}
                placeholder="Select..."
            />
            <div className="filter-actions" style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSearchBySelect} disabled={!selectedBatch} style={{ height: '42px', minWidth: '140px' }}>
                    <Search size={18} /> Filter Data
                </button>
            </div>
          </div>
        )}
      </div>

      {displayData.length > 0 ? (
        <div className="grid-card card">
          <div className="section-header">
            <h4 style={{ margin: 0, color: '#1e293b' }}>
                {gridContext === 'carton_info' ? `Matched Carton Info` : `Linked Unit Boxes (${displayData.length})`}
            </h4>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
                <Download size={16} /> Export CSV
            </button>
          </div>
          
          <AppDataGrid 
            dataSource={displayData} 
            showActions={false}
          />
        </div>
      ) : (
        <div className="no-data-msg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '50%' }}>
                <Package size={48} />
            </div>
            <span>No data to display. Please scan or select filters.</span>
        </div>
      )}
    </div>
  );
};

export default DeliveryScan;
