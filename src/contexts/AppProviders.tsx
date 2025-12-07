
'use client';

import React, { ReactNode } from 'react';
import { RecipeProvider } from './RecipeContext';
import { ShoppingListProvider } from './ShoppingListContext';
import { HeaderProvider } from './HeaderContext';

const ClientProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <HeaderProvider>
      <RecipeProvider>
        <ShoppingListProvider>
            {children}
        </ShoppingListProvider>
      </RecipeProvider>
    </HeaderProvider>
  );
};

export default ClientProviders;
