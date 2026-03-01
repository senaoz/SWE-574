import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Text, Flex, Badge, IconButton } from "@radix-ui/themes";
import { MagnifyingGlassIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Service } from "@/types";
import { servicesApi } from "@/services/api";
import { ClickableTag } from "@/components/ui/ClickableTag";

interface SearchBarProps {
  className?: string;
  onSearchChange?: (query: string) => void;
}

export function SearchBar({ className = "", onSearchChange }: SearchBarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim() || !localStorage.getItem("access_token")) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await servicesApi.getServices({
        page: 1,
        limit: 10,
        // Search in title, description, category, and tags
        // Note: The backend might need to support text search parameters
      });

      // Filter results on frontend for now (backend search would be better)
      const filteredResults = response.data.services.filter(
        (service: Service) =>
          (service.title || "").toLowerCase().includes(query.toLowerCase()) ||
          (service.description || "")
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          (service.category || "")
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          service.tags?.some((tag) => {
            const tagLabel = typeof tag === "string" ? tag : tag.label;
            return tagLabel?.toLowerCase().includes(query.toLowerCase());
          }),
      );

      setSearchResults(filteredResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching services:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Call onSearchChange if provided (for Dashboard filtering)
    if (onSearchChange) {
      onSearchChange(query);
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".search-container")) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSearchResults]);

  return (
    <div className={`relative search-container w-full ${className}`}>
      <div className="relative w-full">
        <TextField.Root
          placeholder="Search services..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          className="w-full"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon className="w-4 h-4" />
          </TextField.Slot>
          {searchQuery && (
            <TextField.Slot>
              <IconButton size="1" variant="ghost" onClick={clearSearch}>
                <Cross2Icon className="w-3 h-3" />
              </IconButton>
            </TextField.Slot>
          )}
        </TextField.Root>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 border border-gray-200/10 rounded-xl shadow-2xl">
            <div
              className="p-2"
              style={{ backgroundColor: "var(--color-background)" }}
            >
              {isSearching ? (
                <div className="p-4 text-center">
                  <Text size="2">Searching...</Text>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((service) => (
                    <div
                      key={service._id}
                      className="p-3 cursor-pointer rounded-md border-b border-gray-200/10 last:border-b-0"
                      onClick={() => handleServiceClick(service._id)}
                    >
                      <Flex justify="between" align="start">
                        <div className="flex-1">
                          <Text
                            size="3"
                            weight="medium"
                            className="line-clamp-1"
                          >
                            {service.title}
                          </Text>
                          <Text
                            size="2"
                            color="gray"
                            className="line-clamp-2 mt-1"
                          >
                            {service.description}
                          </Text>
                          <div className="flex items-center gap-2 mt-2 capitalize">
                            <Badge variant="soft" color="blue">
                              {service.service_type}
                            </Badge>
                            {service.tags.slice(0, 3).map((tag, index) => (
                              <ClickableTag
                                key={
                                  typeof tag === "string"
                                    ? tag
                                    : (tag.entityId || tag.label) + index
                                }
                                tag={tag}
                                size="1"
                                variant="outline"
                                color="green"
                                stopPropagation
                              />
                            ))}
                          </div>
                        </div>
                      </Flex>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-4 text-center">
                  <Text size="2" color="gray">
                    No services found
                  </Text>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
