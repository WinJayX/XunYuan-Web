'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { familiesApi } from '@/lib/api';
import EditModal from '@/components/genealogy/EditModal';
import BiographyEditor from '@/components/genealogy/BiographyEditor';
import { defaultGenealogyContent } from '@/lib/defaultGenealogyContent';
import '@/components/genealogy/genealogy.css';

interface FamilyData {
  id: string;
  name: string;
  subtitle?: string;
  compilers?: string[];
  preface?: {
    序言?: string;
    修谱目的?: string;
    族规?: string;
    家训?: string;
  };
  ancestorOrigin?: {
    姓氏渊源?: string;
    祖德传略?: string;
  };
  generationPlan?: any;
  biographies?: Array<{
    姓名: string;
    关系: string;
    出生年份?: number;
    简介: string;
  }>;
  appendix?: string;
  postscript?: string;
}

export default function GenealogyPage() {
  const router = useRouter();
  const params = useParams();
  const familyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    field: string;
  } | null>(null);
  const [biographyEditorOpen, setBiographyEditorOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalGenerations: 0,
    maleCount: 0,
    femaleCount: 0,
  });

  // Load family data
  useEffect(() => {
    loadFamilyData();
  }, [familyId]);

  const loadFamilyData = async () => {
    try {
      const data = await familiesApi.getOne(familyId);
      setFamilyData(data);

      // Calculate stats from generations and members
      if (data.generations) {
        const totalGenerations = data.generations.length;
        let totalMembers = 0;
        let maleCount = 0;
        let femaleCount = 0;

        data.generations.forEach((gen: any) => {
          if (gen.members) {
            totalMembers += gen.members.length;
            gen.members.forEach((member: any) => {
              if (member.gender === 'male') maleCount++;
              if (member.gender === 'female') femaleCount++;
            });
          }
        });

        setStats({ totalMembers, totalGenerations, maleCount, femaleCount });
      }
    } catch (error) {
      console.error('Failed to load family data:', error);
      alert('加载家谱数据失败');
    } finally {
      setLoading(false);
    }
  };

  const showSection = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const jumpToMembers = () => {
    showSection('members');
  };

  // Open edit modal
  const openEditModal = (title: string, content: string, field: string) => {
    setEditModal({ isOpen: true, title, content, field });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditModal(null);
  };

  // Save content
  const saveContent = async (newContent: string) => {
    if (!editModal || !familyData) return;

    const field = editModal.field;
    const updateData: any = {};

    // Parse field path (e.g., "pre face.序言" or "appendix")
    if (field.includes('.')) {
      const [section, subsection] = field.split('.');
      updateData[section] = {
        ...familyData[section as keyof FamilyData],
        [subsection]: newContent,
      };
    } else {
      // Handle array fields (compilers) - split by newline
      if (field === 'compilers') {
        updateData[field] = newContent.split('\n').filter(line => line.trim());
      } else {
        updateData[field] = newContent;
      }
    }

    try {
      await familiesApi.updateGenealogyContent(familyId, updateData);
      await loadFamilyData();
      alert('保存成功');
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  };

  // Save biographies
  const saveBiographies = async (biographies: any[]) => {
    await familiesApi.updateGenealogyContent(familyId, { biographies });
    await loadFamilyData();
  };

  // Load default content
  const loadDefaultContent = async () => {
    if (!confirm('确定要加载默认文案吗？这将替换当前内容。')) return;

    try {
      await familiesApi.updateGenealogyContent(familyId, defaultGenealogyContent);
      await loadFamilyData();
      alert('默认文案加载成功');
    } catch (error) {
      console.error('Failed to load default content:', error);
      alert('加载失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="genealogy-loading">
        <div className="loading-spinner"></div>
        <p>正在加载家谱...</p>
      </div>
    );
  }

  if (!familyData) {
    return (
      <div className="genealogy-loading">
        <p>未找到家谱数据</p>
        <button onClick={() => router.back()} className="back-button">
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="genealogy-container">
      <div className="genealogy-wrapper">
        {/* Header */}
        <div className="genealogy-header">
          <button className="back-button" onClick={() => router.back()}>
            ← 返回
          </button>
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newName = e.currentTarget.textContent || '';
              if (newName !== familyData.name) {
                familiesApi.updateFamily(familyId, { name: newName });
                setFamilyData({ ...familyData, name: newName });
              }
            }}
          >
            {familyData.name}
          </h1>
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newSubtitle = e.currentTarget.textContent || '';
              if (newSubtitle !== familyData.subtitle) {
                familiesApi.updateFamily(familyId, { subtitle: newSubtitle });
                setFamilyData({ ...familyData, subtitle: newSubtitle });
              }
            }}
          >
            {familyData.subtitle || '传承家族文化，记录家族历史'}
          </p>
          <button className="load-default-btn" onClick={loadDefaultContent}>
            📝 加载示例文案
          </button>
        </div>

        {/* Navigation */}
        <div className="genealogy-nav">
          <button
            className={activeSection === 'compilers' ? 'active' : ''}
            onClick={() => showSection('compilers')}
          >
            修谱名录
          </button>
          <button
            className={activeSection === 'preface' ? 'active' : ''}
            onClick={() => showSection('preface')}
          >
            谱首
          </button>
          <button
            className={activeSection === 'ancestors' ? 'active' : ''}
            onClick={() => showSection('ancestors')}
          >
            先祖溯源
          </button>
          <button
            className={activeSection === 'generation' ? 'active' : ''}
            onClick={() => showSection('generation')}
          >
            字辈谱序
          </button>
          <button
            className={activeSection === 'overview' ? 'active' : ''}
            onClick={() => showSection('overview')}
          >
            数据概览
          </button>
          <button
            className={activeSection === 'genealogy' ? 'active' : ''}
            onClick={() => showSection('genealogy')}
          >
            世系图谱
          </button>
          <button
            className={activeSection === 'members' ? 'active' : ''}
            onClick={() => showSection('members')}
          >
            家族成员
          </button>
          <button
            className={activeSection === 'biographies' ? 'active' : ''}
            onClick={() => showSection('biographies')}
          >
            族人传略
          </button>
          <button
            className={activeSection === 'appendix' ? 'active' : ''}
            onClick={() => showSection('appendix')}
          >
            附录
          </button>
          <button
            className={activeSection === 'epilogue' ? 'active' : ''}
            onClick={() => showSection('epilogue')}
          >
            跋
          </button>
        </div>

        {/* Content */}
        <div className="genealogy-content">
          {/* 数据概览 */}
          <div
            id="overview"
            className={`genealogy-section ${activeSection === 'overview' ? 'active' : ''}`}
          >
            <h2>数据概览</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalMembers}</div>
                <div className="stat-label">家族成员</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalGenerations}</div>
                <div className="stat-label">世代传承</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.maleCount}</div>
                <div className="stat-label">男性成员</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.femaleCount}</div>
                <div className="stat-label">女性成员</div>
              </div>
            </div>
            <div className="content-block">
              <p>
                此处将展示家族的统计数据，包括成员总数、世代数量、男女比例等信息。
                数据将从家族成员信息中自动计算生成。
              </p>
            </div>
          </div>

          {/* 世系图谱 */}
          <div
            id="genealogy"
            className={`genealogy-section ${activeSection === 'genealogy' ? 'active' : ''}`}
          >
            <h2>世系图谱</h2>
            <button className="jump-to-members-btn" onClick={jumpToMembers}>
              📋 查看成员卡片
            </button>
            <div className="content-block">
              <p>
                此处将展示家族世系图谱，以树状结构展示家族各代成员的关系。
                您可以点击上方按钮跳转到成员卡片页面查看详细信息。
              </p>
            </div>
          </div>

          {/* 家族成员 */}
          <div
            id="members"
            className={`genealogy-section ${activeSection === 'members' ? 'active' : ''}`}
          >
            <h2>家族成员</h2>
            <div className="content-block">
              <p>
                此处将展示家族成员卡片，包含每位成员的基本信息、照片、生平简介等。
                成员信息以卡片形式展示，方便浏览和查找。
              </p>
            </div>
          </div>

          {/* 修谱名录 */}
          <div
            id="compilers"
            className={`genealogy-section ${activeSection === 'compilers' ? 'active' : ''}`}
          >
            <div className="section-header">
              <h2>修谱名录</h2>
              <button
                className="btn-edit"
                onClick={() =>
                  openEditModal(
                    '编辑修谱名录',
                    familyData.compilers?.join('\n') || '',
                    'compilers'
                  )
                }
              >
                ✏️ 编辑
              </button>
            </div>
            {familyData.compilers && familyData.compilers.length > 0 ? (
              <div className="content-block">
                <ul className="content-list">
                  {familyData.compilers.map((compiler, index) => (
                    <li key={index}>{compiler}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="content-block">
                <p>暫无修谱名录信息，请点击编辑按钮添加内容。</p>
              </div>
            )}
          </div>

          {/* 谱首 */}
          <div
            id="preface"
            className={`genealogy-section ${activeSection === 'preface' ? 'active' : ''}`}
          >
            <h2>谱首</h2>
            {['序言', '修谱目的', '族规', '家训'].map((key) => (
              <div key={key}>
                <div className="section-header">
                  <h3>{key}</h3>
                  <button
                    className="btn-edit"
                    onClick={() =>
                      openEditModal(
                        `编辑${key}`,
                        familyData.preface?.[key as keyof typeof familyData.preface] || '',
                        `preface.${key}`
                      )
                    }
                  >
                    ✏️ 编辑
                  </button>
                </div>
                {familyData.preface?.[key as keyof typeof familyData.preface] ? (
                  <div className="content-block">
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                      {familyData.preface[key as keyof typeof familyData.preface]}
                    </p>
                  </div>
                ) : (
                  <div className="content-block">
                    <p>暂无{key}内容，请点击编辑按钮添加。</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 先祖溯源 */}
          <div
            id="ancestors"
            className={`genealogy-section ${activeSection === 'ancestors' ? 'active' : ''}`}
          >
            <h2>先祖溯源</h2>
            {['姓氏渊源', '祖德传略'].map((key) => (
              <div key={key}>
                <div className="section-header">
                  <h3>{key}</h3>
                  <button
                    className="btn-edit"
                    onClick={() =>
                      openEditModal(
                        `编辑${key}`,
                        familyData.ancestorOrigin?.[
                        key as keyof typeof familyData.ancestorOrigin
                        ] || '',
                        `ancestorOrigin.${key}`
                      )
                    }
                  >
                    ✏️ 编辑
                  </button>
                </div>
                {familyData.ancestorOrigin?.[key as keyof typeof familyData.ancestorOrigin] ? (
                  <div className="content-block">
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                      {familyData.ancestorOrigin[key as keyof typeof familyData.ancestorOrigin]}
                    </p>
                  </div>
                ) : (
                  <div className="content-block">
                    <p>暂无{key}内容，请点击编辑按钮添加。</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 字辈谱序 */}
          <div
            id="generation"
            className={`genealogy-section ${activeSection === 'generation' ? 'active' : ''}`}
          >
            <div className="section-header">
              <h2>字辈谱序</h2>
              <button
                className="btn-edit"
                onClick={() =>
                  openEditModal(
                    '编辑字辈谱序',
                    typeof familyData.generationPlan === 'string'
                      ? familyData.generationPlan
                      : JSON.stringify(familyData.generationPlan || '', null, 2),
                    'generationPlan'
                  )
                }
              >
                ✏️ 编辑
              </button>
            </div>
            {familyData.generationPlan ? (
              <div className="content-block">
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {typeof familyData.generationPlan === 'string'
                    ? familyData.generationPlan
                    : JSON.stringify(familyData.generationPlan, null, 2)}
                </p>
              </div>
            ) : (
              <div className="content-block">
                <p>暂无字辈谱序信息，请点击编辑按钮添加。</p>
              </div>
            )}
          </div>

          {/* 族人传略 */}
          <div
            id="biographies"
            className={`genealogy-section ${activeSection === 'biographies' ? 'active' : ''}`}
          >
            <div className="section-header"><h2>族人传略</h2><button className="btn-edit" onClick={() => setBiographyEditorOpen(true)}>✏️ 编辑</button></div>
            {familyData.biographies && familyData.biographies.length > 0 ? (
              <>
                {familyData.biographies.map((bio, index) => (
                  <div key={index} className="content-block">
                    <h3>
                      {bio.姓名}
                      {bio.出生年份 && ` (${bio.出生年份}年生)`}
                    </h3>
                    <p style={{ color: '#888', fontSize: '0.9em', marginBottom: '10px' }}>
                      {bio.关系}
                    </p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{bio.简介}</p>
                  </div>
                ))}
              </>
            ) : (
              <div className="content-block">
                <p>暂无族人传略信息</p>
              </div>
            )}
          </div>

          {/* 附录 */}
          <div
            id="appendix"
            className={`genealogy-section ${activeSection === 'appendix' ? 'active' : ''}`}
          >
            <div className="section-header">
              <h2>附录</h2>
              <button
                className="btn-edit"
                onClick={() =>
                  openEditModal('编辑附录', familyData.appendix || '', 'appendix')
                }
              >
                ✏️ 编辑
              </button>
            </div>
            {familyData.appendix ? (
              <div className="content-block">
                <p style={{ whiteSpace: 'pre-wrap' }}>{familyData.appendix}</p>
              </div>
            ) : (
              <div className="content-block">
                <p>暂无附录信息，请点击编辑按钮添加。</p>
              </div>
            )}
          </div>

          {/* 跋 */}
          <div
            id="epilogue"
            className={`genealogy-section ${activeSection === 'epilogue' ? 'active' : ''}`}
          >
            <div className="section-header">
              <h2>跋</h2>
              <button
                className="btn-edit"
                onClick={() =>
                  openEditModal('编辑跋', familyData.postscript || '', 'postscript')
                }
              >
                ✏️ 编辑
              </button>
            </div>
            {familyData.postscript ? (
              <div className="content-block">
                <p style={{ whiteSpace: 'pre-wrap' }}>{familyData.postscript}</p>
              </div>
            ) : (
              <div className="content-block">
                <p>暂无跋文信息，请点击编辑按钮添加。</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal?.isOpen && (
        <EditModal
          title={editModal.title}
          content={editModal.content}
          onSave={saveContent}
          onClose={closeEditModal}
        />
      )}

      {/* Biography Editor */}
      {biographyEditorOpen && familyData && (
        <BiographyEditor
          biographies={familyData.biographies || []}
          onSave={saveBiographies}
          onClose={() => setBiographyEditorOpen(false)}
        />
      )}
    </div>
  );
}
