// src/components/ui/Input.js
import React from 'react';

function Input({ placeholder, onChange }) {
  return <input className="border p-2 w-full" placeholder={placeholder} onChange={onChange} />;
}

export default Input;
