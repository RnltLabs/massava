/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Danger Zone Component
 * Warning section for destructive actions like studio deletion
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { StudioDeletionDialog } from './StudioDeletionDialog';

interface DangerZoneProps {
  studioId: string;
  studioName: string;
  locale: string;
}

export function DangerZone({ studioId, studioName, locale }: DangerZoneProps): React.JSX.Element {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      {/* Separator */}
      <div className="border-t border-destructive/20 pt-8 mt-8">
        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          GEFAHRENBEREICH
        </h2>

        {/* Danger Zone Card */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Studio löschen
            </CardTitle>
            <CardDescription className="text-base">
              Sobald Sie Ihr Studio löschen, werden alle Daten dauerhaft entfernt.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto min-h-[48px]"
              aria-label="Studio löschen"
            >
              Studio löschen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Deletion Dialog */}
      <StudioDeletionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studioId={studioId}
        studioName={studioName}
        locale={locale}
      />
    </>
  );
}
