export function Footer() {
  return (
    <footer className="w-full border-t border-border-subtle bg-bg-base py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} CampusMart. Built for the campus community.
        </p>
        
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer">
            <span className="text-sm text-text-secondary hover:text-brand-primary transition-colors flex items-center gap-1">
              💖 Support the Developer
            </span>
            {/* Tooltip/Dropdown with QR Code */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
              <div className="bg-bg-panel border border-border-subtle p-3 rounded-xl shadow-lg w-48 text-center">
                <p className="text-xs text-text-muted mb-2">Scan to donate via UPI</p>
                <div className="bg-white p-2 rounded-lg inline-block">
                  {/* Replace with your actual UPI QR code image later */}
                  <div className="w-32 h-32 bg-gray-200 border border-gray-300 flex items-center justify-center text-[10px] text-gray-500 text-center">
                    [Your UPI QR]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
