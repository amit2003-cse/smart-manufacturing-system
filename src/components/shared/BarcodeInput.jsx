import React, { useState, useEffect } from 'react';
import { TextBox } from 'devextreme-react/text-box';
import { Scan } from 'lucide-react';

const BarcodeInput = ({ label = "SCAN BARCODE", placeholder = "Scan barcode here...", onScan, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  
  useEffect(() => {
    if (!inputValue) return;

    // 300ms debounce
    const handler = setTimeout(async () => {
      try {
        const isSuccess = await onScan(inputValue);
        if (isSuccess !== false) {
          setInputValue(''); // Clear only if validation succeeds
        }
      } catch (e) {
        // keep input on error
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, onScan]);

  const handleManualSubmit = async () => {
    if (inputValue) {
      try {
        const isSuccess = await onScan(inputValue);
        if (isSuccess !== false) {
          setInputValue('');
        }
      } catch (e) {
        // keep input on error
      }
    }
  };

  return (
    <div className="filter-item barcode-input-wrapper" style={{ flex: 1 }}>
      <label>{label}</label>
      <div className="input-with-button">
        <TextBox 
          value={inputValue}
          onValueChanged={(e) => setInputValue(e.value)}
          onEnterKey={handleManualSubmit}
          placeholder={placeholder}
          valueChangeEvent="keyup"
          stylingMode="outlined"
          width="100%"
          disabled={disabled}
        />
        <button 
            className="search-btn action-trigger-btn" 
            onClick={handleManualSubmit} 
            disabled={disabled || !inputValue}
        >
          <Scan size={18} />
        </button>
      </div>

      <style>{`
        .barcode-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .barcode-input-wrapper label {
          font-weight: 600; 
          font-size: 13px; 
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-with-button {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .action-trigger-btn {
          background: #1e3a8a;
          color: white;
          border: none;
          padding: 0 15px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: var(--touch-target);
          cursor: pointer;
          transition: 0.3s;
        }
        .action-trigger-btn:hover:not(:disabled) {
          background: #1e40af;
        }
        .action-trigger-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default BarcodeInput;
