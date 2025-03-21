"use client";

import React, { useMemo } from "react";
import StoreProvider from "@/state/redux";
import { CookiesProvider } from "react-cookie";
import { useParams } from "next/navigation";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  // Memoize the locale to prevent re-renders
  const locale = useMemo(() => {
    return (params?.locale as string) || "en";
  }, [params?.locale]);

  // Prevent unnecessary re-renders by using key
  return (
    <CookiesProvider>
      <StoreProvider>{children}</StoreProvider>
    </CookiesProvider>
  );
};

export default Providers;
