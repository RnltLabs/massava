/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 */

import { auth } from '@/auth-unified';

import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Edit2Icon, Trash2Icon, MailIcon } from 'lucide-react';

interface StaffSettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function StaffSettingsPage({
  params,
}: StaffSettingsPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/business/settings/staff`);
  }

  // Placeholder data - will be replaced with actual staff management in Phase 3
  const staffMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  }> = [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and permissions</p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            Staff management features will be available in Phase 3 with the unified user model and
            RBAC system.
          </p>
        </CardContent>
      </Card>

      {/* Staff List */}
      {staffMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-neutral-900 mb-2">No staff members yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add team members to help manage your studio
            </p>
            <Button disabled>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {staffMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-neutral-900">{member.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MailIcon className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{member.role}</Badge>
                  <Button variant="ghost" size="icon">
                    <Edit2Icon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
