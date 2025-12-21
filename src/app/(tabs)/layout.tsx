"use client";

import Chessboard from "@/components/Chessboard";
import { StudyChapterSelector } from "@/components/StudyChapterSelector";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { ReactNode, useRef, useState, useLayoutEffect } from "react";

// Inner layout that has access to context
const TabsLayoutInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { chessboardState, studyData, boardSize, containerRef, onLegalMove } = useAppContext();
  
  // Show the chapter selector on all pages
  const showChapterSelector = true;

  // Measure the chessboard wrapper height and sync to right panel
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (boardWrapperRef.current) {
      const height = boardWrapperRef.current.offsetHeight;
      setPanelHeight(height);
    }
  }, [boardSize]);

  return (
    <div className="h-full w-full flex flex-col bg-gray-900">
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row lg:items-start gap-4 p-4 min-h-0 justify-center overflow-hidden"
      >
        {/* Chessboard Section - Left/Top */}
        <div className="flex-shrink-0 flex items-start justify-center lg:justify-end overflow-y-auto lg:overflow-visible">
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
          className="w-full lg:w-[45%] lg:min-w-[450px] flex-shrink-0 flex flex-col min-h-0"
          style={panelHeight ? { height: `${panelHeight}px` } : undefined}
        >
          <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Chapter Selector - Fixed at top */}
            {showChapterSelector && (
              <div className="flex-none">
                <StudyChapterSelector studyData={studyData} />
              </div>
            )}

            {/* Main Content Area - Scrollable per tab requirement */}
            <div className="flex-1 min-h-0 flex flex-col relative">
              <div className="absolute inset-0 overflow-y-auto p-3">
                {children}
              </div>
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
