import { useEffect, useState, type FormEvent } from 'react'
import type {
  FollowUpRecord,
  FollowUpStatus,
  Project,
} from './types'
import { FOLLOW_UP_STATUS_LABELS } from './types'
import type { ProjectPatch } from './useProjects'

type Props = {
  project: Project
  onUpdate: (id: string, patch: ProjectPatch) => void
  onClose: () => void
}

type RecordDraft = Pick<
  FollowUpRecord,
  'title' | 'status' | 'owner' | 'deadline' | 'notes'
>

function emptyDraft(project: Project): RecordDraft {
  return {
    title: '',
    status: 'pending',
    owner: project.owner === '未指定' ? '' : project.owner,
    deadline: project.deadline,
    notes: '',
  }
}

function toDraft(record: FollowUpRecord): RecordDraft {
  return {
    title: record.title,
    status: record.status,
    owner: record.owner === '未指定' ? '' : record.owner,
    deadline: record.deadline,
    notes: record.notes,
  }
}

export function ProjectFollowUpModal({ project, onUpdate, onClose }: Props) {
  const [draft, setDraft] = useState<RecordDraft>(() => emptyDraft(project))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<RecordDraft>(() => emptyDraft(project))
  const completedCount = project.followUps.filter(
    (item) => item.status === 'completed',
  ).length

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function saveFollowUps(next: FollowUpRecord[]) {
    onUpdate(project.id, {
      followUps: next,
      description: next[0]?.title ?? '',
    })
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    const now = Date.now()
    const record: FollowUpRecord = {
      id: crypto.randomUUID(),
      title,
      status: draft.status,
      owner: draft.owner.trim() || '未指定',
      deadline: draft.deadline,
      notes: draft.notes.trim(),
      createdAt: now,
      updatedAt: now,
    }
    saveFollowUps([record, ...project.followUps])
    setDraft(emptyDraft(project))
  }

  function startEdit(record: FollowUpRecord) {
    setEditingId(record.id)
    setEditDraft(toDraft(record))
  }

  function saveEdit(record: FollowUpRecord) {
    const title = editDraft.title.trim()
    if (!title) return
    saveFollowUps(
      project.followUps.map((item) =>
        item.id === record.id
          ? {
              ...item,
              title,
              status: editDraft.status,
              owner: editDraft.owner.trim() || '未指定',
              deadline: editDraft.deadline,
              notes: editDraft.notes.trim(),
              updatedAt: Date.now(),
            }
          : item,
      ),
    )
    setEditingId(null)
  }

  function updateStatus(record: FollowUpRecord, status: FollowUpStatus) {
    saveFollowUps(
      project.followUps.map((item) =>
        item.id === record.id
          ? { ...item, status, updatedAt: Date.now() }
          : item,
      ),
    )
  }

  function deleteRecord(record: FollowUpRecord) {
    if (!window.confirm(`确认删除跟进事项“${record.title}”吗？`)) return
    saveFollowUps(project.followUps.filter((item) => item.id !== record.id))
  }

  return (
    <div className="modal-backdrop follow-up-backdrop" onClick={onClose}>
      <section
        className="follow-up-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-up-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="follow-up-header">
          <div>
            <p className="follow-up-eyebrow">项目跟进管理</p>
            <h2 id="follow-up-title">{project.name}</h2>
            <p className="modal-sub">
              共 {project.followUps.length} 项，已完成 {completedCount} 项
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <form className="follow-up-add" onSubmit={handleAdd}>
          <div className="follow-up-add-heading">
            <strong>添加跟进事项</strong>
            <span>填写后将自动同步到云端</span>
          </div>
          <div className="follow-up-add-grid">
            <label className="follow-field follow-title-field">
              <span>事项</span>
              <input
                required
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                placeholder="例如：完成下载功能联调"
              />
            </label>
            <label className="follow-field">
              <span>状态</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    status: event.target.value as FollowUpStatus,
                  })
                }
              >
                {(Object.keys(FOLLOW_UP_STATUS_LABELS) as FollowUpStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {FOLLOW_UP_STATUS_LABELS[status]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="follow-field">
              <span>负责人</span>
              <input
                value={draft.owner}
                onChange={(event) =>
                  setDraft({ ...draft, owner: event.target.value })
                }
                placeholder="姓名"
              />
            </label>
            <label className="follow-field">
              <span>截止日期</span>
              <input
                type="date"
                value={draft.deadline}
                onChange={(event) =>
                  setDraft({ ...draft, deadline: event.target.value })
                }
              />
            </label>
            <label className="follow-field follow-notes-field">
              <span>备注</span>
              <input
                value={draft.notes}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
                placeholder="补充要求、结果或下一步"
              />
            </label>
            <button type="submit" className="btn primary follow-add-button">
              + 添加
            </button>
          </div>
        </form>

        <div className="follow-up-table-wrap">
          {project.followUps.length === 0 ? (
            <div className="follow-up-empty">
              <strong>还没有跟进记录</strong>
              <span>在上方填写第一条事项，项目进展会更清晰。</span>
            </div>
          ) : (
            <table className="follow-up-table">
              <thead>
                <tr>
                  <th>事项</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>截止日期</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {project.followUps.map((record) => {
                  const editing = editingId === record.id
                  return (
                    <tr key={record.id}>
                      <td data-label="事项">
                        {editing ? (
                          <input
                            className="follow-table-input"
                            value={editDraft.title}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                title: event.target.value,
                              })
                            }
                          />
                        ) : (
                          <strong className="follow-record-title">
                            {record.title}
                          </strong>
                        )}
                      </td>
                      <td data-label="状态">
                        <select
                          className={`follow-status status-${editing ? editDraft.status : record.status}`}
                          value={editing ? editDraft.status : record.status}
                          onChange={(event) => {
                            const status = event.target.value as FollowUpStatus
                            if (editing) {
                              setEditDraft({ ...editDraft, status })
                            } else {
                              updateStatus(record, status)
                            }
                          }}
                        >
                          {(
                            Object.keys(FOLLOW_UP_STATUS_LABELS) as FollowUpStatus[]
                          ).map((status) => (
                            <option key={status} value={status}>
                              {FOLLOW_UP_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="负责人">
                        {editing ? (
                          <input
                            className="follow-table-input"
                            value={editDraft.owner}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                owner: event.target.value,
                              })
                            }
                          />
                        ) : (
                          record.owner
                        )}
                      </td>
                      <td data-label="截止日期">
                        {editing ? (
                          <input
                            className="follow-table-input"
                            type="date"
                            value={editDraft.deadline}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                deadline: event.target.value,
                              })
                            }
                          />
                        ) : (
                          record.deadline || '—'
                        )}
                      </td>
                      <td data-label="备注">
                        {editing ? (
                          <input
                            className="follow-table-input"
                            value={editDraft.notes}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                notes: event.target.value,
                              })
                            }
                          />
                        ) : (
                          <span className="follow-record-notes">
                            {record.notes || '—'}
                          </span>
                        )}
                      </td>
                      <td data-label="操作">
                        <div className="follow-actions">
                          {editing ? (
                            <>
                              <button
                                type="button"
                                className="follow-action save"
                                onClick={() => saveEdit(record)}
                              >
                                保存
                              </button>
                              <button
                                type="button"
                                className="follow-action"
                                onClick={() => setEditingId(null)}
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="follow-action"
                                onClick={() => startEdit(record)}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="follow-action danger"
                                onClick={() => deleteRecord(record)}
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
