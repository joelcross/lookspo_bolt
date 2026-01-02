// contexts/TabContext.tsx
import React, { createContext, useContext, useState } from 'react';

type TabKey = 'home' | 'search' | 'new_post' | 'activity' | 'profile';

interface TabContextValue {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const TabContext = createContext<TabContextValue | undefined>(undefined);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error('useTab must be used inside TabProvider');
  return context;
};
