import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Leaderboard from './modules/leaderboard/Leaderboard'
import Login from './modules/auth/Login'
import FinePage from './modules/fines/FinePage'
import Admin from './modules/admin/Admin'
import MatchForm from './modules/matches/MatchForm'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Leaderboard /> },
      { path: 'login', element: <Login /> },
      { path: 'fines', element: <FinePage /> },
      { path: 'matches/new', element: <MatchForm /> },
      { path: 'admin', element: <Admin /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
