import React from 'react';

const ToggleCard = ({ 
  id, 
  title, 
  description, 
  icon: Icon, 
  checked, 
  onChange 
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (onChange) {
      onChange({
        target: {
          name: id,
          type: 'checkbox',
          checked: !checked
        }
      });
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        flex items-start gap-4 p-4 cursor-pointer transition-all duration-200
        border rounded-xl bg-surface-high hover:bg-surface-highest select-none
        ${checked ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-border'}
      `}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className={`w-4 h-4 ${checked ? 'text-primary' : 'text-text-secondary'}`} />}
          <h4 className="font-display text-sm font-semibold text-text-primary">{title}</h4>
        </div>
        <p className="font-sans text-xs text-text-muted leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="pt-1 flex-shrink-0">
        <div className={`
          relative w-10 h-6 rounded-full transition-colors duration-300
          ${checked ? 'bg-primary' : 'bg-surface-highest border border-border'}
        `}>
          <div className={`
            absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm
            ${checked ? 'translate-x-4' : 'translate-x-0'}
          `} />
        </div>
      </div>
    </div>
  );
};

export default ToggleCard;
