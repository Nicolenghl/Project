'use client';

import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}