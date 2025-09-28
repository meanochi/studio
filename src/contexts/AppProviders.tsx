'use client';

import React, { ReactNode } from 'react';
import { RecipeProvider } from './RecipeContext';
import { ShoppingListProvider } from './ShoppingListContext';
import { HeaderProvider } from './HeaderContext';

const ClientProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RecipeProvider>
      <ShoppingListProvider>
          {children}
      </ShoppingListProvider>
    </RecipeProvider>
  );
};

export default ClientProviders;
