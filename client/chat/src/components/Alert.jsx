import React from 'react';

const Alert = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null; 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
      <button className="modal-close" onClick={ onClose }>
          &times;
        </button>
        <h4>{ title }</h4>
        {children}
      </div>
    </div>
  );
};

export default Alert;