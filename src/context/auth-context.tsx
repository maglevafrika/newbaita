"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Role, UserInDb } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  updatePassword,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

type Theme = "light" | "dark";

interface AuthContextType {
  user: User | null;
  users: UserInDb[];
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: Role) => void;
  addUser: (userData: Omit<UserInDb, 'id'>) => Promise<boolean>;
  updateUser: (userId: string, userData: Partial<Omit<UserInDb, 'id'>>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  customLogoUrl: string | null;
  setCustomLogo: (url: string | null) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  refreshUsers: () => Promise<void>;
  createAdminUser: () => Promise<void>; // Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Standard password for all users
const STANDARD_PASSWORD = 'Rs@!2325';

// User mapping for backward compatibility
const USER_EMAIL_MAPPING: Record<string, string> = {
  'admin1': 'admin1@gmail.com',
  // Add more mappings as needed
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAuth();
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserInDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [customLogoUrl, setCustomLogoUrlState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<Theme>('light');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [usersLoaded, setUsersLoaded] = useState(false); // Add this to track when users are loaded
  const router = useRouter();
  const { toast } = useToast();

  // Helper function to get email from username
  const getEmailFromUsername = (username: string): string => {
    return USER_EMAIL_MAPPING[username.toLowerCase()] || `${username.toLowerCase()}@gmail.com`;
  };

  // Helper function to get username from email
  const getUsernameFromEmail = (email: string): string => {
    // First check if it's in our mapping
    for (const [username, mappedEmail] of Object.entries(USER_EMAIL_MAPPING)) {
      if (mappedEmail === email) {
        return username;
      }
    }
    // Otherwise, extract username from email
    return email.split('@')[0];
  };

  // Add this to your AuthProvider (temporary) - for creating missing admin user
  const createAdminUser = async () => {
    try {
      await addDoc(collection(db, 'users'), {
        username: 'admin1',
        name: 'Administrator',
        roles: ['admin'],
        email: 'admin1@gmail.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
      });
      console.log('Admin user created');
      toast({
        title: "Admin User Created",
        description: "Admin user has been created successfully.",
      });
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      toast({
        title: "Error",
        description: `Failed to create admin user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Initialize Firebase Auth listener and other listeners
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Firebase Auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser?.email);
      setFirebaseUser(firebaseUser);
    });
    unsubscribes.push(unsubscribeAuth);

    // Users listener
    const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserInDb));
      console.log('Users loaded from Firestore:', usersData.length);
      setUsers(usersData);
      setUsersLoaded(true); // Mark users as loaded
      
      // Auto-create admin user if no users exist
      if (usersData.length === 0) {
        console.log('No users found, creating admin user...');
        createAdminUser();
      }
    });
    unsubscribes.push(unsubscribeUsers);

    // App settings listener (for logo and theme)
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.data();
        if (settings.customLogoUrl !== undefined) {
          setCustomLogoUrlState(settings.customLogoUrl);
          if (settings.customLogoUrl) {
            localStorage.setItem('customLogoUrl', settings.customLogoUrl);
          } else {
            localStorage.removeItem('customLogoUrl');
          }
        }
        if (settings.theme !== undefined) {
          setThemeState(settings.theme);
          localStorage.setItem('app-theme', settings.theme);
        }
      }
      setLoading(false);
    });
    unsubscribes.push(unsubscribeSettings);

    // Initialize from localStorage for immediate display
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      const storedLogo = localStorage.getItem('customLogoUrl');
      if (storedLogo) {
        setCustomLogoUrlState(storedLogo);
      }
      
      const storedTheme = localStorage.getItem('app-theme') as Theme | null;
      if (storedTheme) {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.error("Failed to parse from storage", error);
      sessionStorage.removeItem('user');
      localStorage.removeItem('customLogoUrl');
      localStorage.removeItem('app-theme');
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Sync user data when Firebase user changes - FIXED VERSION
  useEffect(() => {
    console.log('Syncing user data:', { 
      firebaseUser: firebaseUser?.email, 
      usersLoaded, 
      usersCount: users.length 
    });

    if (firebaseUser && usersLoaded) {
      const username = getUsernameFromEmail(firebaseUser.email || '');
      console.log('Looking for username:', username);
      
      const userInDb = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      console.log('Found user in DB:', userInDb ? userInDb.username : 'not found');
      
      if (userInDb) {
        const sessionUser: User = {
          id: userInDb.id,
          username: userInDb.username,
          name: userInDb.name,
          roles: userInDb.roles,
          activeRole: userInDb.roles[0], 
        };
        console.log('Setting session user:', sessionUser);
        sessionStorage.setItem('user', JSON.stringify(sessionUser));
        setUser(sessionUser);
      } else {
        console.warn('User not found in Firestore database:', username);
        // Don't automatically sign out - let the user know what's wrong
        toast({
          title: "User Profile Not Found",
          description: "Your account exists but user profile is missing. Please contact admin.",
          variant: "destructive",
        });
      }
    } else if (!firebaseUser && usersLoaded) {
      console.log('No firebase user, clearing session');
      setUser(null);
      sessionStorage.removeItem('user');
    }
  }, [firebaseUser, users, usersLoaded, toast]);

  const login = async (emailOrUsername: string, password: string = STANDARD_PASSWORD): Promise<boolean> => {
  console.log('Login attempt:', emailOrUsername);
  try {
    // Determine if input is email or username
    let email = emailOrUsername;
    if (!emailOrUsername.includes('@')) {
      // It's a username, convert to email
      email = getEmailFromUsername(emailOrUsername);
    }

    console.log('Converted to email:', email);

    // Check if user exists in our database FIRST
    const username = getUsernameFromEmail(email);
    const userInDb = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    
    console.log('User lookup:', { username, userInDb: userInDb ? userInDb.username : 'not found' });
    
    if (!userInDb) {
      toast({
        title: "User Not Found",
        description: "No user found with this username in our system.",
        variant: "destructive",
      });
      return false;
    }

    // Try Firebase authentication
    try {
      console.log('Attempting Firebase auth...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth successful:', userCredential.user.email);
      
      // Update last login time
      await updateDoc(doc(db, 'users', userInDb.id), {
        lastLogin: new Date().toISOString(),
      });
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userInDb.name}!`,
      });
      
      // The user state will be set by the useEffect above
      // Wait a bit for the auth state to propagate
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      
      return true;
      
    } catch (firebaseError: any) {
      console.error('Firebase auth error:', firebaseError);
      
      // If Firebase auth fails, check if it's because user doesn't exist in Firebase
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
        // Auto-create Firebase user with standard password
        try {
          console.log('Creating Firebase user for:', email);
          const userCredential = await createUserWithEmailAndPassword(auth, email, STANDARD_PASSWORD);
          console.log('Firebase user created successfully:', userCredential.user.email);
          
          // Update last login time
          await updateDoc(doc(db, 'users', userInDb.id), {
            lastLogin: new Date().toISOString(),
          });
          
          toast({
            title: "Account Created & Login Successful",
            description: `Welcome, ${userInDb.name}! Your Firebase account has been created.`,
          });
          
          // Wait a bit for the auth state to propagate
          setTimeout(() => {
            router.push('/dashboard');
          }, 100);
          
          return true; // ✅ FIXED: Continue with login instead of returning false
          
        } catch (createError: any) {
          console.error('Failed to create Firebase user:', createError);
          
          // If it's because the email already exists, try to sign in again
          if (createError.code === 'auth/email-already-in-use') {
            try {
              console.log('Email exists, trying to sign in again...');
              const retryCredential = await signInWithEmailAndPassword(auth, email, STANDARD_PASSWORD);
              
              // Update last login time
              await updateDoc(doc(db, 'users', userInDb.id), {
                lastLogin: new Date().toISOString(),
              });
              
              toast({
                title: "Login Successful",
                description: `Welcome back, ${userInDb.name}!`,
              });
              
              setTimeout(() => {
                router.push('/dashboard');
              }, 100);
              
              return true;
              
            } catch (retryError: any) {
              console.error('Retry login failed:', retryError);
              if (retryError.code === 'auth/wrong-password') {
                toast({
                  title: "Password Reset Required",
                  description: "Your account exists but password doesn't match. Please contact admin to reset your password.",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Login Failed",
                  description: "Account exists but login failed. Please contact admin.",
                  variant: "destructive",
                });
              }
              return false;
            }
          } else {
            toast({
              title: "Account Creation Failed",
              description: "Failed to create your account. Please contact admin.",
              variant: "destructive",
            });
            return false;
          }
        }
      } else if (firebaseError.code === 'auth/wrong-password') {
        toast({
          title: "Invalid Password",
          description: "The password you entered is incorrect.",
          variant: "destructive",
        });
        return false;
      } else {
        toast({
          title: "Login Failed",
          description: firebaseError.message || "Authentication failed. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    }
  } catch (error: any) {
    console.error('Login error:', error);
    toast({
      title: "Login Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('user');
      setUser(null);
      router.push('/');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const switchRole = (role: Role) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, activeRole: role };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast({
        title: `Switched to ${role.replace('-', ' ')}`,
        description: "Your view has been updated."
      });
    }
  };

  const addUser = useCallback(async (userData: Omit<UserInDb, 'id'>): Promise<boolean> => {
    try {
      // Check if username already exists
      if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        toast({
          title: "Username Exists",
          description: "This username is already taken.",
          variant: 'destructive'
        });
        return false;
      }

      // Create Firebase user
      const email = getEmailFromUsername(userData.username);
      try {
        await createUserWithEmailAndPassword(auth, email, STANDARD_PASSWORD);
      } catch (firebaseError: any) {
        if (firebaseError.code !== 'auth/email-already-in-use') {
          throw firebaseError;
        }
        // Email already exists in Firebase, continue with Firestore creation
      }

      const now = new Date().toISOString();
      const newUserData: any = {
        ...userData,
        email, // Store the email in Firestore for reference
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
      };
      
      await addDoc(collection(db, 'users'), newUserData);

      toast({
        title: "User Added",
        description: `${userData.name} has been created successfully with standard password.`
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to add user: ${error.message}`,
        variant: 'destructive'
      });
      return false;
    }
  }, [users, toast]);

  const updateUser = useCallback(async (userId: string, userData: Partial<Omit<UserInDb, 'id'>>): Promise<boolean> => {
    try {
      // Check for username collision if username is being changed
      if (userData.username && users.some(u => u.id !== userId && u.username.toLowerCase() === userData.username!.toLowerCase())) {
        toast({
          title: "Username Exists",
          description: "This username is already taken.",
          variant: 'destructive'
        });
        return false;
      }

      // Prepare update data with email if username changed
      let updateData: any = { ...userData };
      if (userData.username) {
        updateData.email = getEmailFromUsername(userData.username);
      }

      await updateDoc(doc(db, 'users', userId), {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      
      // If the currently logged-in user is the one being updated, update their session data too
      if (user && user.id === userId) {
        const updatedUserInDb = users.find(u => u.id === userId);
        if (updatedUserInDb) {
          const sessionUser: User = {
            id: updatedUserInDb.id,
            username: userData.username || updatedUserInDb.username,
            name: userData.name || updatedUserInDb.name,
            roles: userData.roles || updatedUserInDb.roles,
            activeRole: (userData.roles && !userData.roles.includes(user.activeRole)) 
              ? userData.roles[0] 
              : user.activeRole,
          };
          sessionStorage.setItem('user', JSON.stringify(sessionUser));
          setUser(sessionUser);
        }
      }
      
      toast({
        title: "User Updated",
        description: "User details have been saved successfully."
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }, [users, toast, user]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // Prevent deleting the currently logged-in user
      if (user && user.id === userId) {
        toast({
          title: "Cannot Delete",
          description: "You cannot delete your own account while logged in.",
          variant: 'destructive'
        });
        return false;
      }

      await deleteDoc(doc(db, 'users', userId));
      
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully."
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  const setCustomLogo = async (url: string | null) => {
  try {
    const settingsRef = doc(db, 'settings', 'app');
    
    // Check if document exists first
    const docSnapshot = await getDoc(settingsRef);
    
    if (docSnapshot.exists()) {
      // Document exists, update it
      await updateDoc(settingsRef, {
        customLogoUrl: url,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Document doesn't exist, create it with setDoc
      await setDoc(settingsRef, {
        customLogoUrl: url,
        theme: theme, // Include current theme
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    toast({
      title: "Logo Updated",
      description: url ? "Custom logo has been set." : "Logo has been reset to default."
    });
  } catch (error: any) {
    console.error('Logo update error:', error);
    toast({
      title: "Error",
      description: `Failed to update logo: ${error.message}`,
      variant: "destructive"
    });
  }
};

const setTheme = async (newTheme: Theme) => {
  try {
    const settingsRef = doc(db, 'settings', 'app');
    
    // Check if document exists first
    const docSnapshot = await getDoc(settingsRef);
    
    if (docSnapshot.exists()) {
      // Document exists, update it
      await updateDoc(settingsRef, {
        theme: newTheme,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Document doesn't exist, create it with setDoc
      await setDoc(settingsRef, {
        theme: newTheme,
        customLogoUrl: customLogoUrl, // Include current logo
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Update local state immediately for better UX
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    
    toast({
      title: "Theme Updated",
      description: `Theme switched to ${newTheme} mode.`
    });
  } catch (error: any) {
    console.error('Theme update error:', error);
    toast({
      title: "Error",
      description: `Failed to update theme: ${error.message}`,
      variant: "destructive"
    });
  }
};

  const refreshUsers = async () => {
    try {
      setLoading(true);
      setTimeout(() => setLoading(false), 1000);
    } catch (error: any) {
      console.error('Refresh error:', error);
      setLoading(false);
    }
  };

  const value = {
    user,
    users,
    loading,
    login,
    logout,
    switchRole,
    customLogoUrl,
    setCustomLogo,
    theme,
    setTheme,
    addUser,
    updateUser,
    deleteUser,
    refreshUsers,
    createAdminUser, // Add this line
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}