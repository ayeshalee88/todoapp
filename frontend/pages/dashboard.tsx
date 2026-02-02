import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { apiClient } from '../lib/api';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
import Image from 'next/image';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DeletedTask extends Task {
  deleted_at: string;
}

interface DashboardProps {
  user: {
    id: string;
    email: string;
  };
}

export default function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'important' | 'completed'>('all');
  const [view, setView] = useState<'grid' | 'calendar'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Set token when session is available
  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [session]);

  // Fetch tasks when user and session are ready
  useEffect(() => {
    if (session?.accessToken && user?.id) {
      fetchTasks();
    }
  }, [session, user?.id]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'important') return !task.completed;
    return true;
  });

  const fetchTasks = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const result = await apiClient.getTasks(user.id);
      if (result.error) throw new Error(result.error);
      setTasks((result.data as any) || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!user?.id) return;
    try {
      const result = await apiClient.createTask(user.id, taskData);
      if (result.error) throw new Error(result.error);
      if (result.data) {
        setTasks([...tasks, result.data as any]);
      }
      setShowForm(false);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskData: Task) => {
    if (!user?.id) return;
    try {
      const result = await apiClient.updateTask(user.id, taskData.id, taskData);
      if (result.error) throw new Error(result.error);
      if (result.data) {
        setTasks(tasks.map(t => t.id === (result.data as any).id ? result.data as any : t));
      }
      setEditingTask(null);
      setShowForm(false);
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    if (!user?.id) return;
    try {
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (taskToDelete) {
        setDeletedTasks([...deletedTasks, { ...taskToDelete, deleted_at: new Date().toISOString() }]);
      }
      await apiClient.deleteTask(user.id, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    const taskToRestore = deletedTasks.find(t => t.id === taskId);
    if (taskToRestore && user?.id) {
      const { deleted_at, ...task } = taskToRestore;
      try {
        const result = await apiClient.createTask(user.id, task);
        if (result.error) throw new Error(result.error);
        if (result.data) {
          setTasks([...tasks, result.data as any]);
          setDeletedTasks(deletedTasks.filter(t => t.id !== taskId));
        }
      } catch (err) {
        setError('Failed to restore task');
      }
    }
  };

  const handlePermanentDelete = (taskId: string) => {
    if (!window.confirm('Permanently delete this task? This cannot be undone.')) return;
    setDeletedTasks(deletedTasks.filter(t => t.id !== taskId));
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    if (!user?.id) return;
    try {
      const result = await apiClient.updateTaskCompletion(user.id, taskId, completed);
      if (result.data) {
        setTasks(tasks.map(t => t.id === taskId ? result.data as any : t));
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getColorGradient = (index: number) => {
    const colors = [
      'linear-gradient(135deg, #fef3c7, #fde68a)',
      'linear-gradient(135deg, #dbeafe, #93c5fd)',
      'linear-gradient(135deg, #fce7f3, #f9a8d4)',
      'linear-gradient(135deg, #d1fae5, #6ee7b7)',
    ];
    return colors[index % 4];
  };

  return (
    <>
      <Head>
      
        <title>Dashboard - Todoify</title>
      
      </Head>
      <div className={styles.container}>
        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>
              <Image src="/icons/ayismm.png" 
                                alt="Smart Reminders" 
                                width={20} 
                                height={20} /> Todoify</h2>
            <p className={styles.sidebarEmail}>{user?.email}</p>
          </div>

          <nav className={styles.nav}>
            <button 
              onClick={() => { setFilter('all'); setSidebarOpen(false); }}
              className={`${styles.navLink} ${filter === 'all' ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>📋</span>
              <span>All Tasks</span>
              <span className={styles.badge}>{tasks.length}</span>
            </button>
            <button 
              onClick={() => { setFilter('important'); setSidebarOpen(false); }}
              className={`${styles.navLink} ${filter === 'important' ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>⭐</span>
              <span>Active</span>
              <span className={styles.badge}>{tasks.filter(t => !t.completed).length}</span>
            </button>
            <button 
              onClick={() => { setFilter('completed'); setSidebarOpen(false); }}
              className={`${styles.navLink} ${filter === 'completed' ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>✅</span>
              <span>Completed</span>
              <span className={styles.badge}>{tasks.filter(t => t.completed).length}</span>
            </button>
            <button 
              onClick={() => { setShowDeletedModal(true); setSidebarOpen(false); }}
              className={styles.navLink}
            >
              <span className={styles.navIcon}>🗑️</span>
              <span>Deleted</span>
              <span className={styles.badge}>{deletedTasks.length}</span>
            </button>
          </nav>

          <div className={styles.viewToggle}>
            <button 
              onClick={() => setView('grid')}
              className={view === 'grid' ? styles.viewToggleActive : ''}
            >
              Grid
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={view === 'calendar' ? styles.viewToggleActive : ''}
            >
              Calendar
            </button>
          </div>

          <button onClick={handleLogout} className={styles.logoutButton}>
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>
                {view === 'calendar' ? 'Calendar View' : 'My Tasks'}
              </h1>
              <button 
                onClick={() => {
                  setEditingTask(null);
                  setShowForm(true);
                }}
                className={styles.addButton}
              >
                + New Task
              </button>
            </div>

            {error && (
              <div className={styles.error}>
                <span>{error}</span>
                <button onClick={() => setError(null)} className={styles.errorButton}>×</button>
              </div>
            )}

            {/* Grid View */}
            {view === 'grid' && (
              <div className={styles.taskGrid}>
                {/* Add New Card */}
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowForm(true);
                  }}
                  className={styles.addCard}
                >
                  <div className={styles.addCardIcon}>+</div>
                  <p className={styles.addCardText}>Add New Task</p>
                </button>

                {/* Task Cards */}
                {loading ? (
                  <div className={styles.loading}>Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyStateText}>
                      {filter === 'completed' ? 'No completed tasks yet!' : 
                       filter === 'important' ? 'No active tasks!' : 
                       'No tasks yet. Create your first task!'}
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      colorIndex={index % 4}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onEdit={(t:any) => {
                        setEditingTask(t);
                        setShowForm(true);
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Calendar View */}
            {view === 'calendar' && (
              <div className={styles.calendar}>
                <div className={styles.calendarHeader}>
                  <button onClick={previousMonth} className={styles.calendarNav}>‹</button>
                  <h2 className={styles.calendarMonth}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <button onClick={nextMonth} className={styles.calendarNav}>›</button>
                </div>

                <div className={styles.calendarGrid}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.calendarDayHeader}>{day}</div>
                  ))}
                  
                  {Array.from({ length: startingDayOfWeek }, (_, i) => (
                    <div key={`empty-${i}`} className={`${styles.calendarCell} ${styles.empty}`}></div>
                  ))}
                  
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNumber = i + 1;
                    const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
                    const dayTasks = getTasksForDate(currentDate);
                    const isToday = currentDate.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={dayNumber} className={`${styles.calendarCell} ${isToday ? styles.today : ''}`}>
                        <div className={styles.calendarDate}>{dayNumber}</div>
                        <div className={styles.calendarTasks}>
                          {dayTasks.slice(0, 3).map((task, idx) => (
                            <div 
                              key={task.id} 
                              className={styles.calendarTask}
                              style={{ background: getColorGradient(idx) }}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className={styles.calendarMore}>+{dayTasks.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Modal Form */}
        {showForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <TaskForm
                task={editingTask || undefined}
                onSubmit={editingTask ? handleUpdateTask as any : handleCreateTask}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Deleted Tasks Modal */}
        {showDeletedModal && (
          <div className={styles.modalOverlay} onClick={() => setShowDeletedModal(false)}>
            <div className={styles.deletedModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.deletedModalHeader}>
                <h2>Deleted Tasks</h2>
                <button onClick={() => setShowDeletedModal(false)} className={styles.modalClose}>×</button>
              </div>
              <div className={styles.deletedList}>
                {deletedTasks.length === 0 ? (
                  <p className={styles.emptyStateText}>No deleted tasks</p>
                ) : (
                  deletedTasks.map(task => (
                    <div key={task.id} className={styles.deletedItem}>
                      <div>
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <small>Deleted: {new Date(task.deleted_at).toLocaleDateString()}</small>
                      </div>
                      <div className={styles.deletedActions}>
                        <button onClick={() => handleRestoreTask(task.id)} className={styles.restoreButton}>
                          Restore
                        </button>
                        <button onClick={() => handlePermanentDelete(task.id)} className={styles.permanentDeleteButton}>
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If no session, redirect to login
  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Return user data to the page
  return {
    props: {
      user: {
        id: session.user.id,
        email: session.user.email || '',
      },
    },
  };
};