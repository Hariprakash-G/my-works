import { UserMetaDataType } from '@/types/common.typings';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export const AUTH_KEYCLOAK_URL = 'https://keycloak.atai.ai';
export const AUTH_KEYCLOAK_REALM = 'cwc';
export const AUTH_KEYCLOAK_CLIENT_ID = 'atgate_survey';
export const AUTH_KEYCLOAK_ISSUER_ENDPOINT = AUTH_KEYCLOAK_URL + '/realms/'+AUTH_KEYCLOAK_REALM;

export const AUTH_KEYCLOAK_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint:
    AUTH_KEYCLOAK_URL +
    '/realms/' +
    AUTH_KEYCLOAK_REALM +
    '/protocol/openid-connect/auth',
  tokenEndpoint:
    AUTH_KEYCLOAK_URL +
    '/realms/' +
    AUTH_KEYCLOAK_REALM +
    '/protocol/openid-connect/token',
  userInfoEndpoint:
    AUTH_KEYCLOAK_URL +
    '/realms/' +
    AUTH_KEYCLOAK_REALM +
    '/protocol/openid-connect/userinfo',
  endSessionEndpoint:
    AUTH_KEYCLOAK_URL +
    '/realms/' +
    AUTH_KEYCLOAK_REALM +
    '/protocol/openid-connect/logout',
  registrationEndpoint:
    AUTH_KEYCLOAK_URL +
    '/realms/' +
    AUTH_KEYCLOAK_REALM +
    '/clients-registrations/openid-connect',
};

export const AUTH_KEYCLOAK_REDIRECT_URI =
  Platform.OS === 'web'
    ? AuthSession.makeRedirectUri()
    : AuthSession.makeRedirectUri({
        scheme: 'myapp',
        path: 'redirect',
        isTripleSlashed: false,
      });

export interface UserInfo {
  username: string;
  givenName?: string;
  familyName?: string;
  email: string;
  roles: string[];
}

export interface AuthState {
  isSignedIn: boolean;
  accessToken: string | null;
  idToken: string | null;
  userInfo: UserInfo | null;
}

export interface AuthContextType {
  authData: AuthState;
  signIn: (options?: any) => Promise<any>;
  signOut: () => Promise<void>;
  hasKeycloakPermissions: (role: string) => boolean;
  error: any;
  userMetaData?: UserMetaDataType | null;
}

export type AuthAction =
  | { type: 'SIGN_IN'; payload: { access_token: string; id_token: string} }
  | {
      type: 'USER_INFO';
      payload: Omit<UserInfo, 'username'> & { preferred_username: string };
    }
  | { type: 'SIGN_OUT' };

export interface KeycloakAuthProviderProps {
  children: React.ReactNode;
}
