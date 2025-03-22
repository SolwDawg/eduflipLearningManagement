import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SmartSearchProps {
  placeholder?: string;
  maxResults?: number;
}

const SmartSearch = ({
  placeholder = "Search for courses...",
  maxResults = 5,
}: SmartSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL
        }/courses/search?query=${encodeURIComponent(searchTerm)}`
      );

      const data = await response.json();

      // Check if data contains courses array
      if (data && data.courses && Array.isArray(data.courses)) {
        setSearchResults(data.courses.slice(0, maxResults));
        setIsSearchOpen(data.courses.length > 0);
      } else {
        // Handle empty or invalid response
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setIsSearchOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim() === "") {
      setIsSearchOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleResultClick = (courseId: string) => {
    router.push(`/user/courses/${courseId}`);
    handleClearSearch();
  };

  const handleViewAllResults = () => {
    router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
    handleClearSearch();
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 w-full rounded-lg"
          onFocus={() => searchResults.length > 0 && setIsSearchOpen(true)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 w-full bg-card rounded-lg shadow-lg border border-border"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Đang tìm kiếm...
                </p>
              </div>
            ) : (
              <div>
                <div className="max-h-[350px] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <ul className="py-2">
                      {searchResults.map((course) => (
                        <li key={course.courseId}>
                          <button
                            className="w-full px-4 py-2 hover:bg-muted flex items-center text-left"
                            onClick={() => handleResultClick(course.courseId)}
                          >
                            <div className="h-10 w-10 relative mr-3 flex-shrink-0 overflow-hidden rounded">
                              <Image
                                src={course.image || "/placeholder.png"}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{course.title}</p>
                              <p className="text-xs text-muted-foreground">
                                by {course.teacherName}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Không tìm thấy khóa học
                      </p>
                    </div>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-primary"
                      onClick={handleViewAllResults}
                    >
                      Xem tất cả kết quả
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartSearch;
