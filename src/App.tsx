import { useMemo, useState } from 'react'
import { isAuthenticated, Login } from './Login'
import { ProjectCard } from './ProjectCard'
import { ProjectFollowUpModal } from './ProjectFollowUpModal'
import { ProjectForm } from './ProjectForm'
import type { FilterKey, SortKey } from './types'
import { useProjects } from './useProjects'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'paused', label: '已暂停' },
  { key: 'overdue', label: '延期' },
  { key: 'completed', label: '已完成' },
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'updated', label: '最近更新' },
  { key: 'deadline', label: '截止日期' },
  { key: 'progress', label: '进度' },
]

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const {
    projects,
    stats,
    syncStatus,
    syncError,
    addProject,
    updateProject,
    deleteProject,
    queryProjects,
  } = useProjects()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('updated')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [followUpProjectId, setFollowUpProjectId] = useState<string | null>(null)

  const list = useMemo(
    () => queryProjects({ filter, sort, search }),
    [queryProjects, filter, sort, search],
  )
  const followUpProject =
    projects.find((project) => project.id === followUpProjectId) ?? null

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="app">
      {syncError && (
        <div className="sync-banner" role="status">
          {syncError}
          {syncStatus === 'syncing' ? '（重试中…）' : ''}
        </div>
      )}
      <header className="topbar">
        <div className="shell topbar-inner">
          <div className="brand-block">
            <span className="logo-mark" aria-hidden="true" />
            <span className="brand-name">轻量化项目管理</span>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="搜索项目、负责人…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <button
              type="button"
              className="btn primary compact"
              onClick={() => setShowForm(true)}
            >
              <span className="plus">+</span>
              新建项目
            </button>

            <button type="button" className="icon-chip" aria-label="设置" title="设置">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M19.4 13.2a1.4 1.4 0 0 0 .3 1.5l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-1.5-.3 1.4 1.4 0 0 0-.8 1.3V18a1.7 1.7 0 1 1-3.4 0v-.1a1.4 1.4 0 0 0-.9-1.3 1.4 1.4 0 0 0-1.5.3l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0 .3-1.5 1.4 1.4 0 0 0-1.3-.8H6a1.7 1.7 0 1 1 0-3.4h.1a1.4 1.4 0 0 0 1.3-.9 1.4 1.4 0 0 0-.3-1.5l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 1.5.3h.1a1.4 1.4 0 0 0 .8-1.3V6a1.7 1.7 0 1 1 3.4 0v.1a1.4 1.4 0 0 0 .8 1.3 1.4 1.4 0 0 0 1.5-.3l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0-.3 1.5v.1a1.4 1.4 0 0 0 1.3.8H18a1.7 1.7 0 1 1 0 3.4h-.1a1.4 1.4 0 0 0-1.3.8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>

            <button type="button" className="user-avatar" aria-label="用户" title="我">
              我
            </button>
          </div>
        </div>
      </header>

      <main className="shell page">
        <section className="page-intro fade-in">
          <div>
            <h1>轻量化项目管理</h1>
            <p>让每个项目状态清晰可见</p>
          </div>
        </section>

        <section className="dashboard fade-in delay-1" aria-label="项目概览">
          <article className="stat-card">
            <span className="stat-label">进行中</span>
            <strong className="stat-value">{stats.active}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">已完成</span>
            <strong className="stat-value">{stats.completed}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">即将截止</span>
            <strong className="stat-value accent">{stats.dueSoon}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">总进度</span>
            <strong className="stat-value">{stats.avgProgress}%</strong>
            <div className="stat-bar">
              <div style={{ width: `${stats.avgProgress}%` }} />
            </div>
          </article>
        </section>

        <section className="list-section fade-in delay-2">
          <div className="toolbar">
            <div className="filter-group" role="tablist" aria-label="项目过滤">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.key}
                  className={filter === item.key ? 'chip active' : 'chip'}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="sort-control">
              <span>排序</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                {SORTS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {list.length === 0 ? (
            <div className="empty">
              <p className="empty-title">没有匹配的项目</p>
              <p className="empty-sub">调整筛选条件，或新建一个项目开始推进。</p>
              <button
                type="button"
                className="btn primary compact"
                onClick={() => setShowForm(true)}
              >
                + 新建项目
              </button>
            </div>
          ) : (
            <div className="project-grid">
              {list.map((project, i) => (
                <div
                  key={project.id}
                  className="card-enter"
                  style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                >
                  <ProjectCard
                    project={project}
                    onUpdate={updateProject}
                    onDelete={deleteProject}
                    onOpenFollowUps={() => setFollowUpProjectId(project.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <ProjectForm onSubmit={addProject} onClose={() => setShowForm(false)} />
      )}

      {followUpProject && (
        <ProjectFollowUpModal
          project={followUpProject}
          onUpdate={updateProject}
          onClose={() => setFollowUpProjectId(null)}
        />
      )}
    </div>
  )
}
