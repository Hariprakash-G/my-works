import React , { createContext } from 'react';
import { AuthContextType, AuthState } from './typings-and-constant';
export const initialAuthData: AuthState = {
  isSignedIn: false,
  accessToken: null,
  idToken: null,
  userInfo: null,
  
};

export const KeycloakAuthContext = createContext<AuthContextType>({
  authData: initialAuthData,
  signIn: async () => {},
  signOut: async () => {},
  hasKeycloakPermissions: () => false,
  error: null,
  userMetaData: null
});

// This hook can be used to access the user info.

export function useKeyCloakAuthContext() {
  const value = React.useContext(KeycloakAuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <AuthProvider />');
  }

  return value;
}
