import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Selig Rooms',description:'Explore the Selig Rooms with friends. Collect five lanyards and escape.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
