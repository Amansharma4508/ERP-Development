import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  indeterminate?: boolean;
  ariaLabel?: string;
}

export default function CustomCheckbox({ checked, onChange, indeterminate, ariaLabel }: CustomCheckboxProps) {
  return (
    <label className="relative flex items-center justify-center cursor-pointer">
      <input
        type="checkbox"
        aria-label={ariaLabel || "Select item"}
        checked={checked}
        onChange={onChange}
        ref={input => {
          if (input) input.indeterminate = !!indeterminate;
        }}
        className="peer sr-only"
      />
      <div className="w-4 h-4 rounded border border-indigo-300 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition shadow-sm">
        <Check size={12} className="text-white peer-checked:opacity-100 transition-opacity" />
      </div>
    </label>
  );
}