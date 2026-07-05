import { Routes, Route } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import Landing from '@/pages/Landing'
import Trade from '@/pages/Trade'
import Batches from '@/pages/Batches'
import BatchDetail from '@/pages/BatchDetail'
import Portfolio from '@/pages/Portfolio'
import Docs from '@/pages/Docs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<PageWrapper />}>
        <Route path="/trade" element={<Trade />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/batches/:id" element={<BatchDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/docs" element={<Docs />} />
      </Route>
    </Routes>
  )
}
