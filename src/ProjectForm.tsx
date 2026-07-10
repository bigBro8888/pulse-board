import { useState, type FormEvent } from 'react'
import type { ProjectInput } from './useProjects'
import type { ProjectStatus } from './types'
import { STATUS_LABELS } from './types'

type Props = {
  onSubmit: (input: ProjectInput) => void
  onClose: () => void
}

const empty: ProjectInput = {
  name: '',
  description: '',
  deadline: '',
  progress: 0,
  status: 'active',
  owner: '',
}

export function ProjectForm({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState<ProjectInput>(empty)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      owner: form.owner.trim() || '未指定',
    })
    setForm(empty)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="modal-header">
          <div>
            <h2>新建项目</h2>
            <p className="modal-sub">填写关键信息，立即出现在工作台</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <label className="field">
          <span>项目名称</span>
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="例如：首页改版"
          />
        </label>

        <label className="field">
          <span>项目说明</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="官网视觉升级与功能优化"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>截止日期</span>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </label>
          <label className="field">
            <span>负责人</span>
            <input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="姓名"
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>状态</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ProjectStatus })
              }
            >
              {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>进度 · {form.progress}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={(e) =>
                setForm({ ...form, progress: Number(e.target.value) })
              }
            />
          </label>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn primary">
            创建项目
          </button>
        </footer>
      </form>
    </div>
  )
}
