
'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import type { Recipe } from '@/types';

interface HeaderContextType {
  headerContent: ReactNode | null;
  setHeaderContent: (content: ReactNode | null) => void;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  openTabs: Recipe[];
  setOpenTabs: Dispatch<SetStateAction<Recipe[]>>;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [headerContent, setHeaderContent] = useState<ReactNode | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [openTabs, setOpenTabs] = useState<Recipe[]>([]);

  return (
    <HeaderContext.Provider value={{ headerContent, setHeaderContent, activeTab, setActiveTab, openTabs, setOpenTabs }}>
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
