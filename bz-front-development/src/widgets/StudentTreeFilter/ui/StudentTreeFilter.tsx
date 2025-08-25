import React, { useEffect, useMemo, useState } from 'react';
import http from 'shared/api/http';
import { InputSelect } from 'shared/ui/InputSelect/InputSelect';
import { Button } from 'shared/ui/Button';

interface FilterTree {
  [key: string]: {
    display_name: string;
    general: { id: number; display_name: string };
    city: { [key: string]: { id: number; display_name: string } };
    study_info: {
      [programKey: string]: {
        [courseKey: string]: {
          [formKey: string]: {
            [cityKey: string]: { id: number; display_name: string }
          }
        }
      }
    };
  };
}

interface SelectedPath {
  institution_type?: string;
  city?: string;
  program?: string;
  course?: string;
  form?: string;
}

type Props = { onApply?: () => void; onResults?: (items: Array<{ id:number; title:string; content:string; created_at?: string }>) => void };

const StudentTreeFilter: React.FC<Props> = ({ onApply, onResults }) => {
  const [tree, setTree] = useState<FilterTree | null>(null);
  const [sel, setSel] = useState<SelectedPath>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cityDict, setCityDict] = useState<Array<{ value:string; label:string }>>([]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    Promise.all([
      http.get('/api/filters/tree').catch(()=>null),
      http.get('/api/categories/cities').catch(()=>null),
    ]).then(([resTree, resCities]) => {
      if (ignore) return;
      if (resTree?.data?.success) setTree(resTree.data.data as FilterTree);
      const cds = (resCities?.data || []).map((c:any)=>({ value: (c.key || '').toLowerCase(), label: c.name }))
        .filter((c:any)=> c.value);
      setCityDict(cds);
    }).finally(()=> setIsLoading(false));
    return () => { ignore = true };
  }, []);

  const options = useMemo(() => {
    const empty: Array<{ value: string; label: string }> = [];
    if (!tree) return { inst: empty, city: cityDict, program: empty, course: empty, form: empty };
    const inst = Object.entries(tree).map(([key, value]) => ({ value: key, label: value.display_name }));
    // city: if institution selected use tree cities, else use dict (all cities)
    let city = cityDict;
    if (sel.institution_type) {
      city = Object.entries(tree[sel.institution_type].city).map(([key, value]) => ({ value: key, label: value.display_name }));
    }
    const program = sel.institution_type ? Object.keys(tree[sel.institution_type].study_info).map(key => ({ value: key, label: key })) : empty;
    const course = (sel.institution_type && sel.program) ? Object.keys(tree[sel.institution_type].study_info[sel.program]).map(key => ({ value: key, label: key })) : empty;
    const form = (sel.institution_type && sel.program && sel.course) ? Object.keys(tree[sel.institution_type].study_info[sel.program][sel.course]).map(key => ({ value: key, label: key })) : empty;
    return { inst, city, program, course, form };
  }, [tree, sel, cityDict]);

  function change(key: keyof SelectedPath, value: string) {
    setSel(prev => {
      const next: SelectedPath = { ...prev, [key]: value };
      if (key === 'institution_type') { delete next.city; delete next.program; delete next.course; delete next.form; }
      else if (key === 'city') { delete next.program; delete next.course; delete next.form; }
      else if (key === 'program') { delete next.course; delete next.form; }
      else if (key === 'course') { delete next.form; }
      return next;
    });
  }

  // Fetch filtered articles incrementally on every selection
  useEffect(() => {
    if (!sel.institution_type && !sel.city && !sel.program && !sel.course && !sel.form) {
      if (onResults) onResults([]);
      return;
    }
    const params: Record<string, any> = {};
    if (sel.city) params.city = sel.city;
    if (sel.institution_type) params.institution_type = sel.institution_type;
    if (sel.program) params.program = sel.program;
    if (sel.course) {
      const m = sel.course.match(/^(\d+)/);
      params.course = m ? m[1] : sel.course;
    }
    if (sel.form) params.form = sel.form;
    setFetching(true); setErr(null);
    http.get('/api/filters/articles', { params }).then(res => {
      const items = (res.data?.data || []) as Array<{ id:number; title:string; content:string; created_at?: string }>;
      if (onResults) onResults(items);
    }).catch((e:any)=>{
      setErr(e?.response?.data?.error || 'Не удалось получить посты');
      if (onResults) onResults([]);
    }).finally(()=> setFetching(false));
  }, [sel, onResults]);

  function apply() {
    try {
      if (!tree) return;
      // Persist student context expected by posts feed
      // city: try numeric id from tree; else keep undefined
      let cityId: number | undefined = undefined;
      if (sel.institution_type && sel.city) {
        const c = tree[sel.institution_type]?.city?.[sel.city];
        if (c && typeof c.id === 'number') cityId = c.id;
      }
      if (cityId) localStorage.setItem('student_city_id', String(cityId)); else localStorage.removeItem('student_city_id');
      // course: map like '1 course' => 1
      if (sel.course) {
        const m = sel.course.match(/^(\d+)/);
        if (m) localStorage.setItem('student_course', String(Number(m[1])));
        else localStorage.removeItem('student_course');
      } else localStorage.removeItem('student_course');
      // form not used server-side yet; keep for future
      localStorage.setItem('user_role','student');
      localStorage.setItem('strict_audience','1');
      if (onApply) onApply();
    } catch {}
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0, 1fr))', gap:8, alignItems:'end', padding:'8px 12px', border:'1px solid rgba(0,0,0,0.06)', borderRadius:8, background:'#fff', marginBottom:12 }}>
      <div>
        <div style={{ fontSize:12, marginBottom:4 }}>Тип</div>
        <InputSelect placeholder='Выберите' options={options.inst} value={sel.institution_type || ''} onChange={(v)=>change('institution_type', v)} />
      </div>
      <div>
        <div style={{ fontSize:12, marginBottom:4 }}>Город</div>
        <InputSelect placeholder='Выберите' options={options.city} value={sel.city || ''} onChange={(v)=>change('city', v)} />
      </div>
      <div>
        <div style={{ fontSize:12, marginBottom:4 }}>Программа</div>
        <InputSelect placeholder='Выберите' options={options.program} value={sel.program || ''} onChange={(v)=>change('program', v)} />
      </div>
      <div>
        <div style={{ fontSize:12, marginBottom:4 }}>Курс</div>
        <InputSelect placeholder='Выберите' options={options.course} value={sel.course || ''} onChange={(v)=>change('course', v)} />
      </div>
      <div>
        <div style={{ fontSize:12, marginBottom:4 }}>Форма</div>
        <InputSelect placeholder='Выберите' options={options.form} value={sel.form || ''} onChange={(v)=>change('form', v)} />
      </div>
      <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end' }}>
        {err && <span style={{ color:'#E44A77', marginRight: 12, fontSize:12 }}>{err}</span>}
        <Button variant='contained' disabled={isLoading || fetching} onClick={apply}>{fetching ? 'Загрузка…' : 'Применить'}</Button>
      </div>
    </div>
  );
};

export default StudentTreeFilter;
