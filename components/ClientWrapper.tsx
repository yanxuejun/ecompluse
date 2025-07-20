"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function ClientWrapper() {
  const { isLoaded, isSignedIn, user } = useUser();
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const name = user.fullName || user.username || "";
      const email = user.primaryEmailAddress?.emailAddress || "";
      fetch("/api/user/init", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
    }
  }, [isLoaded, isSignedIn, user]);
  return null;
} 