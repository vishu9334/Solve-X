import { createRoot } from 'react-dom/client'
import './index.css'
import Providers from './app/provider.jsx'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router.jsx'

createRoot(document.getElementById('root')).render(
  <Providers>
    <RouterProvider router={router}/>
  </Providers>
)