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

  // Use a ref to measure the actual chessboard container dimensions
  const chessboardWrapperRef = useRef<HTMLDivElement>(null);
  const [rightPanelSize, setRightPanelSize] = useState<{ width: number; height: number } | null>(null);

  // Measure the chessboard container and sync the right panel dimensions
  useLayoutEffect(() => {
    const updateSize = () => {
      if (chessboardWrapperRef.current) {
        setRightPanelSize({
          width: chessboardWrapperRef.current.offsetWidth,
          height: chessboardWrapperRef.current.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [boardSize]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 justify-center items-start"
      >
        {/* Chessboard Section - Left/Top */}
        <div className="flex-shrink-0">
          <div ref={chessboardWrapperRef} className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <Chessboard
              chessboardSize={boardSize}
              chessboardState={chessboardState}
              onLegalMove={onLegalMove}
            />
          </div>
        </div>

        {/* Right Panel Section - Right/Bottom - matches chessboard container size exactly */}
        <div 
          className="w-full lg:w-auto flex flex-col flex-shrink-0"
          style={rightPanelSize ? { width: `${rightPanelSize.width}px`, height: `${rightPanelSize.height}px` } : undefined}
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
            <div className="flex-1 min-h-0 p-4 flex flex-col">
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
