"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function ClientWrapper() {
  const { isLoaded, isSignedIn } = useUser();
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch("/api/user/init", { method: "POST", credentials: "include" });
    }
  }, [isLoaded, isSignedIn]);
  return null;
} 