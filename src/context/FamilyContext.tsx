'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { FamilyData, Member, Generation, Settings } from '@/types/family';
import { defaultData } from '@/lib/defaultData';
import { getSpouseIds } from '@/lib/utils';
import { familiesApi } from '@/lib/api';

interface FamilyContextType {
  familyData: FamilyData;
  isLoading: boolean;
  updateSettings: (settings: Partial<Settings>) => void;
  addGeneration: (name: string, atTop?: boolean) => void;
  updateGenerationName: (genId: number, name: string) => void;
  deleteGeneration: (genId: number) => Promise<boolean>;
  addMember: (genId: number, member: Omit<Member, 'id'>) => void;
  updateMember: (genId: number, memberId: number, member: Partial<Member>) => void;
  deleteMember: (genId: number, memberId: number) => void;
  exportData: () => void;
  importData: (data: FamilyData) => void;
  toggleConnections: () => void;
  saveToServer: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

interface FamilyProviderProps {
  children: ReactNode;
  familyId?: string; // If provided, load from API
}

// Convert API data to local format
function apiToLocal(apiData: any): FamilyData {
  // Sort generations by order
  const sortedGens = [...(apiData.generations || [])].sort((a: any, b: any) => a.order - b.order);

  // Build apiId -> localId mapping for relationship handling
  const apiIdToLocalId = new Map<string, number>();
  let localIdCounter = 1;

  // First pass: assign local IDs
  sortedGens.forEach((gen: any) => {
    (gen.members || []).forEach((m: any) => {
      apiIdToLocalId.set(m.id, localIdCounter++);
    });
  });

  const generations: Generation[] = sortedGens.map((gen: any, genIndex: number) => ({
    id: genIndex, // Use index as generation id for correct ordering
    name: gen.name,
    apiId: gen.id, // Store the real API id
    members: (gen.members || []).map((m: any) => {
      const localId = apiIdToLocalId.get(m.id) || localIdCounter++;
      return {
        id: localId,
        apiId: m.id,
        name: m.name,
        gender: m.gender || 'male',
        birthOrder: m.birthOrder,
        birthYear: m.birthYear,
        deathYear: m.deathYear,
        hometown: m.hometown,
        photo: m.photo,
        photoCrop: m.photoCrop,
        bio: m.bio,
        // Map API IDs to local IDs for relationships
        parentId: m.parentId ? (apiIdToLocalId.get(m.parentId) || null) : null,
        motherId: m.motherId ? (apiIdToLocalId.get(m.motherId) || null) : null,
        spouseIds: (m.spouseIds || []).map((sid: string) => apiIdToLocalId.get(sid)).filter(Boolean),
        albums: m.albums || [],
        stories: m.stories || [],
      };
    }),
  }));

  return {
    settings: {
      familyName: apiData.name || '家族',
      familySubtitle: apiData.subtitle || '',
      hometown: apiData.hometown || '',
      theme: apiData.theme || 'classic',
      showConnections: true,
      zoomLevel: 1,
      backgroundImages: apiData.bgImages || [],
    },
    generations,
    apiId: apiData.id,
  };
}

export function FamilyProvider({ children, familyId }: FamilyProviderProps) {
  const [familyData, setFamilyData] = useState<FamilyData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from API or localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      if (familyId) {
        // Load from API
        try {
          const apiData = await familiesApi.getOne(familyId);
          setFamilyData(apiToLocal(apiData));
        } catch (error) {
          console.error('Failed to load family from API:', error);
          // Fall back to default data
          setFamilyData(defaultData);
        }
      } else {
        // Load from localStorage (offline mode)
        const saved = localStorage.getItem('familyTreeData');
        if (saved) {
          try {
            setFamilyData(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to parse saved data:', e);
          }
        } else {
          // Try to load from JSON file
          try {
            const response = await fetch('/familyData.json');
            if (response.ok) {
              const jsonData = await response.json();
              if (jsonData.settings && jsonData.generations) {
                setFamilyData(jsonData);
              }
            }
          } catch (e) {
            console.error('Failed to load family data from JSON:', e);
          }
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [familyId]);

  // Save to localStorage when data changes (for offline mode)
  useEffect(() => {
    if (!isLoading && !familyId) {
      localStorage.setItem('familyTreeData', JSON.stringify(familyData));
    }
  }, [familyData, isLoading, familyId]);

  // Save to server
  const saveToServer = useCallback(async () => {
    if (!familyId || !familyData.apiId) return;

    try {
      await familiesApi.update(familyId, {
        name: familyData.settings.familyName,
        subtitle: familyData.settings.familySubtitle,
        hometown: familyData.settings.hometown,
        theme: familyData.settings.theme,
        bgImages: familyData.settings.backgroundImages,
        settings: {
          showConnections: familyData.settings.showConnections,
          zoomLevel: familyData.settings.zoomLevel,
        },
      });
    } catch (error) {
      console.error('Failed to save to server:', error);
    }
  }, [familyId, familyData]);

  const updateSettings = async (settings: Partial<Settings>) => {
    // Update local state immediately for better UX
    setFamilyData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));

    // Save to database if we have a familyId
    if (familyId) {
      try {
        await familiesApi.updateFamily(familyId, { settings: { ...familyData.settings, ...settings } });
      } catch (error) {
        console.error('Failed to save settings:', error);
        // Don't show alert for settings changes as they update frequently
      }
    }
  };

  const addGeneration = async (name: string, atTop = false) => {
    if (familyId) {
      // Add via API
      try {
        await familiesApi.addGeneration(familyId, { name, atTop });
        // Reload all data to ensure IDs and orders are synced
        const apiData = await familiesApi.getOne(familyId);
        setFamilyData(apiToLocal(apiData));
      } catch (error) {
        console.error('Failed to add generation:', error);
      }
    } else {
      // Local mode
      const newGen: Generation = {
        id: Date.now(),
        name,
        members: []
      };
      setFamilyData(prev => ({
        ...prev,
        generations: atTop
          ? [newGen, ...prev.generations]
          : [...prev.generations, newGen]
      }));
    }
  };

  const updateGenerationName = async (genId: number, name: string) => {
    const generation = familyData.generations.find(g => g.id === genId);
    if (!generation) {
      console.error('Generation not found for update:', genId);
      return;
    }

    if (familyId && generation.apiId) {
      try {
        // Update API
        await familiesApi.updateGeneration(generation.apiId, { name });

        // Update local state
        setFamilyData(prev => ({
          ...prev,
          generations: prev.generations.map(gen =>
            gen.id === genId ? { ...gen, name } : gen
          )
        }));
      } catch (error) {
        console.error('Failed to update generation name:', error);
        alert('保存失败，请重试');
      }
    } else {
      // Local mode
      setFamilyData(prev => ({
        ...prev,
        generations: prev.generations.map(gen =>
          gen.id === genId ? { ...gen, name } : gen
        )
      }));
    }
  };

  const deleteGeneration = async (genId: number): Promise<boolean> => {
    const generation = familyData.generations.find(g => g.id === genId);
    if (!generation) return false;

    // Check if generation has members
    if (generation.members && generation.members.length > 0) {
      alert(`无法删除"${generation.name}"：该代还有 ${generation.members.length} 位成员，请先删除所有成员。`);
      return false;
    }

    if (!window.confirm(`确定要删除"${generation.name}"吗？`)) {
      return false;
    }

    if (familyId && generation.apiId) {
      // Delete via API
      try {
        await familiesApi.deleteGeneration(generation.apiId);
        // Reload data
        const apiData = await familiesApi.getOne(familyId);
        setFamilyData(apiToLocal(apiData));
        return true;
      } catch (error) {
        console.error('Failed to delete generation:', error);
        alert('删除失败，请重试');
        return false;
      }
    } else {
      // Local mode
      setFamilyData(prev => ({
        ...prev,
        generations: prev.generations.filter(g => g.id !== genId)
      }));
      return true;
    }
  };

  const addMember = async (genId: number, member: Omit<Member, 'id'>) => {
    const generation = familyData.generations.find(g => g.id === genId);

    console.log('addMember called:', { genId, generation, familyId, apiId: generation?.apiId });

    // Helper to find API ID by local ID
    const findApiId = (localId: number | string | null | undefined): string | null => {
      if (!localId) return null;
      const searchId = Number(localId);
      for (const gen of familyData.generations) {
        const m = gen.members.find(mem => mem.id === searchId);
        if (m?.apiId) return m.apiId;
      }
      return null;
    };

    if (familyId && generation?.apiId) {
      // Add via API
      try {
        console.log('Adding member via API...');
        const newMember = await familiesApi.addMember(generation.apiId, {
          name: member.name,
          gender: member.gender,
          birthOrder: member.birthOrder,
          birthYear: member.birthYear,
          deathYear: member.deathYear,
          hometown: member.hometown,
          photo: member.photo,
          photoCrop: member.photoCrop,
          bio: member.bio,
          parentId: findApiId(member.parentId),
          motherId: findApiId(member.motherId),
          spouseIds: (member.spouseIds || []).map(sid => findApiId(sid)).filter(Boolean),
        });

        console.log('Member added successfully:', newMember);

        // Reload data to ensure consistency
        const apiData = await familiesApi.getOne(familyId);
        setFamilyData(apiToLocal(apiData));
      } catch (error) {
        console.error('Failed to add member:', error);
        alert('添加成员失败，请重试');
      }
    } else if (familyId && !generation?.apiId) {
      // Online mode but generation has no apiId - this shouldn't happen
      console.error('Cannot add member: generation has no apiId', { genId, generation });
      alert('添加成员失败：代信息不完整，请刷新页面后重试');
    } else {
      // Local mode
      const newId = Date.now();
      const newMember: Member = { ...member, id: newId };

      setFamilyData(prev => {
        const newGenerations = prev.generations.map(gen => {
          if (gen.id !== genId) return gen;

          const updatedMembers = [...gen.members, newMember];

          // Set reverse spouse relationship
          if (newMember.spouseIds && newMember.spouseIds.length > 0) {
            newMember.spouseIds.forEach(spouseId => {
              const spouse = updatedMembers.find(m => m.id === spouseId);
              if (spouse) {
                const spouseSpouseIds = getSpouseIds(spouse);
                if (!spouseSpouseIds.includes(newId)) {
                  spouse.spouseIds = [...spouseSpouseIds, newId];
                  delete spouse.spouseId;
                }
              }
            });
          }

          return { ...gen, members: updatedMembers };
        });

        return { ...prev, generations: newGenerations };
      });
    }
  };

  const updateMember = async (genId: number, memberId: number, updates: Partial<Member>) => {
    const generation = familyData.generations.find(g => g.id === genId);
    const member = generation?.members.find(m => m.id === memberId);

    if (familyId && member?.apiId) {
      // Convert local IDs to API IDs for server
      const apiUpdates: any = { ...updates };

      // Remove fields that backend doesn't accept
      delete apiUpdates.id;
      delete apiUpdates.apiId;

      // Helper to find API ID by local ID
      const findApiId = (localId: number | string | null | undefined): string | null => {
        if (!localId) return null;
        const searchId = Number(localId);
        for (const gen of familyData.generations) {
          const m = gen.members.find(mem => mem.id === searchId);
          if (m?.apiId) return m.apiId;
        }
        console.warn('findApiId: not found for localId', localId, 'searchId', searchId);
        return null;
      };

      // Convert parentId
      if (updates.parentId !== undefined) {
        apiUpdates.parentId = findApiId(updates.parentId);
      }
      // Convert motherId
      if (updates.motherId !== undefined) {
        apiUpdates.motherId = findApiId(updates.motherId);
      }
      // Convert spouseIds
      if (updates.spouseIds) {
        apiUpdates.spouseIds = updates.spouseIds
          .map(sid => findApiId(sid))
          .filter(Boolean);
      }

      // Debug log
      console.log('updateMember API call:', {
        memberId: member.apiId,
        updates,
        apiUpdates,
        familyId,
      });

      // Update via API
      try {
        await familiesApi.updateMember(member.apiId, apiUpdates);
        console.log('updateMember API success');
      } catch (error) {
        console.error('Failed to update member:', error);
      }
    } else {
      console.warn('updateMember skipped - no familyId or apiId', { familyId, memberApiId: member?.apiId });
    }

    // Update local state
    setFamilyData(prev => {
      const newGenerations = prev.generations.map(gen => {
        if (gen.id !== genId) return gen;

        const updatedMembers = gen.members.map(m => {
          if (m.id !== memberId) return m;

          const oldSpouseIds = getSpouseIds(m);
          const newSpouseIds = updates.spouseIds || oldSpouseIds;

          // Update spouse relationships
          oldSpouseIds.forEach(oldId => {
            if (!newSpouseIds.includes(oldId)) {
              const oldSpouse = gen.members.find(s => s.id === oldId);
              if (oldSpouse) {
                const spouseIds = getSpouseIds(oldSpouse);
                oldSpouse.spouseIds = spouseIds.filter(id => id !== memberId);
              }
            }
          });

          newSpouseIds.forEach(newId => {
            const newSpouse = gen.members.find(s => s.id === newId);
            if (newSpouse) {
              const spouseIds = getSpouseIds(newSpouse);
              if (!spouseIds.includes(memberId)) {
                newSpouse.spouseIds = [...spouseIds, memberId];
              }
            }
          });

          return { ...m, ...updates };
        });

        return { ...gen, members: updatedMembers };
      });

      return { ...prev, generations: newGenerations };
    });
  };

  const deleteMember = async (genId: number, memberId: number) => {
    const generation = familyData.generations.find(g => g.id === genId);
    const member = generation?.members.find(m => m.id === memberId);

    if (familyId && member?.apiId) {
      // Delete via API
      try {
        await familiesApi.deleteMember(member.apiId);
      } catch (error) {
        console.error('Failed to delete member:', error);
      }
    }

    setFamilyData(prev => ({
      ...prev,
      generations: prev.generations.map(gen =>
        gen.id === genId
          ? { ...gen, members: gen.members.filter(m => m.id !== memberId) }
          : gen
      )
    }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(familyData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${familyData.settings.familyName}_家族数据_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const importData = async (data: FamilyData) => {
    if (!data.settings || !data.generations) {
      alert('数据格式无效');
      return;
    }

    if (familyId) {
      // Online mode: save to database
      try {
        await familiesApi.import(familyId, data);
        // Reload data from server
        const apiData = await familiesApi.getOne(familyId);
        setFamilyData(apiToLocal(apiData));
        alert('数据导入成功！');
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('导入失败，请重试');
      }
    } else {
      // Offline mode: just update state
      setFamilyData(data);
      alert('数据导入成功！');
    }
  };

  const toggleConnections = () => {
    setFamilyData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        showConnections: !prev.settings.showConnections
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="family-loading">
        <div className="loading-spinner"></div>
        <p>加载族谱数据...</p>
      </div>
    );
  }

  return (
    <FamilyContext.Provider value={{
      familyData,
      isLoading,
      updateSettings,
      addGeneration,
      updateGenerationName,
      deleteGeneration,
      addMember,
      updateMember,
      deleteMember,
      exportData,
      importData,
      toggleConnections,
      saveToServer
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamilyData() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamilyData must be used within a FamilyProvider');
  }
  return context;
}
