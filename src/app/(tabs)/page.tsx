"use client";

import { Review } from "@/components/Review";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const ReviewPage = () => {
  const { chessboardState, studyData, engineData, reviewState } = useAppContext();
  const router = useRouter();

  const navigateToStudies = useCallback(() => {
    router.push("/studies");
  }, [router]);

  return (
    <Review
      chessboardState={chessboardState}
      studyData={studyData}
      engineData={engineData}
      reviewState={reviewState}
      onNavigateToStudies={navigateToStudies}
    />
  );
};

export default ReviewPage;
