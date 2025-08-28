'use client';

import { ChefHat, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());

  // This effect will only run on the client, ensuring the value is consistent after hydration.
  // While getFullYear() is not very volatile, this is a good practice for any dynamic data.
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-primary/10 text-primary py-6 text-center no-print">
      <div className="container mx-auto flex justify-center items-center gap-2">
        <Phone size={16} />
        <p className="text-sm font-body">rights reserved for michal 0583245395</p>
      </div>
    </footer>
  );
}
