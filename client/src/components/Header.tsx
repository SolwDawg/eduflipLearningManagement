import React from "react";

const Header = ({ title, subtitle, rightElement, className }: HeaderProps) => {
  return (
    <div className="header">
      <div>
        <h1 className={`header__title ${className || ""}`}>{title}</h1>
        <p className="header__subtitle">{subtitle}</p>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};

export default Header;
