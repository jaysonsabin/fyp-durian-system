import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ 
  name, 
  value, 
  onChange, 
  options, 
  icon: IconComponent, 
  buttonClassName, 
  menuClassName,
  chevronSize = 18,
  iconSize = 18,
  showArrow = true,
  containerClassName = "w-full"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setIsOpen(false);
  };

  const defaultButtonClass = "w-full p-4 pr-11 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 text-sm font-semibold text-gray-700 transition-all flex items-center justify-between text-left shadow-sm hover:bg-gray-100/50";
  const defaultMenuClass = "absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[150] py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 thin-scrollbar";

  return (
    <div className={`relative ${containerClassName}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || defaultButtonClass}
      >
        <span className="flex items-center gap-2">
          {IconComponent && <IconComponent size={iconSize} className="text-gray-400 mr-0.5 flex-shrink-0" />}
          {selectedOption?.emoji && <span className="text-base mr-0.5 flex-shrink-0">{selectedOption.emoji}</span>}
          <span>{selectedOption?.label || value}</span>
        </span>
        {showArrow && (
          <ChevronDown size={chevronSize} className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className={menuClassName || defaultMenuClass}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-4 py-3 text-left text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                  isSelected
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.emoji && <span className="text-base flex-shrink-0">{opt.emoji}</span>}
                <span className="flex-1">{opt.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

