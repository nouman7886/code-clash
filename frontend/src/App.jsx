import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';

import Navbar          from './components/Navbar';
import Home            from './pages/Home';
import Challenges      from './pages/Challenges';
import CreateChallenge from './pages/CreateChallenge';
import ChallengeDetail from './pages/ChallengeDetail';
import Room            from './pages/Room';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="scanline" aria-hidden="true" />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"               element={<Home />} />
              <Route path="/challenges"     element={<Challenges />} />
              <Route path="/challenges/new" element={<CreateChallenge />} />
              <Route path="/challenges/:id" element={<ChallengeDetail />} />
              <Route path="/room/:roomId"   element={<Room />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}