import React from 'react';
import { SelectBox } from 'devextreme-react/select-box';

const AppSelect = ({ label, dataSource, displayExpr, valueExpr, value, onValueChanged, disabled, placeholder }) => {
  return (
    <div className="filter-item app-select-wrapper">
      {label && <label>{label}</label>}
      <SelectBox 
        dataSource={dataSource} 
        displayExpr={displayExpr} 
        valueExpr={valueExpr}
        value={value}
        onValueChanged={onValueChanged}
        disabled={disabled}
        placeholder={placeholder}
        searchEnabled={true}
        stylingMode="outlined"
      />
      <style>{`
        .app-select-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .app-select-wrapper label {
          font-weight: 600; 
          font-size: 13px; 
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .app-select-wrapper .dx-selectbox {
          border-radius: 8px;
        }
        .app-select-wrapper .dx-texteditor-input { 
          padding: 10px 12px; 
        }
      `}</style>
    </div>
  );
};

export default AppSelect;
