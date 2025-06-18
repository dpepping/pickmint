import React from 'react';
import '../../styles/buttons.css';  // Go up two levels to src and then to styles


function Button({ children, onClick, variant, ...props }) {
  // Assign a class based on the 'variant' prop
  const buttonClass = variant === 'outline' ? 'outline' : 'primary';

  return (
    <button className={`btn ${buttonClass}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export default Button;
