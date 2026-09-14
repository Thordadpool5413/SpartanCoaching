import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Globe2, LoaderCircle, Search, X } from 'lucide-react';
import { api } from './api';
import type { Provider } from './types';
import { apiError } from './utils';

type Result = Pick<Provider, 'ccn'|'name'|'city'|'county'|'state'|'zip'>;

export default function GlobalProviderSearch({ currentState, onOpen }: { currentState: string; onOpen: (provider: Result) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const seq = useRef(0);
  const shell = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      seq.current += 1;
      setResults([]);
      setWarning('');
      setError('');
      setLoading(false);
      return;
    }
    const id = ++seq.current;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      setWarning('');
      void api.get(`/api/provider-search?q=${encodeURIComponent(value)}`)
        .then((response) => {
          if (id !== seq.current) return;
          setResults(response.data.results || []);
          setWarning(response.data.warning || '');
          setOpen(true);
        })
        .catch((requestError) => {
          if (id !== seq.current) return;
          setResults([]);
          setError(apiError(requestError, 'National provider search is temporarily unavailable.'));
          setOpen(true);
        })
        .finally(() => id === seq.current && setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const outside = (event: MouseEvent) => { if (shell.current && !shell.current.contains(event.target as Node)) setOpen(false); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', keyboard); };
  }, []);

  const choose = (result: Result) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    onOpen(result);
  };

  return <div className='global-search' ref={shell}>
    <label>
      <Search size={16}/>
      <input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => query.trim().length >= 2 && setOpen(true)} placeholder='Search any U.S. hospice by name, city, county or CCN' aria-label='Search all U.S. hospice providers'/>
      {loading ? <LoaderCircle className='spin' size={15}/> : query ? <button type='button' onClick={() => setQuery('')} aria-label='Clear search'><X size={14}/></button> : <Globe2 size={15}/>} 
    </label>
    {open && query.trim().length >= 2 && <div className='global-search-results'>
      <header><span><Globe2 size={14}/>NATIONAL CMS HOSPICE SEARCH</span><small>{loading ? 'Searching...' : `${results.length} result${results.length === 1 ? '' : 's'}`}</small></header>
      {error && <div className='search-message danger'><AlertTriangle size={14}/>{error}</div>}
      {warning && <div className='search-message'><AlertTriangle size={14}/>{warning}</div>}
      {!loading && !error && !results.length && <div className='search-empty'>No hospice matched this search. Try the provider name, city, county/equivalent or Medicare CCN.</div>}
      {results.map((result) => <button type='button' key={result.ccn} onClick={() => choose(result)}><span><b>{result.name || `CCN ${result.ccn}`}</b><small>{result.city || 'City NR'}, {result.state || 'State NR'} {result.zip || ''} · {result.county || 'County/equivalent NR'}</small></span><em>{result.state === currentState ? 'CURRENT STATE · ' : ''}CCN {result.ccn}</em></button>)}
    </div>}
  </div>;
}
