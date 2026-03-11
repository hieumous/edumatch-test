'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthUser, Scholarship, Application, Notification } from '@/types';
import { apiClient } from '@/lib/api-client';

// =============================================================================
// APP STATE TYPES
// =============================================================================

interface AppState {
  // Authentication
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Data
  scholarships: Scholarship[];
  applications: Application[];
  notifications: Notification[];
  savedScholarships: string[];
  
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

type AppAction = 
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SCHOLARSHIPS'; payload: Scholarship[] }
  | { type: 'SET_APPLICATIONS'; payload: Application[] }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'SET_SAVED_SCHOLARSHIPS'; payload: string[] }
  | { type: 'TOGGLE_SAVED_SCHOLARSHIP'; payload: string }
  | { type: 'ADD_APPLICATION'; payload: Application }
  | { type: 'UPDATE_APPLICATION_STATUS'; payload: { id: string; status: string } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' };

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  scholarships: [],
  applications: [],
  notifications: [],
  savedScholarships: [],
  sidebarOpen: false,
  theme: 'light'
};

// =============================================================================
// REDUCER
// =============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
      
    case 'SET_SCHOLARSHIPS':
      return {
        ...state,
        scholarships: action.payload
      };
      
    case 'SET_APPLICATIONS':
      return {
        ...state,
        applications: action.payload
      };
      
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload
      };
      
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
      
    case 'SET_SAVED_SCHOLARSHIPS':
      return {
        ...state,
        savedScholarships: action.payload
      };
      
    case 'TOGGLE_SAVED_SCHOLARSHIP':
      return {
        ...state,
        savedScholarships: state.savedScholarships.includes(action.payload)
          ? state.savedScholarships.filter(id => id !== action.payload)
          : [...state.savedScholarships, action.payload]
      };
      
    case 'ADD_APPLICATION':
      return {
        ...state,
        applications: [action.payload, ...state.applications]
      };
      
    case 'UPDATE_APPLICATION_STATUS':
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === action.payload.id
            ? { ...app, status: action.payload.status as any }
            : app
        )
      };
      
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload
            ? { ...notif, read: true }
            : notif
        )
      };
      
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
      
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };
      
    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadScholarships: () => Promise<void>;
  loadApplications: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  loadSavedScholarships: () => Promise<void>;
  toggleSavedScholarship: (scholarshipId: string) => Promise<void>;
  submitApplication: (applicationData: any) => Promise<boolean>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Try to get current user (check if logged in)
        const userResponse = await apiClient.auth.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: 'SET_USER', payload: userResponse.data });
          
          // Load user data
          await loadInitialData(userResponse.data.id);
        } else {
          // Not logged in, set default user for demo
          const demoUser: AuthUser = {
            id: '1',
            email: 'student@demo.com',
            name: 'John Student',
            role: 'STUDENT' as any,
            emailVerified: true,
            status: 'ACTIVE' as any,
            subscriptionType: 'FREE' as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dispatch({ type: 'SET_USER', payload: demoUser });
          await loadInitialData(demoUser.id);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  const loadInitialData = async (userId: string) => {
    try {
      const [scholarshipsRes, applicationsRes, notificationsRes, savedRes] = await Promise.all([
        apiClient.scholarships.getAll(),
        apiClient.applications.getByUser(userId),
        apiClient.notifications.getByUser(userId),
        apiClient.savedScholarships.getByUser(userId)
      ]);

      if (scholarshipsRes.success && scholarshipsRes.data) {
        dispatch({ type: 'SET_SCHOLARSHIPS', payload: scholarshipsRes.data });
      }

      if (applicationsRes.success && applicationsRes.data) {
        dispatch({ type: 'SET_APPLICATIONS', payload: applicationsRes.data });
      }

      if (notificationsRes.success && notificationsRes.data) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notificationsRes.data });
      }

      if (savedRes.success && savedRes.data) {
        dispatch({ type: 'SET_SAVED_SCHOLARSHIPS', payload: savedRes.data });
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Actions
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.auth.login({ email, password });
      if (response.success && response.data) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
        await loadInitialData(response.data.user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.auth.logout();
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_SCHOLARSHIPS', payload: [] });
      dispatch({ type: 'SET_APPLICATIONS', payload: [] });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
      dispatch({ type: 'SET_SAVED_SCHOLARSHIPS', payload: [] });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const loadScholarships = async (): Promise<void> => {
    try {
      const response = await apiClient.scholarships.getAll();
      if (response.success && response.data) {
        dispatch({ type: 'SET_SCHOLARSHIPS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load scholarships:', error);
    }
  };

  const loadApplications = async (): Promise<void> => {
    if (!state.user) return;
    
    try {
      const response = await apiClient.applications.getByUser(state.user.id);
      if (response.success && response.data) {
        dispatch({ type: 'SET_APPLICATIONS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const loadNotifications = async (): Promise<void> => {
    if (!state.user) return;
    
    try {
      const response = await apiClient.notifications.getByUser(state.user.id);
      if (response.success && response.data) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadSavedScholarships = async (): Promise<void> => {
    if (!state.user) return;
    
    try {
      const response = await apiClient.savedScholarships.getByUser(state.user.id);
      if (response.success && response.data) {
        dispatch({ type: 'SET_SAVED_SCHOLARSHIPS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load saved scholarships:', error);
    }
  };

  const toggleSavedScholarship = async (scholarshipId: string): Promise<void> => {
    if (!state.user) return;
    
    try {
      const response = await apiClient.savedScholarships.toggle(state.user.id, scholarshipId);
      if (response.success) {
        dispatch({ type: 'TOGGLE_SAVED_SCHOLARSHIP', payload: scholarshipId });
      }
    } catch (error) {
      console.error('Failed to toggle saved scholarship:', error);
    }
  };

  const submitApplication = async (applicationData: any): Promise<boolean> => {
    if (!state.user) return false;
    
    try {
      const response = await apiClient.applications.submit({
        ...applicationData,
        applicantId: state.user.id
      });
      
      if (response.success && response.data) {
        dispatch({ type: 'ADD_APPLICATION', payload: response.data });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to submit application:', error);
      return false;
    }
  };

  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
      const response = await apiClient.notifications.markAsRead(notificationId);
      if (response.success) {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const newNotification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        createdAt: new Date(),
      };
      
      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    } catch (error) {
      console.error('Failed to add notification:', error);
    }
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    loadScholarships,
    loadApplications,
    loadNotifications,
    loadSavedScholarships,
    toggleSavedScholarship,
    submitApplication,
    markNotificationAsRead,
    addNotification
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

export function useAuth() {
  const { state, login, logout } = useApp();
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    login,
    logout
  };
}

export function useScholarshipsData() {
  const { state, loadScholarships } = useApp();
  return {
    scholarships: state.scholarships,
    loading: state.loading,
    refetch: loadScholarships
  };
}

export function useApplicationsData() {
  const { state, loadApplications, submitApplication } = useApp();
  return {
    applications: state.applications,
    loading: state.loading,
    submitApplication,
    refetch: loadApplications
  };
}

export function useNotificationsData() {
  const { state, loadNotifications, markNotificationAsRead } = useApp();
  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    markAsRead: markNotificationAsRead,
    refetch: loadNotifications
  };
}

export function useSavedScholarshipsData() {
  const { state, toggleSavedScholarship, loadSavedScholarships } = useApp();
  return {
    savedScholarships: state.savedScholarships,
    toggle: toggleSavedScholarship,
    isScholarshipSaved: (scholarshipId: string) => state.savedScholarships.includes(scholarshipId),
    refetch: loadSavedScholarships
  };
}