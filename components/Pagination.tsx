import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage 
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-10 py-6 bg-slate-50/50 border-t border-slate-100">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Mostrando <span className="text-slate-900">{startItem}</span> a <span className="text-slate-900">{endItem}</span> de <span className="text-slate-900">{totalItems}</span> registros
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border-2 border-slate-100 bg-white text-slate-400 hover:border-violet-600 hover:text-violet-600 disabled:opacity-30 disabled:hover:border-slate-100 disabled:hover:text-slate-400 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 text-slate-300 font-black">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border-2 ${
                    currentPage === page 
                      ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-violet-600 hover:text-violet-600'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border-2 border-slate-100 bg-white text-slate-400 hover:border-violet-600 hover:text-violet-600 disabled:opacity-30 disabled:hover:border-slate-100 disabled:hover:text-slate-400 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
