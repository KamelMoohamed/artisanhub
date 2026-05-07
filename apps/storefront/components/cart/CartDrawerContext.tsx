"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface CartDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <CartDrawerContext value={{ isOpen, open, close, toggle }}>
      {children}
    </CartDrawerContext>
  );
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error("useCartDrawer must be used inside CartDrawerProvider");
  return ctx;
}
