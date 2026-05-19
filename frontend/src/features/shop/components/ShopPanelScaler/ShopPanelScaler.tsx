import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './ShopPanelScaler.css';

interface ShopPanelScalerProps {
  children: ReactNode;
  scale: number;
}

export const ShopPanelScaler = ({ children, scale }: ShopPanelScalerProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const update = () => {
      setBounds({
        width: Math.ceil(el.offsetWidth * scale),
        height: Math.ceil(el.offsetHeight * scale),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, scale]);

  return (
    <div
      className="shop-panel-scaler"
      style={{
        width: bounds.width > 0 ? bounds.width : undefined,
        height: bounds.height > 0 ? bounds.height : undefined,
      }}
    >
      <div
        ref={innerRef}
        className="shop-panel-scaler__inner"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};
