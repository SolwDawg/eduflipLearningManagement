import React, { useState } from "react";

const Toolbar = ({ onSearch }: ToolbarProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="toolbar">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search courses"
        className="toolbar__search"
      />
    </div>
  );
};

export default Toolbar;
