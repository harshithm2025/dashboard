import { createContext, useContext } from 'react'

const BrandContext = createContext(null)

/**
 * Accepts a full brand object (from brandService) — no hardcoded imports.
 */
export function BrandProvider({ brand, children }) {
  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used inside BrandProvider')
  return ctx
}
