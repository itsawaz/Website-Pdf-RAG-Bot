import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Granite RAG Chatbot',
  description: 'Intelligent document and web content chatbot powered by Granite 3.3B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} gradient-bg min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
