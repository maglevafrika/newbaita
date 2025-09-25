
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';
import { UserInDb, Role } from '@/lib/types';

const roles: Role[] = ["admin", "teacher", "upper-management", "high-level-dashboard"];

const userFormSchema = z.object({
  name: z.string().min(2, "Name is required."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().optional(),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
});


type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserInDb | null;
}

export function UserDialog({ isOpen, onOpenChange, user }: UserDialogProps) {
  const { addUser, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
        name: "",
        username: "",
        password: "",
        roles: [],
    }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        username: user.username,
        roles: user.roles,
        password: "", // Don't pre-fill password
      });
    } else {
      form.reset({
        name: '',
        username: '',
        password: '',
        roles: [],
      });
    }
  }, [user, isOpen, form]);

  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    let success = false;
    
    // For new users, a password is required.
    if (!user && (!data.password || data.password.length < 5)) {
        form.setError("password", { type: "manual", message: "Password must be at least 5 characters for new users." });
        setIsLoading(false);
        return;
    }

    if (user) { // Editing existing user
        const updateData: Partial<Omit<UserInDb, 'id'>> = {
            name: data.name,
            username: data.username,
            roles: data.roles as Role[],
        };
        if(data.password && data.password.length > 0) {
            if (data.password.length < 5) {
                form.setError("password", { type: "manual", message: "Password must be at least 5 characters." });
                setIsLoading(false);
                return;
            }
            updateData.password = data.password;
        }
        success = await updateUser(user.id, updateData);
    } else { // Adding new user
        const addData: Omit<UserInDb, 'id'> = {
            name: data.name,
            username: data.username,
            password: data.password!,
            roles: data.roles as Role[],
        };
        success = await addUser(addData);
    }
    
    setIsLoading(false);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update the details for this user.' : 'Enter the details for the new user.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl><Input placeholder="e.g., jdoe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" placeholder={user ? "Leave blank to keep current password" : "Enter password"} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField
                control={form.control}
                name="roles"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">User Roles</FormLabel>
                        <FormDescription>
                        Select one or more roles for this user.
                        </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    {roles.map((role) => (
                        <FormField
                        key={role}
                        control={form.control}
                        name="roles"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={role}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(role)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), role])
                                        : field.onChange(
                                            field.value?.filter(
                                            (value) => value !== role
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">
                                    {role.replace('-', ' ')}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
