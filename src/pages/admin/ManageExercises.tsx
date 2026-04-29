import { useState, useEffect, useMemo } from 'react';
import { CreditCard as Edit2, Trash2, X, Check, Search, Star, Eye, EyeOff, ChevronLeft, ChevronRight, Download, ChevronDown } from 'lucide-react';
import { supabase, Exercise } from '../../lib/supabase';
import CategoryBadge from '../../components/CategoryBadge';
import { useToast } from '../../components/Toast';
import UploadExercise from './UploadExercise';
import { CATEGORIES, MUSCLE_GROUPS, DIFFICULTIES, DIFFICULTY_COLORS } from '../../constants/exercise';

const PAGE_SIZE = 20;

const VISIBILITY_COLORS: Record<string, string> = {
  free: 'var(--accent)',
  pro: '#00D4FF',
  elite: '#FFB800',
};

export default function ManageExercises() {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [filterVis, setFilterVis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'view_count'>('created_at');

  useEffect(() => { fetchExercises(); }, []);

  async function fetchExercises() {
    setLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*, coaches(*)')
      .order('created_at', { ascending: false });
    if (data) setExercises(data as Exercise[]);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Exercise deleted', 'info');
    setExercises((p) => p.filter((e) => e.id !== id));
    setSelected((p) => { const n = new Set(p); n.delete(id); return n; });
    setDeleteConfirm(null);
  }

  async function handleToggleStatus(ex: Exercise) {
    const next = ex.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('exercises').update({ status: next }).eq('id', ex.id);
    if (error) { showToast(error.message, 'error'); return; }
    setExercises((p) => p.map((e) => e.id === ex.id ? { ...e, status: next } : e));
    showToast(next === 'published' ? 'Published' : 'Set to draft', 'success');
  }

  async function handleBulkPublish(status: 'published' | 'draft') {
    const ids = [...selected];
    const { error } = await supabase.from('exercises').update({ status }).in('id', ids);
    if (error) { showToast(error.message, 'error'); return; }
    setExercises((p) => p.map((e) => selected.has(e.id) ? { ...e, status } : e));
    showToast(`${ids.length} exercises ${status === 'published' ? 'published' : 'unpublished'}`, 'success');
    setSelected(new Set());
  }

  async function handleBulkDelete() {
    const ids = [...selected];
    const { error } = await supabase.from('exercises').delete().in('id', ids);
    if (error) { showToast(error.message, 'error'); return; }
    setExercises((p) => p.filter((e) => !selected.has(e.id)));
    showToast(`${ids.length} exercises deleted`, 'info');
    setSelected(new Set());
  }

  function exportCSV() {
    const rows = [
      ['Title', 'Category', 'Muscle', 'Difficulty', 'Visibility', 'Status', 'Featured', 'Date Added'],
      ...filtered.map((ex) => [
        ex.title,
        ex.category?.join('; ') ?? '',
        ex.muscle_group ?? '',
        ex.difficulty ?? '',
        ex.visibility ?? 'free',
        ex.status,
        ex.featured ? 'Yes' : 'No',
        new Date(ex.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stayhybrid-exercises.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    let list = exercises;
    if (search) list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
    if (filterCat) list = list.filter((e) => e.category?.includes(filterCat));
    if (filterMuscle) list = list.filter((e) => e.muscle_group === filterMuscle);
    if (filterDiff) list = list.filter((e) => e.difficulty === filterDiff);
    if (filterVis) list = list.filter((e) => (e.visibility ?? 'free') === filterVis);
    if (filterStatus) list = list.filter((e) => e.status === filterStatus);

    const dir = sortBy === 'title' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title) * dir;
      if (sortBy === 'view_count') return ((b.view_count ?? 0) - (a.view_count ?? 0));
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [exercises, search, filterCat, filterMuscle, filterDiff, filterVis, filterStatus, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: exercises.length,
    published: exercises.filter((e) => e.status === 'published').length,
    drafts: exercises.filter((e) => e.status === 'draft').length,
    featured: exercises.filter((e) => e.featured).length,
  };

  function toggleSelect(id: string) {
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((e) => e.id)));
    }
  }

  const editing = editingId ? exercises.find((e) => e.id === editingId) : null;

  if (editing) {
    return (
      <div className="p-8">
        <button
          onClick={() => setEditingId(null)}
          className="flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X size={13} /> Back to list
        </button>
        <UploadExercise
          editId={editingId!}
          initialData={{
            title: editing.title,
            category: editing.category ?? [],
            difficulty: editing.difficulty ?? 'Intermediate',
            muscle_group: editing.muscle_group ?? '',
            secondary_muscles: editing.secondary_muscles ?? [],
            equipment: editing.equipment ?? [],
            sets_reps: editing.sets_reps ?? '',
            rest_period: editing.rest_period ?? '',
            benefits: editing.benefits ?? '',
            coaching_cues: editing.coaching_cues ?? '',
            common_mistakes: editing.common_mistakes ?? '',
            visibility: (editing.visibility as any) ?? 'free',
            featured: editing.featured ?? false,
            status: editing.status,
            short_video_url: editing.short_video_url ?? '',
            tutorial_video_url: editing.tutorial_video_url ?? '',
          }}
          onSaved={() => { fetchExercises(); setEditingId(null); }}
        />
      </div>
    );
  }

  const selectStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'TOTAL', value: stats.total, color: 'var(--text-primary)' },
          { label: 'PUBLISHED', value: stats.published, color: 'var(--accent)' },
          { label: 'DRAFTS', value: stats.drafts, color: 'var(--text-secondary)' },
          { label: 'FEATURED', value: stats.featured, color: '#FFB800' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>{label}</p>
            <p className="text-4xl" style={{ color, fontFamily: "'Bebas Neue', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1
          className="text-4xl"
          style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
        >
          MANAGE EXERCISES
        </h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm transition-opacity hover:opacity-70"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search exercises..."
            className="w-full pl-8 pr-4 py-2 text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Filter dropdowns */}
        {[
          { value: filterCat, set: setFilterCat, options: CATEGORIES, placeholder: 'All Categories' },
          { value: filterMuscle, set: setFilterMuscle, options: MUSCLE_GROUPS, placeholder: 'All Muscles' },
          { value: filterDiff, set: setFilterDiff, options: DIFFICULTIES, placeholder: 'All Levels' },
          { value: filterVis, set: setFilterVis, options: ['free', 'pro', 'elite'], placeholder: 'All Tiers' },
          { value: filterStatus, set: setFilterStatus, options: ['published', 'draft'], placeholder: 'All Status' },
        ].map(({ value, set: setVal, options, placeholder }, i) => (
          <div key={i} className="relative">
            <select
              value={value}
              onChange={(e) => { setVal(e.target.value); setPage(1); }}
              className="appearance-none pl-3 pr-7 py-2 text-xs cursor-pointer outline-none"
              style={selectStyle}
            >
              <option value="">{placeholder}</option>
              {options.map((o) => <option key={o} value={o} style={{ background: 'var(--surface)' }}>{o}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none pl-3 pr-7 py-2 text-xs cursor-pointer outline-none"
            style={selectStyle}
          >
            <option value="created_at">Sort: Date Added</option>
            <option value="title">Sort: Title</option>
            <option value="view_count">Sort: View Count</option>
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.3)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            {selected.size} selected
          </span>
          <div className="flex gap-2 ml-2">
            <button
              onClick={() => handleBulkPublish('published')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
              style={{ background: 'rgba(200,255,0,0.15)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            >
              <Eye size={12} /> Publish All
            </button>
            <button
              onClick={() => handleBulkPublish('draft')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <EyeOff size={12} /> Unpublish All
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-opacity hover:opacity-80"
              style={{ background: 'rgba(255,60,0,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}
            >
              <Trash2 size={12} /> Delete All
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem' }}>NO EXERCISES FOUND</p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === paginated.length && paginated.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-[#C8FF00] cursor-pointer"
                  />
                </th>
                {['Thumbnail', 'Title', 'Categories', 'Muscle', 'Difficulty', 'Visibility', 'Featured', 'Status', 'Added', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-xs whitespace-nowrap"
                    style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((ex) => (
                <tr
                  key={ex.id}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  onClick={() => setEditingId(ex.id)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(ex.id)}
                      onChange={() => toggleSelect(ex.id)}
                      className="accent-[#C8FF00] cursor-pointer"
                    />
                  </td>

                  {/* Thumbnail */}
                  <td className="px-3 py-3">
                    <div
                      className="w-14 h-10 flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: '#0d0d0d', border: '1px solid var(--border)' }}
                    >
                      {ex.short_video_url && !ex.short_video_url.includes('instagram') ? (
                        <video src={ex.short_video_url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-3 h-3 opacity-20" style={{ borderLeft: '5px solid var(--text-muted)', borderTop: '3px solid transparent', borderBottom: '3px solid transparent' }} />
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-3 py-3 max-w-[180px]">
                    <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ex.title}</p>
                  </td>

                  {/* Categories */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ex.category?.slice(0, 2).map((cat) => <CategoryBadge key={cat} category={cat} />)}
                      {(ex.category?.length ?? 0) > 2 && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{ex.category.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* Muscle */}
                  <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {ex.muscle_group}
                  </td>

                  {/* Difficulty */}
                  <td className="px-3 py-3">
                    {ex.difficulty && (
                      <span
                        className="px-2 py-0.5 text-xs whitespace-nowrap"
                        style={{
                          background: `${DIFFICULTY_COLORS[ex.difficulty] ?? '#888'}18`,
                          border: `1px solid ${DIFFICULTY_COLORS[ex.difficulty] ?? '#888'}50`,
                          color: DIFFICULTY_COLORS[ex.difficulty] ?? '#888',
                          fontFamily: "'Bebas Neue', sans-serif",
                          letterSpacing: '0.06em',
                        }}
                      >
                        {ex.difficulty}
                      </span>
                    )}
                  </td>

                  {/* Visibility */}
                  <td className="px-3 py-3">
                    <span
                      className="px-2 py-0.5 text-xs uppercase whitespace-nowrap"
                      style={{
                        background: `${VISIBILITY_COLORS[ex.visibility ?? 'free']}18`,
                        border: `1px solid ${VISIBILITY_COLORS[ex.visibility ?? 'free']}50`,
                        color: VISIBILITY_COLORS[ex.visibility ?? 'free'],
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: '0.06em',
                      }}
                    >
                      {ex.visibility ?? 'free'}
                    </span>
                  </td>

                  {/* Featured */}
                  <td className="px-3 py-3 text-center">
                    <Star
                      size={14}
                      fill={ex.featured ? '#FFB800' : 'none'}
                      style={{ color: ex.featured ? '#FFB800' : 'var(--text-muted)' }}
                    />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <span
                      className="px-2 py-0.5 text-xs whitespace-nowrap"
                      style={{
                        background: ex.status === 'published' ? 'rgba(200,255,0,0.08)' : 'rgba(136,136,136,0.08)',
                        border: `1px solid ${ex.status === 'published' ? 'var(--accent)' : 'var(--border)'}`,
                        color: ex.status === 'published' ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: '0.06em',
                      }}
                    >
                      {ex.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(ex.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(ex.id)}
                        className="p-1.5 transition-opacity hover:opacity-70"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(ex)}
                        className="p-1.5 transition-opacity hover:opacity-70"
                        style={{ color: ex.status === 'published' ? 'var(--accent)' : 'var(--text-muted)' }}
                        title={ex.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {ex.status === 'published' ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>

                      {deleteConfirm === ex.id ? (
                        <>
                          <button onClick={() => handleDelete(ex.id)} className="p-1.5 transition-opacity hover:opacity-70" style={{ color: 'var(--accent-red)' }} title="Confirm">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }} title="Cancel">
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(ex.id)}
                          className="p-1.5 transition-opacity hover:opacity-70"
                          style={{ color: 'var(--text-muted)' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 transition-opacity hover:opacity-70 disabled:opacity-30"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={14} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className="w-8 h-8 text-xs transition-all"
                style={{
                  background: page === i + 1 ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${page === i + 1 ? 'var(--accent)' : 'var(--border)'}`,
                  color: page === i + 1 ? '#000' : 'var(--text-secondary)',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 transition-opacity hover:opacity-70 disabled:opacity-30"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
