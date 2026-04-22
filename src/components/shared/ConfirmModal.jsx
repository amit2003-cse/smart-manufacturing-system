import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title = "Confirm Action", message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in">
      <div className="confirm-modal card">
        <div className="modal-header">
          <AlertTriangle size={24} color="#f59e0b" />
          <h3>{title}</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p className="main-message">Are you sure you want to perform this action?</p>
          {message && <p className="sub-message">{message}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-success" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
      <style>{`
        .confirm-modal {
          width: 90%;
          max-width: 400px;
          padding: 24px;
          border-radius: 12px;
          background: white;
          animation: slideUp 0.3s ease-out;
        }

        @media (max-width: 640px) {
          .confirm-modal {
            width: 100%;
            max-width: none;
            position: absolute;
            bottom: 0;
            border-radius: 20px 20px 0 0;
            padding: 32px 24px 24px;
          }
        }
        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .modal-header h3 {
          margin: 0;
          flex: 1;
          color: #1e293b;
          font-size: 18px;
        }
        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }
        .close-btn:hover { color: #1e293b; }
        .modal-body { margin-bottom: 24px; }
        .main-message { font-weight: 600; color: #334155; margin: 0 0 8px 0; }
        .sub-message { color: #64748b; font-size: 14px; margin: 0; }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        @media (max-width: 640px) {
          .modal-footer {
            flex-direction: column-reverse;
          }
          .modal-footer .btn {
            width: 100%;
          }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
