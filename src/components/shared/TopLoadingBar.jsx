import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function TopLoadingBar() {
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Show loading bar aggressively on route changes
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ x: '-100%', opacity: 1 }}
          animate={{ x: '0%', opacity: 1 }}
          exit={{ opacity: 0, x: '100%', transition: { duration: 0.4 } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed top-0 left-0 w-full h-1.5 z-[9999]"
          style={{ background: 'linear-gradient(90deg, #5f39f8, #00d2ff, #5f39f8)' }}
        />
      )}
    </AnimatePresence>
  )
}
