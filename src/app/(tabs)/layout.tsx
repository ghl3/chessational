"use client";

import Chessboard from "@/components/Chessboard";
import { NavBar } from "@/components/NavBar";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { ReactNode, useRef, useState, useLayoutEffect } from "react";

// Inner layout that has access to context
const TabsLayoutInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { chessboardState, studyData, boardSize, containerRef, onLegalMove } = useAppContext();
  const pathname = usePathname();
  
  // Determine if we should show the chapter selector (all tabs except studies)
  const showChapterSelector = pathname !== "/studies";

  // Measure the chessboard wrapper height and sync to right panel
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (boardWrapperRef.current) {
      setPanelHeight(boardWrapperRef.current.offsetHeight);
    }
  }, [boardSize]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* CSS Grid ensures both columns are equal width by design */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 min-h-0">
        {/* Chessboard Section - Left/Top - containerRef measures this column */}
        <div ref={containerRef} className="flex items-start justify-center lg:justify-end">
          <div ref={boardWrapperRef} className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <Chessboard
              chessboardSize={boardSize}
              chessboardState={chessboardState}
              onLegalMove={onLegalMove}
            />
          </div>
        </div>

        {/* Right Panel Section - Right/Bottom - height synced to chessboard wrapper */}
        <div 
          className="flex flex-col min-h-0"
          style={panelHeight ? { height: `${panelHeight}px` } : undefined}
        >
          <div className="h-full flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Navigation - Fixed at top */}
            <div className="flex-none">
              <NavBar />
            </div>

            {/* Chapter Selector - Fixed below nav for relevant tabs */}
            {showChapterSelector && (
              <div className="flex-none border-b border-gray-700">
                <StudyChapterSelector studyData={studyData} />
              </div>
            )}

            {/* Main Content Area - Fill remaining space, children handle scrolling */}
            <div className="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
              {children}
            </div>
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
