"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Edit } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { UserInDb, Role } from "@/lib/types";
import { UserDialog } from "@/components/user-dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next"; // ✅ Added

export default function UsersPage() {
  const { t } = useTranslation(); // ✅ Added
  const { users } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInDb | null>(null);

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: UserInDb) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  const getRoleVariant = (role: Role) => {
    switch (role) {
      case 'admin': return 'default';
      case 'teacher': return 'secondary';
      case 'upper-management': return 'destructive';
      case 'high-level-dashboard': return 'outline';
      default: return 'secondary';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Users className="w-8 h-8" />
          {t("nav.users")} {/* ✅ Translated */}
        </h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t("actions.addNewUser")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("usersPage.allUsersTitle")}</CardTitle>
          <CardDescription>
            {t("usersPage.allUsersDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("usersPage.name")}</TableHead>
                  <TableHead>{t("usersPage.username")}</TableHead>
                  <TableHead>{t("usersPage.rolesLabel")}</TableHead>
                  <TableHead className="text-right">{t("usersPage.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant={getRoleVariant(role)} className="capitalize">
                            {role.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        <Edit className="mr-2 h-3 w-3" />
                        {t("common.edit")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogClose}
        user={selectedUser}
      />
    </div>
  );
}
