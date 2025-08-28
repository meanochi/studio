
'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());

  // This effect will only run on the client, ensuring the value is consistent after hydration.
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-primary/10 text-primary py-6 text-center no-print">
      <div className="container mx-auto flex justify-center items-center gap-2">
        <p className="text-sm font-body">
          &copy; {year} All rights reserved Michal
        </p>
      </div>
    </footer>
  );
}
