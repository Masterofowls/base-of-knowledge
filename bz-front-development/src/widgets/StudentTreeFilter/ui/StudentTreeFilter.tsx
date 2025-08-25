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

type Props = { onApply?: () => void };

const StudentTreeFilter: React.FC<Props> = ({ onApply }) => {
  const [tree, setTree] = useState<FilterTree | null>(null);
  const [sel, setSel] = useState<SelectedPath>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    http.get('/api/filters/tree').then(res => {
      if (ignore) return;
      if (res.data?.success) setTree(res.data.data as FilterTree);
    }).catch(() => {}).finally(() => setIsLoading(false));
    return () => { ignore = true };
  }, []);

  const options = useMemo(() => {
    const empty: Array<{ value: string; label: string }> = [];
    if (!tree) return { inst: empty, city: empty, program: empty, course: empty, form: empty };
    const inst = Object.entries(tree).map(([key, value]) => ({ value: key, label: value.display_name }));
    const city = sel.institution_type ? Object.entries(tree[sel.institution_type].city).map(([key, value]) => ({ value: key, label: value.display_name })) : empty;
    const program = sel.institution_type ? Object.keys(tree[sel.institution_type].study_info).map(key => ({ value: key, label: key })) : empty;
    const course = (sel.institution_type && sel.program) ? Object.keys(tree[sel.institution_type].study_info[sel.program]).map(key => ({ value: key, label: key })) : empty;
    const form = (sel.institution_type && sel.program && sel.course) ? Object.keys(tree[sel.institution_type].study_info[sel.program][sel.course]).map(key => ({ value: key, label: key })) : empty;
    return { inst, city, program, course, form };
  }, [tree, sel]);

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
        <Button variant='contained' disabled={isLoading} onClick={apply}>Применить</Button>
      </div>
    </div>
  );
};

export default StudentTreeFilter;
