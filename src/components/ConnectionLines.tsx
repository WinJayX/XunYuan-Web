'use client';

import { useEffect, useRef, useCallback } from 'react';
import { FamilyData } from '@/types/family';
import { getSpouseIds } from '@/lib/utils';

interface ConnectionLinesProps {
  familyData: FamilyData;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ConnectionLines({ familyData, containerRef }: ConnectionLinesProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const drawConnections = useCallback(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    svg.innerHTML = '';

    if (!familyData.settings.showConnections) return;

    // Get the container dimensions (unscaled)
    const maxWidth = container.scrollWidth;
    const maxHeight = container.scrollHeight;

    svg.setAttribute('width', String(maxWidth));
    svg.setAttribute('height', String(maxHeight));
    svg.setAttribute('viewBox', `0 0 ${maxWidth} ${maxHeight}`);

    // Traverse all members and find parent-child relationships
    familyData.generations.forEach((gen, genIndex) => {
      gen.members.forEach(member => {
        if (member.parentId && genIndex > 0) {
          const parentGen = familyData.generations[genIndex - 1];
          if (parentGen) {
            const parent = parentGen.members.find(m => m.id === member.parentId);
            if (parent) {
              // Check if parent has spouse (in couple container)
              const parentSpouseIds = getSpouseIds(parent);
              const hasSpouse = parentSpouseIds.length > 0;

              drawConnectionLine(svg, parent.id, member.id, container, hasSpouse);
            }
          }
        }
      });
    });
  }, [familyData, containerRef]);

  useEffect(() => {
    // Delay initial draw to ensure all elements are properly laid out
    const initialTimer = setTimeout(() => {
      drawConnections();
    }, 100);

    // Also redraw on window load to catch any late layout changes
    const handleLoad = () => {
      setTimeout(drawConnections, 50);
    };

    const handleResize = () => {
      requestAnimationFrame(drawConnections);
    };

    // Handle scroll on generation rows - redraw connections when scrolling
    const handleRowScroll = () => {
      requestAnimationFrame(drawConnections);
    };

    // Use ResizeObserver to watch for card size changes (zoom effect)
    let resizeObserver: ResizeObserver | null = null;
    const container = containerRef.current;

    // Add scroll listeners to all generation rows
    const generationRows: Element[] = [];
    if (container) {
      const rows = container.querySelectorAll('.generation-row');
      rows.forEach(row => {
        row.addEventListener('scroll', handleRowScroll);
        generationRows.push(row);
      });
    }

    if (container) {
      resizeObserver = new ResizeObserver(() => {
        // Debounce the redraw
        requestAnimationFrame(drawConnections);
      });
      // Observe member cards
      const cards = container.querySelectorAll('.member-card');
      cards.forEach(card => resizeObserver?.observe(card));
    }

    // Use MutationObserver to watch for DOM changes (new members added)
    let mutationObserver: MutationObserver | null = null;
    if (container) {
      mutationObserver = new MutationObserver(() => {
        // Reconfigure observers and redraw
        if (resizeObserver) {
          const cards = container.querySelectorAll('.member-card');
          cards.forEach(card => resizeObserver?.observe(card));
        }
        // Also add scroll listeners to any new generation rows
        const rows = container.querySelectorAll('.generation-row');
        rows.forEach(row => {
          if (!generationRows.includes(row)) {
            row.addEventListener('scroll', handleRowScroll);
            generationRows.push(row);
          }
        });
        setTimeout(drawConnections, 50);
      });
      mutationObserver.observe(container, {
        childList: true,
        subtree: true
      });
    }

    window.addEventListener('load', handleLoad);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      // Remove scroll listeners from generation rows
      generationRows.forEach(row => {
        row.removeEventListener('scroll', handleRowScroll);
      });
    };
  }, [drawConnections, containerRef]);

  // 暴露重绘方法
  useEffect(() => {
    (window as unknown as { redrawConnections?: () => void }).redrawConnections = drawConnections;
    return () => {
      delete (window as unknown as { redrawConnections?: () => void }).redrawConnections;
    };
  }, [drawConnections]);

  return (
    <svg
      ref={svgRef}
      className="connection-lines"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible'
      }}
    />
  );
}

// Calculate position relative to container, accounting for scroll offsets
function getOffsetPosition(element: HTMLElement, container: HTMLElement) {
  let left = 0;
  let top = 0;
  let current: HTMLElement | null = element;

  // Walk up the DOM tree until we reach the container
  while (current && current !== container) {
    left += current.offsetLeft;
    top += current.offsetTop;

    // Subtract scroll offsets of scrollable parents
    const parent = current.parentElement;
    if (parent && parent !== container) {
      left -= parent.scrollLeft;
      top -= parent.scrollTop;
    }

    current = current.offsetParent as HTMLElement;
  }

  return {
    left,
    top,
    width: element.offsetWidth,
    height: element.offsetHeight,
    right: left + element.offsetWidth,
    bottom: top + element.offsetHeight,
    centerX: left + element.offsetWidth / 2,
    centerY: top + element.offsetHeight / 2
  };
}

function drawConnectionLine(
  svg: SVGSVGElement,
  parentId: number,
  childId: number,
  container: HTMLElement,
  parentHasSpouse: boolean
) {
  const childCard = document.querySelector(`.member-card[data-member-id="${childId}"]`) as HTMLElement;
  if (!childCard) return;

  let x1: number, y1: number;

  if (parentHasSpouse) {
    // If parent has spouse, connect from the couple container's bottom center
    const coupleContainer = document.querySelector(`.couple-container[data-main-member-id="${parentId}"]`) as HTMLElement;
    if (coupleContainer) {
      const pos = getOffsetPosition(coupleContainer, container);
      x1 = pos.centerX;
      y1 = pos.bottom;
    } else {
      // Fallback to parent card
      const parentCard = document.querySelector(`.member-card[data-member-id="${parentId}"]`) as HTMLElement;
      if (!parentCard) return;
      const pos = getOffsetPosition(parentCard, container);
      x1 = pos.centerX;
      y1 = pos.bottom;
    }
  } else {
    // No spouse, connect from parent card
    const parentCard = document.querySelector(`.member-card[data-member-id="${parentId}"]`) as HTMLElement;
    if (!parentCard) return;
    const pos = getOffsetPosition(parentCard, container);
    x1 = pos.centerX;
    y1 = pos.bottom;
  }

  // Get child card position - connect to top center of child member card
  const childPos = getOffsetPosition(childCard, container);
  const x2 = childPos.centerX;
  const y2 = childPos.top;

  const midY = (y1 + y2) / 2;

  // Create path
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  path.setAttribute('d', d);
  path.setAttribute('class', 'connection-line');
  path.dataset.parent = String(parentId);
  path.dataset.child = String(childId);

  svg.appendChild(path);

  // Add connection dots
  const dot1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot1.setAttribute('cx', String(x1));
  dot1.setAttribute('cy', String(y1));
  dot1.setAttribute('r', '4');
  dot1.setAttribute('class', 'connection-dot');
  svg.appendChild(dot1);

  const dot2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot2.setAttribute('cx', String(x2));
  dot2.setAttribute('cy', String(y2));
  dot2.setAttribute('r', '4');
  dot2.setAttribute('class', 'connection-dot');
  svg.appendChild(dot2);
}

