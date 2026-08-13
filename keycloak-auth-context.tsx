/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  useAuthRequest,
  DiscoveryDocument,
  resolveDiscoveryAsync,
} from 'expo-auth-session';
import {
  AUTH_KEYCLOAK_CLIENT_ID,
  AUTH_KEYCLOAK_ISSUER_ENDPOINT,
  AUTH_KEYCLOAK_REDIRECT_URI,
  AuthAction,
  KeycloakAuthProviderProps,
  AuthState,
} from './typings-and-constant';
import { KeycloakAuthContext, initialAuthData } from './create-auth-context';
import EnabledKeyCloakRestNetWorkFailed from './FallbackAuth';
import { useStorageState } from '@/hooks/useStorageState';
import { KeycloakUserInfo, UserMetaDataType } from '@/types/common.typings';
import { isPropEmpty, isTokenExpired, parseJwt } from '@/utils/CommonUtils';
import { AtaiStore, AxiosClient } from '@atai/react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { authDataStorageKey } from '@/assets/environment';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { useMutation } from "@tanstack/react-query";
import { CisfAccessRoles, PreArrivalAccessibleRoles, ReviewAccessibleRoles, SurveyorAccessRoles } from '@/constants/RolesTypings';
import { useAppStore } from '@/context-api/zustand-ctx';

const KeycloakAuthProvider: React.FC<KeycloakAuthProviderProps> = ({
  children,
}) => {
  const [discoveryDoc, setDiscoveryDoc] = useState<DiscoveryDocument | null>(
    null,
  );
  const [discoveryDocError, setDiscoveryDocError] = useState<any | null>(null);
  const [isAllowedMock, setIsAllowed] = useState(false);
  const [[authData], setAuthData] = useStorageState(authDataStorageKey);
  const [userData, setUserData] = useState<UserMetaDataType>();
  const rtr = useRouter();
  const authLocalData = ""
  const availablePermissions = useRef<string[]>([])
  const setMessage = AtaiStore((state) => state.setToasterMessage);
  const setLoading = useAppStore((state) => state?.setLoading);
  const setToken = useAppStore((state) => state?.setAuthToken);
  
  const appAccessibleRoles = [
    CisfAccessRoles.CISFIN,
    CisfAccessRoles.CISFOUT,
    SurveyorAccessRoles.SURVEYOR,
    ReviewAccessibleRoles.REVIEW_ACCESS,
    PreArrivalAccessibleRoles.PREARRIVAL_VIEW
  ];
  // Memoize discovery document fetch
  useEffect(() => {
    let isMounted = true;

    const fetchDiscoveryDoc = async () => {
      try {
        const discovery = await resolveDiscoveryAsync(
          AUTH_KEYCLOAK_ISSUER_ENDPOINT,
        );
        if (isMounted || isAllowedMock) {
          setDiscoveryDoc(discovery);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';
        setDiscoveryDocError(errorMessage);
      }
    };

    fetchDiscoveryDoc();

    return () => {
      isMounted = false;
    };
  }, [isAllowedMock]);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: AUTH_KEYCLOAK_CLIENT_ID,
      redirectUri: AUTH_KEYCLOAK_REDIRECT_URI,
      scopes: ['openid', 'profile',"organization:*"],
      responseType: 'code',
      
    },
    discoveryDoc,
  );

  // Parse the User token
  useEffect(() => {
  const dummydata:any= {}
  setUserData(dummydata);
  let sessionData: KeycloakUserInfo | null = null;

  try {
    if (authLocalData) {
      sessionData = JSON.parse(authLocalData);
    } else if (authData) {
      sessionData = JSON.parse(authData);
    }
  } catch (error) {
    console.error("Failed to parse session data:", error);
    sessionData = null;
  }

  if (!authData) {
    return;
  }

  if (!sessionData?.access_token) {
    return;
  }
  const parsedJwt = parseJwt(sessionData.access_token);
    if (!authLocalData && !authData) {
      return;
    }else {
      if (isTokenExpired(authData)) {
        authContext.signOut()
        setAuthData(null);
        setAuthData(null);
        setToken(null)
        availablePermissions.current=[]
      } else {
        const currentTimeInSeconds = Math.floor(Date.now() / 1000); 
        const timeDifference = currentTimeInSeconds - parsedJwt.iat;
        if (timeDifference > 5) {
          setMessage({ type: "SUCCESS", message: "User already logged in." }); 
        }
        AxiosClient.setToken(sessionData?.access_token);
      }
    }
    const parsedUserMetaData: UserMetaDataType = {
      id: parsedJwt?.sid,
      expiresAt: parsedJwt?.exp,
      issuedAt: parsedJwt?.iat,
      resourcePermissions: parsedJwt?.resource_access,
      realmPermissions: parsedJwt?.realm_access,
      username: parsedJwt?.preferred_username,
      permissions: undefined
    };
    setUserData(parsedUserMetaData);
  }, [authData]);
 useEffect(() => {
    if(authLocalData||authData){
      if(!isPropEmpty(availablePermissions.current.length)){
        fetchSurveyAppPermissions.mutate({
          portal_id: ""
        });
      }
    }
  }, [userData]);
const fetchSurveyAppPermissions = useMutation({
    mutationFn: (data:any) => {
      return AxiosClient.request().get<any>(ApiRoutes.getPermissions);
    },
    onSuccess: (data) => {
      setLoading(null);
      const permissionsDetailedList = data?.data || []
      let permissionsList = permissionsDetailedList?.filter((permission: { rsname: string; }) => permission?.rsname && permission?.rsname?.startsWith('ui_'));
      const permissions = permissionsList?.map((permission: { rsname: any; }) => permission?.rsname);
      const hasMatch: boolean = appAccessibleRoles.some((element) =>
        permissions?.find((r:string) => r === element)
      );
      
      if(!hasMatch){
        setMessage({ type: "FAILURE", message: "You do not have access to this page. Try logging in with a different account." })
      }else{
        availablePermissions.current = permissions || []
        if(!authData){
          setMessage({ type: "SUCCESS", message: "User Logged In" });
          setAuthData(authData)
          setToken(authData)
        }
      }
    },
    onError: (error: any) => {
      setLoading(null);
      setMessage({ type: "FAILURE", message: error.message });
    },
});
  const [authState, dispatch] = useReducer(
    (previousState: AuthState, action: AuthAction): AuthState => {
      switch (action.type) {
        case 'SIGN_IN':
          return {
            ...previousState,
            isSignedIn: true,
            accessToken: action?.payload?.access_token,
            idToken: action?.payload?.id_token,
          };
        case 'USER_INFO':
          return {
            ...previousState,
            userInfo: {
              username: action.payload?.preferred_username,
              email: action?.payload.email,
              roles: action?.payload.roles,
            },
          };
        case 'SIGN_OUT':
          return initialAuthData;
        default:
          return previousState;
      }
    },
    initialAuthData,
  );

  // Memoize token retrieval
  const getToken = useCallback(
    async ({
      code,
      codeVerifier,
      redirectUri,
    }: {
      code: string;
      codeVerifier?: string;
      redirectUri: string;
    }) => {
      try {
        const formData = {
          grant_type: 'authorization_code',
          client_id: AUTH_KEYCLOAK_CLIENT_ID,
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        };
        const formBody = Object.entries(formData)
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(value || '')}`,
          )
          .join('&');

        const response = await fetch(
          `${AUTH_KEYCLOAK_ISSUER_ENDPOINT}/protocol/openid-connect/token`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody,
          },
        );

        if (response.ok) {
          const payload = await response.json();
          setAuthData(JSON.stringify(payload))
          availablePermissions.current=[]
          AxiosClient.setToken(payload?.access_token);
          dispatch({ type: 'SIGN_IN', payload });
        }
      } catch (error) { console.error("keycloak Token : ", error) }
    },
    [setAuthData],
  );

  // Memoize user info retrieval
  const getUserInfo = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(
        `${AUTH_KEYCLOAK_ISSUER_ENDPOINT}/protocol/openid-connect/userinfo`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      if (response.ok) {
        const payload = await response.json();
        dispatch({ type: 'USER_INFO', payload });
      }
    } catch (error) { console.error("keycloak UserInfo : ", error) }
  }, []);

  // Handle authentication response
  useEffect(() => {
    let timerId: any;
    if (response?.type === 'success') {
      const { code } = response.params;
      getToken({
        code,
        codeVerifier: request?.codeVerifier,
        redirectUri: AUTH_KEYCLOAK_REDIRECT_URI,
      });
      // Navigate after successful auth
    } else if (response?.type === 'error' || response?.type === 'dismiss') {
      timerId = setTimeout(() => {
        promptAsync();
      }, 6000);
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [response, getToken, request?.codeVerifier]);

  // Fetch user info after sign-in
  useEffect(() => {
    if (authState.isSignedIn && authState.accessToken) {
      getUserInfo(authState.accessToken);
    }
  }, [authState.isSignedIn, authState.accessToken, getUserInfo]);

  const loadPrompt = async () => {
    console.log(request);
    
    if (!request) {
      return;
    }
    try {
      await promptAsync({
        windowFeatures: { width: '1920px', height: '1000px' },
      });
    } catch { }
  };

  // Memoize auth context to prevent unnecessary re-renders
  const authContext = useMemo(
    () => ({
      authData: authState,
      signIn: loadPrompt,
      hasKeycloakPermissions: (role: string): boolean => {
          return availablePermissions.current?.includes(
            role
          );
        },
      signOut: async () => {
        try {
          const idToken = JSON.parse(authData as any);
          await axios(
            `${AUTH_KEYCLOAK_ISSUER_ENDPOINT}/protocol/openid-connect/logout?id_token_hint=${idToken?.id_token}`,
          );
          availablePermissions.current=[]
          setAuthData(null);
          setToken(null)
          AxiosClient.setToken('');
          rtr.replace('/(auth)/keyclock-login-auth')
          rtr.replace('/')
          dispatch({ type: 'SIGN_OUT' });
        } catch (error) {
          setAuthData(null);
          setToken(null)
          AxiosClient.setToken('');
          dispatch({ type: 'SIGN_OUT' });
          rtr.replace('/(auth)/keyclock-login-auth')
          rtr.replace('/')
        }
      },
      error: discoveryDocError,
      userMetaData: userData,
    }),
    [authState, loadPrompt, userData, discoveryDocError, setAuthData],
  );



  return (
    <KeycloakAuthContext.Provider value={authContext}>
      {children}
      {!discoveryDoc && (
        <EnabledKeyCloakRestNetWorkFailed allomeNow={setIsAllowed} />
      )}
    </KeycloakAuthContext.Provider>
  );
};

export default React.memo(KeycloakAuthProvider);