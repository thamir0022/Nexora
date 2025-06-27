"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { createPortal } from "react-dom";

const MultiSelect = ({
  data = [],
  loading = false,
  selectedValues = [],
  onSelectionChange,
  placeholder = "Select items...",
  type = "item",
  className = "w-full",
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef(null);

  const getDisplayName = (item) => {
    switch (type) {
      case "course":
        return item.title || item.name;
      case "category":
        return item.name;
      case "instructor":
        return (
          item.name ||
          item.fullName ||
          `${item.firstName} ${item.lastName}`.trim()
        );
      default:
        return item.name || item.title || item.label;
    }
  };

  const getItemValue = (item) => {
    return item._id || item.id || item.value;
  };

  const safeData = Array.isArray(data) ? data : [];
  const selectedItems = safeData.filter((item) =>
    selectedValues.includes(getItemValue(item))
  );

  // Calculate dropdown position
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();

      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, true);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [open]);

  // Filter data based on search
  const filteredData = safeData.filter((item) => {
    if (!searchValue) return true;
    return getDisplayName(item)
      .toLowerCase()
      .includes(searchValue.toLowerCase());
  });

  const handleSelect = (itemValue) => {
    const isSelected = selectedValues.includes(itemValue);
    const newValues = isSelected
      ? selectedValues.filter((value) => value !== itemValue)
      : [...selectedValues, itemValue];

    onSelectionChange?.(newValues);
  };

  const handleRemove = (valueToRemove, event) => {
    event?.preventDefault();
    event?.stopPropagation();
    const newValues = selectedValues.filter((value) => value !== valueToRemove);
    onSelectionChange?.(newValues);
  };

  const handleClearAll = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    onSelectionChange?.([]);
  };

  const handleTriggerClick = () => {
    setOpen(!open);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open &&
        !event.target?.closest(".multi-select-dropdown") &&
        !event.target?.closest("[data-multi-select-trigger]")
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="space-y-2">
      <Button
        ref={triggerRef}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("justify-between", className)}
        onClick={handleTriggerClick}
        data-multi-select-trigger
      >
        <div className="flex items-center gap-1 flex-1 text-left overflow-hidden">
          {selectedValues.length > 0 ? (
            <span className="text-sm font-medium">
              {selectedValues.length} {type}
              {selectedValues.length !== 1 ? "s" : ""} selected
            </span>
          ) : (
            <span className="text-muted-foreground font-normal">
              {placeholder}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedValues.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-muted"
              onClick={handleClearAll}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>

      {/* Portal dropdown */}
      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="multi-select-dropdown fixed bg-white border rounded-md shadow-lg"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999,
              pointerEvents: "auto",
            }}
          >
            <div className="p-3 border-b">
              <Input
                placeholder={`Search ${type}s...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>

            <ScrollArea className="h-64">
              <div className="p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading {type}s...
                    </span>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {searchValue
                      ? `No ${type}s found matching "${searchValue}"`
                      : `No ${type}s found.`}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredData.map((item) => {
                      const itemValue = getItemValue(item);
                      const isSelected = selectedValues.includes(itemValue);
                      const displayName = getDisplayName(item);

                      return (
                        <div
                          key={itemValue}
                          className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelect(itemValue);
                          }}
                        >
                          <Checkbox checked={isSelected} readOnly />
                          <span className="flex-1 text-sm">{displayName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {selectedValues.length > 0 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                {selectedValues.length} of {safeData.length} selected
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => {
            const itemValue = getItemValue(item);
            return (
              <Badge
                key={itemValue}
                variant="secondary"
                className="text-xs pl-2 pr-1 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <span className="max-w-[150px] truncate">
                  {getDisplayName(item)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-primary/30 rounded-full"
                  onClick={(e) => handleRemove(itemValue, e)}
                  aria-label={`Remove ${getDisplayName(item)}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
