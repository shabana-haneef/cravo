import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // fire once
        }
      },
      { threshold: options.threshold ?? 0.12, rootMargin: options.rootMargin ?? '0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
};
