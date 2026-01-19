'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useFamilyData } from '@/context/FamilyContext';
import { Member } from '@/types/family';
import BackgroundSlider from './BackgroundSlider';
import SettingsPanel from './SettingsPanel';
import Timeline from './Timeline';
import GenerationRow from './GenerationRow';
import ConnectionLines from './ConnectionLines';
import EditModal from './EditModal';
import MemberDetailModal from './MemberDetailModal';

interface FamilyTreeProps {
  onBack?: () => void;
}

export default function FamilyTree({ onBack }: FamilyTreeProps) {
  const {
    familyData,
    updateSettings,
    addGeneration,
    updateGenerationName,
    deleteGeneration,
    addMember,
    updateMember,
    deleteMember,
    exportData,
    importData,
    toggleConnections
  } = useFamilyData();

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    member: Member | null;
    genId: number | null;
  }>({ isOpen: false, member: null, genId: null });

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    member: Member | null;
    genId: number | null;
    initialTab: 'album' | 'stories';
  }>({ isOpen: false, member: null, genId: null, initialTab: 'album' });

  // 直系血脉高亮状态
  const [highlightedAncestors, setHighlightedAncestors] = useState<Set<number | string>>(new Set());
  const [selectedForTrace, setSelectedForTrace] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 获取主题类名
  const themeClass = familyData.settings.theme !== 'classic'
    ? `theme-${familyData.settings.theme}`
    : '';

  const zoomLevel = familyData.settings.zoomLevel || 1;

  // 调整时间轴标记位置
  const adjustTimelineMarkers = useCallback(() => {
    const rows = document.querySelectorAll('.generation-row');
    const markers = document.querySelectorAll('.timeline-marker');

    rows.forEach((row, index) => {
      if (markers[index]) {
        const marker = markers[index] as HTMLElement;
        const rowHeight = (row as HTMLElement).offsetHeight;
        marker.style.height = `${rowHeight}px`;
        marker.style.marginBottom = '50px';
      }
    });
  }, []);

  // 重绘连线
  const redrawConnections = useCallback(() => {
    const fn = (window as unknown as { redrawConnections?: () => void }).redrawConnections;
    if (fn) fn();
  }, []);

  // 切换缩放比例 - 使用 CSS 变量控制卡片大小
  const handleZoomChange = useCallback((newZoom: number) => {
    // 更新 CSS 变量
    document.documentElement.style.setProperty('--card-scale', String(newZoom));

    // 添加缩放级别类来控制元素显示
    // 移除所有缩放级别类
    document.documentElement.classList.remove('zoom-25', 'zoom-50', 'zoom-75', 'zoom-100');
    // 添加对应的缩放级别类
    if (newZoom <= 0.25) {
      document.documentElement.classList.add('zoom-25');
    } else if (newZoom <= 0.5) {
      document.documentElement.classList.add('zoom-50');
    } else if (newZoom <= 0.75) {
      document.documentElement.classList.add('zoom-75');
    } else {
      document.documentElement.classList.add('zoom-100');
    }

    updateSettings({ zoomLevel: newZoom });
    // 延迟重绘连线，等待 CSS 动画完成
    setTimeout(() => {
      redrawConnections();
      adjustTimelineMarkers();
    }, 350);
  }, [updateSettings, redrawConnections, adjustTimelineMarkers]);

  // 回溯直系祖先
  const traceAncestors = useCallback((memberId: number) => {
    const ancestors = new Set<number | string>();
    ancestors.add(memberId);

    // 递归查找所有直系祖先
    const findAncestors = (id: number | string) => {
      for (const gen of familyData.generations) {
        const member = gen.members.find(m => m.id === id);
        if (member?.parentId) {
          ancestors.add(member.parentId);
          // 也添加父亲的配偶（母亲）
          for (const g of familyData.generations) {
            const parent = g.members.find(m => m.id === member.parentId);
            if (parent) {
              const spouseIds = parent.spouseIds || (parent.spouseId ? [parent.spouseId] : []);
              spouseIds.forEach(sid => ancestors.add(sid));
              break;
            }
          }
          findAncestors(member.parentId);
        }
      }
    };

    findAncestors(memberId);
    return ancestors;
  }, [familyData.generations]);

  // 处理血脉回溯
  const handleTraceAncestors = useCallback((member: Member) => {
    if (selectedForTrace === member.id) {
      // 再次点击取消高亮
      setSelectedForTrace(null);
      setHighlightedAncestors(new Set());
    } else {
      setSelectedForTrace(member.id);
      setHighlightedAncestors(traceAncestors(member.id));
    }
  }, [selectedForTrace, traceAncestors]);

  // 清除高亮
  const clearHighlight = useCallback(() => {
    setSelectedForTrace(null);
    setHighlightedAncestors(new Set());
  }, []);

  useEffect(() => {
    // 初始化时设置 CSS 变量
    document.documentElement.style.setProperty('--card-scale', String(zoomLevel));

    // 设置缩放级别类
    document.documentElement.classList.remove('zoom-25', 'zoom-50', 'zoom-75', 'zoom-100');
    if (zoomLevel <= 0.25) {
      document.documentElement.classList.add('zoom-25');
    } else if (zoomLevel <= 0.5) {
      document.documentElement.classList.add('zoom-50');
    } else if (zoomLevel <= 0.75) {
      document.documentElement.classList.add('zoom-75');
    } else {
      document.documentElement.classList.add('zoom-100');
    }

    const timer = setTimeout(() => {
      adjustTimelineMarkers();
      redrawConnections();
    }, 100);
    return () => clearTimeout(timer);
  }, [familyData.generations, familyData.settings.zoomLevel, zoomLevel, adjustTimelineMarkers, redrawConnections]);

  const handleMemberClick = (member: Member, genId: number) => {
    setEditModal({ isOpen: true, member, genId });
  };

  const handleAddMember = (genId: number) => {
    setEditModal({ isOpen: true, member: null, genId });
  };

  const handleEditGenerationName = (genId: number) => {
    const gen = familyData.generations.find(g => g.id === genId);
    if (!gen) return;

    const newName = prompt('请输入新的辈分名称：', gen.name);
    if (newName?.trim()) {
      updateGenerationName(genId, newName.trim());
    }
  };

  const handleAddGeneration = (atTop = false) => {
    // Use setTimeout to avoid React event handling conflicts that cause flash
    setTimeout(() => {
      const name = window.prompt(
        atTop
          ? '请输入这一代的名称（如：高祖辈、天祖辈）：'
          : '请输入这一代的名称（如：子辈、孙辈）：'
      );
      if (name?.trim()) {
        addGeneration(name.trim(), atTop);
      }
    }, 10);
  };

  const handleSaveMember = (memberData: Omit<Member, 'id'> | Member) => {
    // Fix: genId can be 0 for the first generation, so we need explicit null check
    if (editModal.genId === null || editModal.genId === undefined) return;

    if ('id' in memberData && memberData.id) {
      updateMember(editModal.genId, memberData.id, memberData);
    } else {
      addMember(editModal.genId, memberData as Omit<Member, 'id'>);
    }

    setEditModal({ isOpen: false, member: null, genId: null });
  };

  const handleDeleteMember = () => {
    if (!editModal.member || editModal.genId === null || editModal.genId === undefined) return;

    // Use setTimeout to avoid React event handling conflicts
    setTimeout(() => {
      if (window.confirm('确定要删除此成员吗？')) {
        deleteMember(editModal.genId!, editModal.member!.id);
        setEditModal({ isOpen: false, member: null, genId: null });
      }
    }, 10);
  };

  const handleViewDetail = (member: Member) => {
    setDetailModal({ isOpen: true, member, genId: editModal.genId, initialTab: 'album' });
  };

  const handleOpenAlbum = (member: Member, genId: number) => {
    setDetailModal({ isOpen: true, member, genId, initialTab: 'album' });
  };

  const handleOpenStories = (member: Member, genId: number) => {
    setDetailModal({ isOpen: true, member, genId, initialTab: 'stories' });
  };

  const handleUpdateMemberFromDetail = (updatedMember: Member) => {
    if (!detailModal.genId) return;
    updateMember(detailModal.genId, updatedMember.id, updatedMember);
    setDetailModal(prev => ({ ...prev, member: updatedMember }));
  };

  const currentGeneration = editModal.genId
    ? familyData.generations.find(g => g.id === editModal.genId) || null
    : null;

  return (
    <div className={themeClass}>
      <BackgroundSlider images={familyData.settings.bgImages || familyData.settings.backgroundImages || []} />

      <SettingsPanel
        settings={familyData.settings}
        onUpdateSettings={updateSettings}
        onExport={exportData}
        onImport={importData}
      />

      {onBack && (
        <button className="back-button" onClick={onBack}>
          ← 返回
        </button>
      )}

      <header className="main-header">
        <h1
          className="family-title"
          contentEditable
          suppressContentEditableWarning
          onBlur={e => updateSettings({ familyName: e.currentTarget.textContent || '' })}
        >
          {familyData.settings.familyName}
        </h1>
        <p
          className="family-subtitle"
          contentEditable
          suppressContentEditableWarning
          onBlur={e => updateSettings({ subtitle: e.currentTarget.textContent || '' })}
        >
          {familyData.settings.subtitle}
        </p>
      </header>

      <button
        className="add-ancestor-btn"
        onClick={() => handleAddGeneration(true)}
      >
        + 添加更早的一代（往上追溯）
      </button>

      <div
        className="main-container"
        ref={containerRef}
        style={{}} /* 移除 transform scale，改用 CSS 变量 */
      >
        <Timeline
          generations={familyData.generations}
          onEditName={handleEditGenerationName}
          onDeleteGeneration={deleteGeneration}
        />

        <div className="family-content">
          {familyData.generations.map((gen, index) => {
            const parentGen = index > 0 ? familyData.generations[index - 1] : undefined;
            return (
              <GenerationRow
                key={gen.id}
                generation={gen}
                parentGenMembers={parentGen?.members}
                onMemberClick={handleMemberClick}
                onAddMember={handleAddMember}
                onScroll={redrawConnections}
                onOpenAlbum={handleOpenAlbum}
                onOpenStories={handleOpenStories}
                highlightedIds={highlightedAncestors}
                onTraceAncestors={handleTraceAncestors}
              />
            );
          })}
        </div>

        <ConnectionLines
          familyData={familyData}
          containerRef={containerRef}
        />
      </div>

      <button
        className="add-generation-btn"
        onClick={() => handleAddGeneration(false)}
      >
        + 添加新的一代
      </button>

      <button
        className={`connection-toggle ${familyData.settings.showConnections ? 'active' : ''}`}
        onClick={toggleConnections}
      >
        <span className="icon">🔗</span>
        <span>{familyData.settings.showConnections ? '显示血脉连线' : '隐藏血脉连线'}</span>
      </button>

      <div className="zoom-control">
        <span className="zoom-icon">🔍</span>
        <select
          value={zoomLevel}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className="zoom-select"
        >
          <option value={0.25}>25%</option>
          <option value={0.5}>50%</option>
          <option value={0.75}>75%</option>
          <option value={1}>100%</option>
          <option value={1.25}>125%</option>
          <option value={1.5}>150%</option>
        </select>
      </div>

      {selectedForTrace && (
        <button className="clear-highlight-btn" onClick={clearHighlight}>
          ✕ 清除血脉高亮
        </button>
      )}

      <EditModal
        isOpen={editModal.isOpen}
        member={editModal.member}
        generation={currentGeneration}
        generations={familyData.generations}
        onClose={() => setEditModal({ isOpen: false, member: null, genId: null })}
        onSave={handleSaveMember}
        onDelete={editModal.member ? handleDeleteMember : undefined}
        onViewDetail={handleViewDetail}
      />

      <MemberDetailModal
        isOpen={detailModal.isOpen}
        member={detailModal.member}
        onClose={() => setDetailModal({ isOpen: false, member: null, genId: null, initialTab: 'album' })}
        onUpdate={handleUpdateMemberFromDetail}
        initialTab={detailModal.initialTab}
      />
    </div>
  );
}
