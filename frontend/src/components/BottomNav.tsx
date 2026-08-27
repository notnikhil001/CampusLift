import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, PlusCircle, Clock, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs font-medium transition ${
            isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <Search className="w-5 h-5" />
        <span>Explore</span>
      </NavLink>

      <NavLink
        to="/create-intent"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs font-medium transition ${
            isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <PlusCircle className="w-5 h-5" />
        <span>Post Intent</span>
      </NavLink>

      <NavLink
        to="/my-trips"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs font-medium transition ${
            isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <Clock className="w-5 h-5" />
        <span>My Trips</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs font-medium transition ${
            isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
