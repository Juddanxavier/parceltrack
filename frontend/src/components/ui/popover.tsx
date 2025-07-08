import * as React from 'react';
import { cn } from '../../lib/utils';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface PopoverContextProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextProps | undefined>(undefined);

export const Popover: React.FC<PopoverProps> = ({ 
  open = false, 
  onOpenChange, 
  children 
}) => {
  const [internalOpen, setInternalOpen] = React.useState(open);
  
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  return (
    <PopoverContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

interface PopoverTriggerProps {
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ 
  asChild = false, 
  className, 
  children 
}) => {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverTrigger must be used within Popover');
  }

  const { open, onOpenChange } = context;

  if (asChild) {
    const child = children as React.ReactElement;
    return React.cloneElement(child, {
      ...child.props,
      onClick: () => onOpenChange(!open),
      className: cn(className, child.props.className)
    });
  }

  return (
    <button
      className={cn('cursor-pointer', className)}
      onClick={() => onOpenChange(!open)}
    >
      {children}
    </button>
  );
};

interface PopoverContentProps {
  align?: 'start' | 'center' | 'end';
  className?: string;
  children: React.ReactNode;
}

export const PopoverContent: React.FC<PopoverContentProps> = ({ 
  align = 'center', 
  className, 
  children 
}) => {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverContent must be used within Popover');
  }

  const { open, onOpenChange } = context;
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute top-full z-50 mt-2 w-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};
