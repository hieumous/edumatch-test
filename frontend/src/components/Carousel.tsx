'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface CarouselProps<T> {
  items: T[];
  itemsPerPage?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function Carousel<T>({ 
  items, 
  itemsPerPage = 3, 
  renderItem, 
  className = '',
  emptyMessage = 'No items to display'
}: CarouselProps<T>) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Reset to first page when items change (to show newest items first)
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [items.length]); // Reset when items array length changes
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  // Log first page items to verify sorting
  React.useEffect(() => {
    if (items.length > 0 && currentIndex === 0) {
      const firstPageItems = items.slice(0, itemsPerPage);
      console.log(`[Carousel] First page items (index 0, should be newest):`, 
        firstPageItems.map((item: any, idx: number) => ({
          index: idx,
          id: item.id || item.scholarshipId || idx,
          title: item.title || item.scholarshipTitle || item.opportunityTitle || 'N/A',
          createdAt: item.createdAt || item.submittedAt || item.appliedDate || 'N/A'
        }))
      );
    }
  }, [items, itemsPerPage, currentIndex]);
  
  const currentItems = items.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );
  
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalPages - 1;
  
  const goToPrev = () => {
    if (canGoPrev) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  if (items.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Carousel Container */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={
              itemsPerPage === 3 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : itemsPerPage === 4
                ? "space-y-4"
                : "space-y-4"
            }
          >
            {currentItems.map((item, index) => (
              <motion.div
                key={`${currentIndex}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={itemsPerPage === 3 ? "h-full" : ""}
              >
                {renderItem(item, currentIndex * itemsPerPage + index)}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            disabled={!canGoPrev}
            className="flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t('common.previous')}</span>
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-600 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={!canGoNext}
            className="flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{t('common.next')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

