"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Home page - redirects to the Practice page
 */
const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/practice");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-gray-400">Redirecting to Practice...</div>
    </div>
  );
};

export default HomePage;
