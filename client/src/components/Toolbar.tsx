import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCategoriesQuery } from "@/state/api";
import { Loader2 } from "lucide-react";

const Toolbar = ({ onSearch, onCategoryChange }: ToolbarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetCategoriesQuery();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  // Filter only active categories and transform to options format
  const categories = categoriesData?.data
    ? categoriesData.data
        .filter((category: any) => category.isActive)
        .sort((a: any, b: any) => a.order - b.order) // Sort by order
        .map((category: any) => ({
          value: category.slug,
          label: category.name,
        }))
    : [];

  return (
    <div className="toolbar">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search courses"
        className="toolbar__search"
      />
      <Select onValueChange={onCategoryChange}>
        <SelectTrigger className="toolbar__select">
          <SelectValue placeholder="Categories" />
        </SelectTrigger>
        <SelectContent className="bg-customgreys-primarybg hover:bg-customgreys-primarybg">
          <SelectItem value="all" className="toolbar__select-item">
            All Categories
          </SelectItem>

          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : (
            categories.map((category: any) => (
              <SelectItem
                key={category.value}
                value={category.value}
                className="toolbar__select-item"
              >
                {category.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Toolbar;
