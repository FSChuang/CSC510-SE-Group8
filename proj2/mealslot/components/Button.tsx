import React from 'react';

type ButtonProps = { // Only temporary, used for sanity test. will be removed later
  label: string;
  onClick: () => void;
};

const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};

export default Button;