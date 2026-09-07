import { useEffect, useState, type FormEvent } from 'react'
import type {
  FollowUpAttachment,
  FollowUpRecord,
  FollowUpStatus,
  Project,
} from './types'
import { FOLLOW_UP_STATUS_LABELS } from './types'
import type { ProjectPatch } from './useProjects'
import { inferAttachmentName, normalizeAttachmentUrl } from './utils'

type Props = {
  project: Project
  onUpdate: (id: string, patch: ProjectPatch) => void
  onClose: () => void
}

type RecordDraft = Pick<
  FollowUpRecord,
  'title' | 'status' | 'owner' | 'deadline' | 'notes' | 'attachments'
>

type AttachmentDraft = {
  name: string
  url: string
}

function emptyDraft(project: Project): RecordDraft {
  return {
    title: '',
    status: 'pending',
    owner: project.owner === '未指定' ? '' : project.owner,
    deadline: project.deadline,
    notes: '',
    attachments: [],
  }
}

function toDraft(record: FollowUpRecord): RecordDraft {
  return {
    title: record.title,
    status: record.status,
    owner: record.owner === '未指定' ? '' : record.owner,
    deadline: record.deadline,
    notes: record.notes,
    attachments: [...(record.attachments ?? [])],
  }
}

function emptyAttachmentDraft(): AttachmentDraft {
  return { name: '', url: '' }
}

function tryBuildAttachment(
  source: AttachmentDraft,
  options?: { silentEmpty?: boolean },
): FollowUpAttachment | null {
  if (!source.url.trim()) {
    if (!options?.silentEmpty) {
      window.alert('请输入有效的附件链接（以 http:// 或 https:// 开头）')
    }
    return null
  }
  const url = normalizeAttachmentUrl(source.url)
  if (!url) {
    window.alert('请输入有效的附件链接（以 http:// 或 https:// 开头）')
    return null
  }
  return {
    id: crypto.randomUUID(),
    name: source.name.trim() || inferAttachmentName(url),
    url,
  }
}

function mergeAttachment(
  list: FollowUpAttachment[],
  attachment: FollowUpAttachment,
): FollowUpAttachment[] {
  if (list.some((item) => item.url === attachment.url)) return list
  return [...list, attachment]
}

/** 保存前把输入框里未点「添加附件」的链接一并写入 */
function flushPendingAttachments(
  list: FollowUpAttachment[],
  ...sources: AttachmentDraft[]
): FollowUpAttachment[] | null {
  let next = [...list]
  for (const source of sources) {
    if (!source.url.trim()) continue
    const attachment = tryBuildAttachment(source)
    if (!attachment) return null
    next = mergeAttachment(next, attachment)
  }
  return next
}

function AttachmentList({
  items,
  onRemove,
}: {
  items: FollowUpAttachment[]
  onRemove?: (id: string) => void
}) {
  if (items.length === 0) return null
  return (
    <ul className="attach-list">
      {items.map((item) => (
        <li key={item.id} className="attach-item">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.url}
          >
            {item.name}
          </a>
          {onRemove && (
            <button
              type="button"
              className="attach-remove"
              onClick={() => onRemove(item.id)}
              aria-label={`移除附件 ${item.name}`}
            >
              移除
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

function AttachmentComposer({
  draft,
  onChange,
  onAdd,
  hint,
}: {
  draft: AttachmentDraft
  onChange: (next: AttachmentDraft) => void
  onAdd: () => void
  hint?: string
}) {
  return (
    <div className="attach-composer-wrap">
      {hint && <p className="attach-hint">{hint}</p>}
      <div className="attach-composer">
        <input
          className="follow-table-input"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="附件名称（可留空自动识别）"
          aria-label="附件名称"
        />
        <input
          className="follow-table-input"
          value={draft.url}
          onChange={(event) => onChange({ ...draft, url: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onAdd()
            }
          }}
          placeholder="https:// 文档链接"
          aria-label="附件链接"
        />
        <button type="button" className="btn ghost attach-add-btn" onClick={onAdd}>
          + 添加附件
        </button>
      </div>
    </div>
  )
}

export function ProjectFollowUpModal({ project, onUpdate, onClose }: Props) {
  const [draft, setDraft] = useState<RecordDraft>(() => emptyDraft(project))
  const [addAttach, setAddAttach] = useState<AttachmentDraft>(emptyAttachmentDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<RecordDraft>(() => emptyDraft(project))
  const [editAttach, setEditAttach] = useState<AttachmentDraft>(emptyAttachmentDraft)
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

  function appendToEditDraft(source: AttachmentDraft) {
    const attachment = tryBuildAttachment(source)
    if (!attachment) return
    setEditDraft((prev) => {
      if (prev.attachments.some((item) => item.url === attachment.url)) {
        window.alert('该附件已存在')
        return prev
      }
      return {
        ...prev,
        attachments: [...prev.attachments, attachment],
      }
    })
    setEditAttach(emptyAttachmentDraft())
    setAddAttach(emptyAttachmentDraft())
  }

  function appendToAddDraft(source: AttachmentDraft) {
    const attachment = tryBuildAttachment(source)
    if (!attachment) return
    setDraft((prev) => {
      if (prev.attachments.some((item) => item.url === attachment.url)) {
        window.alert('该附件已存在')
        return prev
      }
      return {
        ...prev,
        attachments: [...prev.attachments, attachment],
      }
    })
    setAddAttach(emptyAttachmentDraft())
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) return

    const attachments = flushPendingAttachments(draft.attachments, addAttach)
    if (!attachments) return

    const now = Date.now()
    const record: FollowUpRecord = {
      id: crypto.randomUUID(),
      title,
      status: draft.status,
      owner: draft.owner.trim() || '未指定',
      deadline: draft.deadline,
      notes: draft.notes.trim(),
      attachments,
      createdAt: now,
      updatedAt: now,
    }
    saveFollowUps([record, ...project.followUps])
    setDraft(emptyDraft(project))
    setAddAttach(emptyAttachmentDraft())
  }

  function startEdit(record: FollowUpRecord) {
    setEditingId(record.id)
    setEditDraft(toDraft(record))
    setEditAttach(emptyAttachmentDraft())
    setAddAttach(emptyAttachmentDraft())
  }

  function saveEdit(record: FollowUpRecord) {
    const title = editDraft.title.trim()
    if (!title) return

    // 编辑时顶部输入框、行内输入框里未点「添加」的链接，保存时一并写入
    const attachments = flushPendingAttachments(
      editDraft.attachments,
      editAttach,
      addAttach,
    )
    if (!attachments) return

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
              attachments,
              updatedAt: Date.now(),
            }
          : item,
      ),
    )
    setEditingId(null)
    setEditAttach(emptyAttachmentDraft())
    setAddAttach(emptyAttachmentDraft())
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
            <strong>{editingId ? '编辑跟进事项' : '添加跟进事项'}</strong>
            <span>
              {editingId
                ? '下方列表正在编辑；附件可在此添加，点「保存」写入该事项'
                : '填写后将自动同步到云端'}
            </span>
          </div>
          {!editingId && (
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
          )}
          <div className="follow-attach-block">
            <span className="follow-attach-label">附件链接</span>
            <AttachmentList
              items={editingId ? editDraft.attachments : draft.attachments}
              onRemove={(id) => {
                if (editingId) {
                  setEditDraft((prev) => ({
                    ...prev,
                    attachments: prev.attachments.filter((item) => item.id !== id),
                  }))
                } else {
                  setDraft((prev) => ({
                    ...prev,
                    attachments: prev.attachments.filter((item) => item.id !== id),
                  }))
                }
              }}
            />
            <AttachmentComposer
              draft={editingId ? editAttach : addAttach}
              onChange={editingId ? setEditAttach : setAddAttach}
              onAdd={() =>
                editingId ? appendToEditDraft(editAttach) : appendToAddDraft(addAttach)
              }
              hint={
                editingId
                  ? '正在编辑列表中的事项：添加附件后，请点击该行的「保存」'
                  : '可先添加多个附件，再点右上角「+ 添加」创建事项'
              }
            />
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
                  <th>备注 / 附件</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {project.followUps.map((record) => {
                  const editing = editingId === record.id
                  const attachments = record.attachments ?? []
                  return (
                    <tr key={record.id} className={editing ? 'is-editing' : ''}>
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
                      <td data-label="备注 / 附件">
                        {editing ? (
                          <div className="follow-notes-edit">
                            <input
                              className="follow-table-input"
                              value={editDraft.notes}
                              onChange={(event) =>
                                setEditDraft({
                                  ...editDraft,
                                  notes: event.target.value,
                                })
                              }
                              placeholder="备注文字"
                            />
                            <AttachmentList
                              items={editDraft.attachments}
                              onRemove={(id) =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  attachments: prev.attachments.filter(
                                    (item) => item.id !== id,
                                  ),
                                }))
                              }
                            />
                            <p className="attach-hint">
                              附件请在上方「附件链接」添加，然后点本行「保存」
                            </p>
                          </div>
                        ) : (
                          <div className="follow-notes-view">
                            {record.notes ? (
                              <span className="follow-record-notes">
                                {record.notes}
                              </span>
                            ) : null}
                            <AttachmentList items={attachments} />
                            {!record.notes && attachments.length === 0 ? (
                              <span className="follow-record-notes">—</span>
                            ) : null}
                          </div>
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
                                onClick={() => {
                                  setEditingId(null)
                                  setEditAttach(emptyAttachmentDraft())
                                  setAddAttach(emptyAttachmentDraft())
                                }}
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
