import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export function AdminGate({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((user) => {
        if (active) setIsAdmin(user?.role === "admin");
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) return null;
  return <>{children}</>;
}