import React from 'react';

export interface KanbanTask {
  id: string;
  title: string;
  company: string;
  status: 'matched' | 'applied' | 'interviews';
  salary: string;
  confidence: number;
  date: string;
  applicationEmail?: string;
  applicationPhone?: string;
  applicationLink?: string;
  applicationLinkOrEmail?: string;
  keyRequirementsSummary?: string[];
  sourcePlatform?: string;
  pinned?: boolean;
  applicationMethod?: 'email' | 'portal' | 'google_form' | 'unknown';
  emailSubject?: string;
  emailBodyRequirements?: string;
  attachmentsRequired?: string[];
}

interface KanbanBoardProps {
  activeDropColumn: string | null;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent, col: 'matched' | 'applied' | 'interviews') => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, col: 'matched' | 'applied' | 'interviews') => void;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnd: (e: React.DragEvent, id: string) => void;
  getSortedTasks: (col: 'matched' | 'applied' | 'interviews') => KanbanTask[];
  handleTogglePin: (id: string) => void;
  handleRemoveTask: (id: string) => void;
  openEmailModalForJob: (job: any, kanbanTaskId?: string) => void;
  moveTaskStatus: (id: string, direction: 'forward' | 'backward') => void;
  setShowNewTaskModal: (show: boolean) => void;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  activeDropColumn,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragStart,
  handleDragEnd,
  getSortedTasks,
  handleTogglePin,
  handleRemoveTask,
  openEmailModalForJob,
  moveTaskStatus,
  setShowNewTaskModal
}) => {
  return (
    <section className="copilot-kanban" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ACTION ITEMS: CAREER TASK BOARD */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>My Applications Tracker</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Drag and drop cards or click arrows to advance interview progress.</p>
          </div>
          <button className="btn-glass btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setShowNewTaskModal(true)}>
            <PlusIcon /> Track Event
          </button>
        </div>

        <div className="kanban-grid">
          
          {/* COL 1: MATCHED / INBOX */}
          <div 
            className={`kanban-column ${activeDropColumn === 'matched' ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'matched')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'matched')}
          >
            <div className="kanban-col-header">
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Job Matches</span>
              <span className="badge badge-purple">{getSortedTasks('matched').length}</span>
            </div>

            {getSortedTasks('matched').length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem 0.25rem' }}>
                No matches yet. Scan for jobs or import one from your Live Matches Ticker to start tracking it here.
              </p>
            )}

            {getSortedTasks('matched').map(task => (
              <div 
                key={task.id} 
                id={task.id}
                className="kanban-card"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={(e) => handleDragEnd(e, task.id)}
                style={task.pinned ? {
                  border: '1px solid var(--border-glass-active)',
                  boxShadow: '0 0 12px rgba(138, 92, 246, 0.25)',
                  background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.08), rgba(255, 255, 255, 0.02))'
                } : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.company}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: task.pinned ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                        opacity: task.pinned ? 1 : 0.4,
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      title={task.pinned ? "Unpin task" : "Pin task to top"}
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                        opacity: 0.4,
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      title="Remove task"
                    >
                      🗑️
                    </button>
                    <span className="badge badge-purple">{task.confidence}% Match</span>
                  </div>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{task.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{task.salary}</p>
                
                {/* Direct Channels CTA Row */}
                {(task.applicationEmail || task.applicationLink || task.applicationPhone) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.4rem 0', borderTop: '1px dashed var(--border-glass)' }}>
                    {task.applicationLink && (
                      <a 
                        href={task.applicationLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="badge badge-purple" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        🔗 Direct Link
                      </a>
                    )}
                    {task.applicationEmail && (
                      <button 
                        type="button" 
                        className="badge badge-pink" 
                        onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', border: 'none', cursor: 'pointer' }}
                      >
                        📧 Send Email
                      </button>
                    )}
                    {task.applicationPhone && (
                      <a 
                        href={`tel:${task.applicationPhone}`} 
                        className="badge badge-emerald" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        📞 Call Now
                      </a>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.date}</span>
                  <button 
                    className="btn-glass" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} 
                    onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                  >
                    📧 Apply & Send Email
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* COL 2: APPLIED */}
          <div 
            className={`kanban-column ${activeDropColumn === 'applied' ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'applied')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'applied')}
          >
            <div className="kanban-col-header">
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Applied</span>
              <span className="badge badge-pink">{getSortedTasks('applied').length}</span>
            </div>

            {getSortedTasks('applied').length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem 0.25rem' }}>
                Nothing applied to yet. Cards move here automatically once you send an application.
              </p>
            )}

            {getSortedTasks('applied').map(task => (
              <div 
                key={task.id} 
                id={task.id}
                className="kanban-card"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={(e) => handleDragEnd(e, task.id)}
                style={task.pinned ? {
                  border: '1px solid var(--border-glass-active)',
                  boxShadow: '0 0 12px rgba(138, 92, 246, 0.25)',
                  background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.08), rgba(255, 255, 255, 0.02))'
                } : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.company}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: task.pinned ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                        opacity: task.pinned ? 1 : 0.4,
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      title={task.pinned ? "Unpin task" : "Pin task to top"}
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                        opacity: 0.4,
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      title="Remove task"
                    >
                      🗑️
                    </button>
                    <span className="badge badge-pink">Applied</span>
                  </div>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{task.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{task.salary}</p>
                
                {/* Direct Channels CTA Row */}
                {(task.applicationEmail || task.applicationLink || task.applicationPhone) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.4rem 0', borderTop: '1px dashed var(--border-glass)' }}>
                    {task.applicationLink && (
                      <a 
                        href={task.applicationLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="badge badge-purple" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        🔗 Direct Link
                      </a>
                    )}
                    {task.applicationEmail && (
                      <button 
                        type="button" 
                        className="badge badge-pink" 
                        onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', border: 'none', cursor: 'pointer' }}
                      >
                        📧 Send Email
                      </button>
                    )}
                    {task.applicationPhone && (
                      <a 
                        href={`tel:${task.applicationPhone}`} 
                        className="badge badge-emerald" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        📞 Call Now
                      </a>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn-glass" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => moveTaskStatus(task.id, 'backward')}>
                    ← Undo
                  </button>
                  <button className="btn-glass" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => moveTaskStatus(task.id, 'forward')}>
                    Interview →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* COL 3: INTERVIEWING */}
          <div 
            className={`kanban-column ${activeDropColumn === 'interviews' ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'interviews')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'interviews')}
          >
            <div className="kanban-col-header">
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Interviews & Offers</span>
              <span className="badge badge-emerald">{getSortedTasks('interviews').length}</span>
            </div>

            {getSortedTasks('interviews').length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem 0.25rem' }}>
                No interviews scheduled yet. This fills in once an employer responds.
              </p>
            )}

            {getSortedTasks('interviews').map(task => (
              <div 
                key={task.id} 
                id={task.id}
                className="kanban-card" 
                draggable={true}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={(e) => handleDragEnd(e, task.id)}
                style={task.pinned ? {
                  border: '1px solid var(--border-glass-active)',
                  boxShadow: '0 0 12px rgba(138, 92, 246, 0.25)',
                  background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.08), rgba(255, 255, 255, 0.02))'
                } : {
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.03), rgba(0, 0, 0, 0))'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.company}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: task.pinned ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                        opacity: task.pinned ? 1 : 0.4,
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      title={task.pinned ? "Unpin task" : "Pin task to top"}
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                        opacity: 0.4,
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      title="Remove task"
                    >
                      🗑️
                    </button>
                    <span className="badge badge-emerald">Stage Active</span>
                  </div>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{task.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{task.salary}</p>
                
                {/* Direct Channels CTA Row */}
                {(task.applicationEmail || task.applicationLink || task.applicationPhone) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.4rem 0', borderTop: '1px dashed var(--border-glass)' }}>
                    {task.applicationLink && (
                      <a 
                        href={task.applicationLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="badge badge-purple" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        🔗 Direct Link
                      </a>
                    )}
                    {task.applicationEmail && (
                      <button 
                        type="button" 
                        className="badge badge-pink" 
                        onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', border: 'none', cursor: 'pointer' }}
                      >
                        📧 Send Email
                      </button>
                    )}
                    {task.applicationPhone && (
                      <a 
                        href={`tel:${task.applicationPhone}`} 
                        className="badge badge-emerald" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        📞 Call Now
                      </a>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn-glass" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => moveTaskStatus(task.id, 'backward')}>
                    ← Back
                  </button>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>{task.date}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
