const currentYear = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="content-container">
        <p>© {currentYear} Chee Jun Kit</p>
      </div>
    </footer>
  )
}
