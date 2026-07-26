import { useState } from 'react'
import { ProjectFollowUpModal } from './ProjectFollowUpModal'
import type { Project, ProjectStatus } from './types'
import { STATUS_LABELS } from './types'
import type { ProjectPatch } from './useProjects'
import {
  deadlineAlertClass,
  daysLeft,
  formatDeadline,
  formatRelativeTime,
  isOverdue,
  ownerInitials,
} from './utils'

type Props = {
  project: Project
  onUpdate: (id: string, patch: ProjectPatch) => void
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onUpdate, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showFollowUps, setShowFollowUps] = useState(false)
  const overdue = isOverdue(project)
  const left = daysLeft(project)
  const alertClass = deadlineAlertClass(project)
  const displayStatus = overdue && project.status !== 'completed' ? 'overdue' : project.status

  function deadlineHint() {
    if (left === null || project.status === 'completed') return null
    if (left < 0) return `已逾期 ${-left} 天`
    if (left === 0) return '今天截止'
    if (left === 1) return '还剩 1 天'
    if (left === 2) return '还剩 2 天'
    return null
  }

  const hint = deadlineHint()
  const completedFollowUps = project.followUps.filter(
    (item) => item.status === 'completed',
  ).length
  const latestFollowUp = [...project.followUps].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  )[0]

  return (
    <>
      <article className={`project-card status-${displayStatus} ${alertClass}`.trim()}>
      <div className="card-header">
        <h3 className="card-title" title={project.name}>
          {project.name}
        </h3>
        <div className="card-header-right">
          <span className={`status-badge badge-${displayStatus}`}>
            {overdue && project.status !== 'completed'
              ? '延期'
              : STATUS_LABELS[project.status]}
          </span>
          <div className="card-menu">
            <button
              type="button"
              className="icon-btn menu-trigger"
              aria-label="更多操作"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ···
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="menu-scrim"
                  aria-label="关闭菜单"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="menu-dropdown">
                  <label className="menu-row">
                    <span>状态</span>
                    <select
                      value={project.status}
                      onChange={(e) => {
                        onUpdate(project.id, {
                          status: e.target.value as ProjectStatus,
                        })
                        setMenuOpen(false)
                      }}
                    >
                      {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((key) => (
                        <option key={key} value={key}>
                          {STATUS_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="menu-row">
                    <span>进度</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={project.progress}
                      onChange={(e) =>
                        onUpdate(project.id, { progress: Number(e.target.value) })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="menu-action"
                    onClick={() => {
                      setShowFollowUps(true)
                      setMenuOpen(false)
                    }}
                  >
                    管理跟进记录
                  </button>
                  <button
                    type="button"
                    className="menu-danger"
                    onClick={() => {
                      onDelete(project.id)
                      setMenuOpen(false)
                    }}
                  >
                    删除项目
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

        <button
          type="button"
          className={`card-follow-summary ${project.followUps.length ? '' : 'is-empty'}`}
          onClick={() => setShowFollowUps(true)}
          aria-label={`管理${project.name}的跟进记录`}
        >
          <span className="card-follow-meta">
            <strong>{project.followUps.length} 条跟进</strong>
            <em>{completedFollowUps} 条已完成</em>
          </span>
          <span className="card-follow-latest">
            {latestFollowUp?.title || '暂无记录，点击添加第一条跟进'}
          </span>
        </button>

      <div className="card-footer">
        <div className="card-meta-row">
          <span
            className={`deadline ${overdue ? 'is-overdue' : ''} ${alertClass ? 'has-alert' : ''}`}
          >
            截止：{formatDeadline(project.deadline)}
            {hint && <em className="deadline-hint">{hint}</em>}
          </span>
          <div className="owner-chip" title={project.owner}>
            <span className="owner-avatar">{ownerInitials(project.owner)}</span>
            <span className="owner-name">{project.owner}</span>
          </div>
        </div>

        <div className="progress-row">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="progress-pct">{project.progress}%</span>
        </div>

        <div className="card-updated">更新于 {formatRelativeTime(project.updatedAt)}</div>
      </div>
      </article>

      {showFollowUps && (
        <ProjectFollowUpModal
          project={project}
          onUpdate={onUpdate}
          onClose={() => setShowFollowUps(false)}
        />
      )}
    </>
  )
}
