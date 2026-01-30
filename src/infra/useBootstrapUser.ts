"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { upsertUserRef } from "@/ui/auth/convexAuth";

type BootstrapState = {
  ready: boolean;
  error?: string;
};

const useBootstrapUser = (enabled = true): BootstrapState => {
  const { isLoaded, isSignedIn, user } = useUser();
  const upsertUser = useMutation(upsertUserRef);
  const hasRunRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!enabled || !isSignedIn) {
      hasRunRef.current = false;
      return;
    }

    if (hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;
    const inviteBatchId =
      typeof user?.publicMetadata?.inviteBatchId === "string"
        ? user?.publicMetadata?.inviteBatchId
        : undefined;

    void upsertUser({ inviteBatchId }).then(
      () => {
        setReady(true);
      },
      (reason) => {
        const message =
          reason instanceof Error ? reason.message : String(reason);
        setError(message);
        setReady(false);
      },
    );
  }, [
    enabled,
    isLoaded,
    isSignedIn,
    upsertUser,
    user?.publicMetadata?.inviteBatchId,
  ]);

  return {
    ready: enabled && isSignedIn ? ready : false,
    error: enabled && isSignedIn ? error : undefined,
  };
};

export { useBootstrapUser };
