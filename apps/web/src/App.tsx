import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DisponibilidadCiaPresentation from './pages/DisponibilidadCiaPresentation'
import CiaGame from './pages/CiaGame'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/presentacion/disponibilidad" element={<DisponibilidadCiaPresentation />} />
      <Route path="/juego" element={<CiaGame />} />
    </Routes>
  )
}

export default App
