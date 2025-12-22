"use client";

import Chessboard from "@/components/Chessboard";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// Inner layout that has access to context
const TabsLayoutInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { chessboardState, studyData, onLegalMove } = useAppContext();
  
  // Show the chapter selector on all pages
  const showChapterSelector = true;

  return (
    <div className="h-full w-full flex flex-col bg-gray-900">
      {/* Main content area - use grid for equal sizing on desktop */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 p-4 min-h-0 overflow-auto lg:overflow-hidden justify-center items-center lg:items-stretch lg:justify-items-center">
        {/* Left Panel - Chessboard */}
        <div 
          className="w-full max-w-[800px] lg:justify-self-end aspect-[6/7] bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col"
        >
          <Chessboard
            chessboardState={chessboardState}
            onLegalMove={onLegalMove}
          />
        </div>

        {/* Right Panel - Content */}
        <div 
          className="w-full max-w-[800px] lg:justify-self-start aspect-[6/7] bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden"
        >
          {/* Chapter Selector - Fixed at top */}
          {showChapterSelector && (
            <div className="flex-none">
              <StudyChapterSelector studyData={studyData} />
            </div>
          )}

          {/* Main Content Area - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Outer layout that provides the context
const TabsLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  return (
    <AppProvider currentTab={pathname}>
      <TabsLayoutInner>{children}</TabsLayoutInner>
    </AppProvider>
  );
};

export default TabsLayout;
