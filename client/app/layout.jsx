
import './globals.css'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import Navbar from '@/components/Navbar'
import { Toaster, toast } from 'sonner'


export const metadata = {
  title: 'AI Partner',
  description: 'Your AI-powered partner for all your needs',
}

// Create a global error handler
if (typeof window !== 'undefined') {
  window.handleError = (error) => {
    toast.error(error.message || 'An error occurred');
  };
}

export default function RootLayout({ children }) {
  
  return (
    <html lang="en" className="no-transition">
      <body>
        <ConvexClientProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster position="top-right" expand={true} richColors />
        </ConvexClientProvider>
      </body>
    </html>
  )
}