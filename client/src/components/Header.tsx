import React from "react";

const Header = ({ title, subtitle, rightElement, className }: HeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2 sm:gap-4">
      <div className="flex flex-col gap-1 max-w-full sm:max-w-[70%]">
        <h1
          className={`text-lg sm:text-xl md:text-2xl font-bold text-primary-700 break-words ${
            className || ""
          }`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-600 break-words">
            {subtitle}
          </p>
        )}
      </div>
      {rightElement && (
        <div className="w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default Header;
