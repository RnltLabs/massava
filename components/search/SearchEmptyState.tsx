/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchEmptyStateProps {
  onClearFilters: () => void;
  hasFilters: boolean;
}

export function SearchEmptyState({
  onClearFilters,
  hasFilters,
}: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Keine Studios gefunden
      </h3>

      <p className="text-sm text-gray-500 max-w-sm">
        {hasFilters
          ? "Versuche, deine Filter anzupassen oder den Suchradius zu erweitern."
          : "In diesem Bereich sind aktuell keine Studios verfügbar."}
      </p>

      {hasFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
}
