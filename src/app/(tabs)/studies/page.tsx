"use client";

import { Studies } from "@/components/Studies";
import { useAppContext } from "@/context/AppContext";

const StudiesPage = () => {
  const { studyData } = useAppContext();

  return <Studies studyData={studyData} />;
};

export default StudiesPage;
