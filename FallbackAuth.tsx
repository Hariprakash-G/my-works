"use dom";

import { resolveDiscoveryAsync } from "expo-auth-session";
import React , { useEffect } from "react";
import { AUTH_KEYCLOAK_ISSUER_ENDPOINT } from "./typings-and-constant";

const EnabledKeyCloakRestNetWorkFailed = ({
  allomeNow,
}: {
  allomeNow: (arg: boolean) => void;
}) => {
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let isAllowed = true;
    resolveDiscoveryAsync(AUTH_KEYCLOAK_ISSUER_ENDPOINT)
      .then((discovery) => {
        if (isAllowed) allomeNow(true);
      })
      .catch((e) => {
        allomeNow(false);
      });
    return () => {
      isAllowed = false;
    };
  }, []);

  return <></>;
};

export default EnabledKeyCloakRestNetWorkFailed;
