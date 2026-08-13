import React, { useEffect, useState } from 'react';
import { useStorageState } from '../hooks/useStorageState';
import { View } from 'react-native';
import { parseJwt } from '@/utils/CommonUtils';
import { UserMetaDataType } from '@/types/common.typings';

const AuthContext = React.createContext<{
  signIn: (token: string) => void;
  signOut: () => void;
  session?: string | null;
  userMetaData?: UserMetaDataType | null;
}>({
  signIn: (token: string) => null,
  signOut: () => null,
  session: null,
  userMetaData: null,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [[session], setSession] = useStorageState('session');
  const [userData, setUserData] = useState<UserMetaDataType>();

  useEffect(() => {
    if (!session) {
      return;
    }
    const parsedJwt = parseJwt(session);
    const parsedUserMetaData: UserMetaDataType = {
      id: parsedJwt?.user_id,
      expiresAt: parsedJwt?.exp,
      issuedAt: parsedJwt?.iat,
      permissions: parsedJwt?.identity?.groups?.[0]?.permissions,
      username: parsedJwt?.identity?.username,
      resourcePermissions: {},
      realmPermissions: {
        roles: []
      },
    };
    setUserData(parsedUserMetaData);
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        signIn: (token: string) => {
          setSession(token);
        },
        signOut: () => {
          setSession(null);
        },
        session,
        userMetaData: userData,
      }}
    >
      <View style={{ width: '100%', height: '100%' }}>{props.children}</View>
    </AuthContext.Provider>
  );
}
