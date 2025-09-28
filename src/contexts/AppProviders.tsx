'use client';

import React, { ReactNode } from 'react';
import { RecipeProvider } from './RecipeContext';
import { ShoppingListProvider } from './ShoppingListContext';

// This component is now wrapped by Providers in app/providers.tsx
// which contains the 'use client' directive. We can remove it from here,
// though it doesn't hurt to have it. For clarity, we can assume this
// component inherits its client status from its parent.

const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RecipeProvider>
      <ShoppingListProvider>
        {children}
      </ShoppingListProvider>
    </RecipeProvider>
  );
};

export default AppProviders;
