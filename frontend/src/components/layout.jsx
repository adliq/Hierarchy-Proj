import { useEffect } from 'react';
import Navbar from './elements/Navbar';
import Footer from './elements/Footer';
import { Outlet } from 'react-router-dom';

export default function Layout({ title }) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <Navbar />
      <main className="flex flex-col gap-y-20 md:gap-y-32 overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
