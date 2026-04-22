import { useState } from 'react'

export function useNavigation(defaultPage = 'exec') {
  const [activePage, setActivePage] = useState(defaultPage)
  const [activeSection, setActiveSection] = useState(null)

  const navigate = (pageId, sectionId = null) => {
    setActivePage(pageId)
    setActiveSection(sectionId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { activePage, activeSection, navigate }
}
