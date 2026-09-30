"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SelectOptionItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectGroupItem {
  label?: string;
  items: SelectOptionItem[];
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  placeholder?: string;
}

/**
 * Custom Popover Select Component.
 * - Modern Glassmorphism UI with smooth animations
 * - Full keyboard navigation (ArrowUp, ArrowDown, Enter, Space, Escape)
 * - Click-outside dismissal
 * - Seamless integration with standard <select> props, forms, and onChange handlers
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onChange,
      disabled = false,
      placeholder = "Select...",
      name,
      id,
      required,
      ...props
    },
    forwardedRef
  ) => {
    const internalSelectRef = useRef<HTMLSelectElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => internalSelectRef.current!);

    const generatedId = useId();
    const selectId = id || generatedId;

    // Parse children to extract options and optgroups
    const { groups, flatItems } = useMemo(() => {
      const parsedGroups: SelectGroupItem[] = [];
      const parsedFlat: SelectOptionItem[] = [];

      React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;

        if (child.type === "optgroup") {
          const groupProps = child.props as React.OptgroupHTMLAttributes<HTMLOptGroupElement> & {
            children?: React.ReactNode;
          };
          const groupItems: SelectOptionItem[] = [];
          React.Children.forEach(groupProps.children, (optChild) => {
            if (!React.isValidElement(optChild)) return;
            const optProps = optChild.props as React.OptionHTMLAttributes<HTMLOptionElement> & {
              children?: React.ReactNode;
            };
            const val = String(optProps.value ?? optProps.children ?? "");
            const item: SelectOptionItem = {
              value: val,
              label: optProps.children ?? val,
              disabled: Boolean(optProps.disabled),
            };
            groupItems.push(item);
            parsedFlat.push(item);
          });
          parsedGroups.push({ label: groupProps.label, items: groupItems });
        } else if (child.type === "option") {
          const optProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement> & {
            children?: React.ReactNode;
          };
          const val = String(optProps.value ?? optProps.children ?? "");
          const item: SelectOptionItem = {
            value: val,
            label: optProps.children ?? val,
            disabled: Boolean(optProps.disabled),
          };
          if (parsedGroups.length > 0 && !parsedGroups[parsedGroups.length - 1].label) {
            parsedGroups[parsedGroups.length - 1].items.push(item);
          } else {
            parsedGroups.push({ items: [item] });
          }
          parsedFlat.push(item);
        }
      });

      return { groups: parsedGroups, flatItems: parsedFlat };
    }, [children]);

    // Track controlled or uncontrolled state
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(() => {
      if (defaultValue !== undefined) return String(defaultValue);
      return flatItems[0]?.value ?? "";
    });

    const selectedValue = isControlled ? String(value) : uncontrolledValue;

    // Find active label for display
    const selectedItem = flatItems.find((item) => item.value === selectedValue);
    const displayLabel = selectedItem ? selectedItem.label : placeholder;

    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;

      const handlePointerDown = (e: PointerEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);
      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    }, [isOpen]);

    // Reset focused index when opening
    useEffect(() => {
      if (isOpen) {
        const idx = flatItems.findIndex((item) => item.value === selectedValue);
        setFocusedIndex(idx >= 0 ? idx : 0);
      }
    }, [isOpen, selectedValue, flatItems]);

    // Handle option selection
    const handleSelectOption = useCallback(
      (newVal: string) => {
        if (!isControlled) {
          setUncontrolledValue(newVal);
        }

        if (internalSelectRef.current) {
          internalSelectRef.current.value = newVal;
        }

        if (onChange) {
          const syntheticEvent = {
            target: { value: newVal, name: name || "" },
            currentTarget: { value: newVal, name: name || "" },
          } as unknown as React.ChangeEvent<HTMLSelectElement>;
          onChange(syntheticEvent);
        }

        setIsOpen(false);
        triggerRef.current?.focus();
      },
      [isControlled, onChange, name]
    );

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
        case "Tab":
          setIsOpen(false);
          break;

        case "ArrowDown": {
          e.preventDefault();
          let nextIdx = focusedIndex + 1;
          while (nextIdx < flatItems.length && flatItems[nextIdx]?.disabled) {
            nextIdx++;
          }
          if (nextIdx < flatItems.length) {
            setFocusedIndex(nextIdx);
          }
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          let prevIdx = focusedIndex - 1;
          while (prevIdx >= 0 && flatItems[prevIdx]?.disabled) {
            prevIdx--;
          }
          if (prevIdx >= 0) {
            setFocusedIndex(prevIdx);
          }
          break;
        }

        case "Enter":
        case " ": {
          e.preventDefault();
          if (focusedIndex >= 0 && flatItems[focusedIndex] && !flatItems[focusedIndex].disabled) {
            handleSelectOption(flatItems[focusedIndex].value);
          }
          break;
        }
      }
    };

    return (
      <div
        ref={containerRef}
        className={cn("relative inline-block w-full text-left", className)}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden native select for standard HTML form submission & ref access */}
        <select
          ref={internalSelectRef}
          name={name}
          id={selectId}
          value={selectedValue}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
          onChange={() => {}}
          {...props}
        >
          {children}
        </select>

        {/* Custom Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          id={`${selectId}-trigger`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={props["aria-label"]}
          suppressHydrationWarning
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full min-h-[44px] items-center justify-between gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground shadow-sm transition-all duration-200",
            "hover:border-primary/50 hover:bg-surface-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary",
            isOpen && "border-primary ring-2 ring-primary/20",
            disabled && "cursor-not-allowed opacity-50 bg-surface-muted hover:border-border"
          )}
        >
          <span className="truncate text-left font-medium text-foreground">
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
              isOpen && "rotate-180 text-primary"
            )}
            aria-hidden="true"
          />
        </button>

        {/* Custom Floating Popover Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={listRef}
              role="listbox"
              aria-labelledby={`${selectId}-trigger`}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute left-0 top-full z-50 mt-1.5 w-full min-w-[180px] max-h-64 overflow-y-auto rounded-xl",
                "border border-border/80 bg-surface/95 p-1.5 backdrop-blur-xl shadow-2xl",
                "dark:border-border/60 dark:bg-surface/95 dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]",
                "focus:outline-none"
              )}
            >
              {groups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-0.5">
                  {group.label && (
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted select-none border-b border-border/30 mb-1">
                      {group.label}
                    </div>
                  )}

                  {group.items.map((item) => {
                    const isSelected = item.value === selectedValue;
                    const itemGlobalIdx = flatItems.findIndex((fi) => fi.value === item.value);
                    const isKeyboardFocused = focusedIndex === itemGlobalIdx;

                    return (
                      <div
                        key={item.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={item.disabled}
                        onClick={() => !item.disabled && handleSelectOption(item.value)}
                        onMouseEnter={() => !item.disabled && setFocusedIndex(itemGlobalIdx)}
                        className={cn(
                          "relative flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 cursor-pointer select-none",
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : isKeyboardFocused
                            ? "bg-surface-muted text-foreground"
                            : "text-foreground hover:bg-surface-muted/80",
                          item.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-primary animate-in fade-in zoom-in-75 duration-150" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Select.displayName = "Select";
