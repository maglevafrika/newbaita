"use client";

import { useEffect, useState } from "react";
import { initializeAppData } from "@/lib/data";

export function useAutoMigration() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await initializeAppData();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  return { isInitialized, isLoading };
}

export function useAutoMigrationStatus() {
  const { isInitialized, isLoading } = useAutoMigration();

  if (isLoading) {
    return { status: 'loading' };
  }

  if (isInitialized) {
    return { status: 'success' };
  }

  return { status: 'error' };
}