import React, { useState, useEffect, useRef } from "react";
import { TextField, Button, Box, Text, Flex, Badge } from "@radix-ui/themes";
import { PlusIcon, Cross2Icon } from "@radix-ui/react-icons";
import { TagEntity } from "@/types";
import { searchWikidataEntities } from "@/services/wikidata";

interface TagAutocompleteProps {
  tags: TagEntity[];
  onTagAdd: (tag: TagEntity) => void;
  onTagRemove: (tag: TagEntity) => void;
  error?: string;
  placeholder?: string;
  maxTags?: number;
}

export function TagAutocomplete({
  tags,
  onTagAdd,
  onTagRemove,
  error,
  placeholder = "Search and add tags from WikiData...",
  maxTags = 10,
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search WikiData as user types
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    searchWikidataEntities(inputValue, "en", 10, 300)
      .then((results) => {
        // Filter out tags that are already added
        const filteredResults = results.filter(
          (result) =>
            !tags.some(
              (tag) =>
                tag.entityId === result.entityId ||
                tag.label.toLowerCase() === result.label.toLowerCase()
            )
        );
        setSuggestions(filteredResults);
        setIsSearching(false);
      })
      .catch((error) => {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setIsSearching(false);
      });
  }, [inputValue, tags]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion: TagEntity) => {
    if (tags.length >= maxTags) {
      return;
    }
    onTagAdd(suggestion);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleAddManualTag = () => {
    if (!inputValue.trim()) {
      return;
    }

    // Check if tag already exists
    const tagExists = tags.some(
      (tag) =>
        tag.label.toLowerCase() === inputValue.trim().toLowerCase() ||
        tag.entityId === inputValue.trim()
    );

    if (tagExists) {
      return;
    }

    if (tags.length >= maxTags) {
      return;
    }

    // Create a manual tag (without entity ID)
    const manualTag: TagEntity = {
      label: inputValue.trim(),
      entityId: "",
    };

    onTagAdd(manualTag);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleAddManualTag();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Display existing tags */}
      <Flex gap="2" wrap="wrap" className="mb-2">
        {tags.map((tag, index) => (
          <Badge
            key={`${tag.entityId || tag.label}-${index}`}
            className="flex items-center gap-1 lowercase tracking-wide"
          >
            <span>
              {tag.label}{" "}
              {tag.entityId && (
                <span className="opacity-50">({tag.entityId})</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onTagRemove(tag)}
              className="ml-1 hover:text-red-500"
              aria-label={`Remove tag ${tag.label}`}
            >
              <Cross2Icon width="12" height="12" />
            </button>
          </Badge>
        ))}
      </Flex>

      {/* Input and suggestions */}
      <div className="relative">
        <Flex gap="2">
          <TextField.Root
            ref={inputRef}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="flex-1"
            disabled={tags.length >= maxTags}
          />
          <Button
            type="button"
            onClick={handleAddManualTag}
            size="2"
            disabled={!inputValue.trim() || tags.length >= maxTags}
          >
            <PlusIcon width="16" height="16" />
          </Button>
        </Flex>

        {/* Suggestions dropdown */}
        {showSuggestions && (suggestions.length > 0 || isSearching) && (
          <Box
            ref={suggestionsRef}
            className="absolute w-full mt-1 max-h-60 overflow-y-auto bg-background z-50 border border-gray-400 rounded-xl shadow-2xl"
          >
            {isSearching ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                Searching WikiData...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                No results found. Press Enter to add as manual tag.
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.entityId || suggestion.label}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`w-full text-left px-3 py-2 ${
                    index === selectedIndex ? "text-lime-500" : ""
                  }`}
                >
                  <div className="font-medium text-sm line-clamp-1 capitalize tracking-wide">
                    {suggestion.label}
                    {suggestion.entityId && (
                      <span className="ml-1 text-xs opacity-50">
                        ({suggestion.entityId})
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </Box>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Text color="red" size="1" className="mt-1 block">
          {error}
        </Text>
      )}

      {/* Helper text */}
      {tags.length >= maxTags && (
        <Text size="1" color="gray" className="mt-1 block">
          Maximum {maxTags} tags allowed
        </Text>
      )}
    </div>
  );
}
