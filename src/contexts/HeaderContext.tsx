
'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
import type { Recipe } from '@/types';

interface HeaderContextType {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  openTabs: Recipe[];
  setOpenTabs: Dispatch<SetStateAction<Recipe[]>>;
  handleCloseTab: (recipeId: string, e: React.MouseEvent) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [openTabs, setOpenTabs] = useState<Recipe[]>([]);

  const handleCloseTab = useCallback((recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    const tabIndex = openTabs.findIndex(tab => tab.id === recipeId);
    if (tabIndex === -1) return;

    // After closing a tab, determine the new active tab
    if (activeTab === recipeId) {
       const newOpenTabs = openTabs.filter(tab => tab.id !== recipeId);
       if (newOpenTabs.length > 0) {
         // If there was a tab before the closed one, activate it. Otherwise, activate the new first tab.
         const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
         setActiveTab(newOpenTabs[newActiveIndex]?.id || 'home');
       } else {
         // If no tabs are left, go to home
         setActiveTab('home');
       }
    }
    
    setOpenTabs(prev => prev.filter(tab => tab.id !== recipeId));
  }, [activeTab, openTabs, setActiveTab, setOpenTabs]);

  return (
    <HeaderContext.Provider value={{ activeTab, setActiveTab, openTabs, setOpenTabs, handleCloseTab }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
