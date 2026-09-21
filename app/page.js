'use client';

import { useEffect, useMemo, useState } from 'react';
import { getInstantCore } from './coreWords';

const APP_VERSION = '2026-09-21-ipa-fix-2';
const starterWords = ['apple', 'middle', 'center', 'point', 'love', 'beautiful'];

function speak(text, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [examples, setExamples] = useState([]);
  const [related, setRelated] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loadingCore, setLoadingCore] = useState(false);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem('wordpop-recent') || '[]')); } catch {}
  }, []);

  const meanings = useMemo(() => result?.meanings || [], [result]);

  async function search(raw) {
    const text = (raw ?? query).trim();
    if (!text) return;

    setQuery(text);
    setError('');
    setExamples([]);
    setRelated([]);
    setSongs([]);

    const key = text.toLowerCase();
    const coreKey = `wordpop-core:${APP_VERSION}:${key}`;
    let core = getInstantCore(text);

    if (core) {
      setResult(core);
      setLoadingCore(false);
    } else {
      try { core = JSON.parse(localStorage.getItem(coreKey) || 'null'); } catch {}
      if (core) {
        setResult(core);
        setLoadingCore(false);
      }
    }

    try {
      if (!core) {
        setLoadingCore(true);
        const res = await fetch(`/api/lookup?q=${encodeURIComponent(text)}&part=core`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '단어를 찾지 못했습니다.');
        core = json;
        try { localStorage.setItem(coreKey, JSON.stringify(core)); } catch {}
        setResult(core);
      }

      setLoadingCore(false);

      const nextRecent = [text, ...recent.filter((x) => x !== text)].slice(0, 7);
      setRecent(nextRecent);
      try { localStorage.setItem('wordpop-recent', JSON.stringify(nextRecent)); } catch {}

      // 단어 뜻이 화면에 먼저 그려진 뒤, 나머지는 동시에 백그라운드 로딩
      setLoadingExamples(true);
      setLoadingRelated(true);
      setLoadingSongs(true);

      const loadExamples = fetch(`/api/lookup?q=${encodeURIComponent(core.word)}&part=examples`)
        .then(r => r.json().then(j => ({ok:r.ok,j})))
        .then(({ok,j}) => { if (ok) setExamples(j.examples || []); })
        .catch(() => {})
        .finally(() => setLoadingExamples(false));

      const loadRelated = fetch(`/api/lookup?q=${encodeURIComponent(core.word)}&part=related`)
        .then(r => r.json().then(j => ({ok:r.ok,j})))
        .then(({ok,j}) => { if (ok) setRelated(j.related || []); })
        .catch(() => {})
        .finally(() => setLoadingRelated(false));

      const loadSongs = fetch(`/api/songs?term=${encodeURIComponent(core.word)}`)
        .then(r => r.json().then(j => ({ok:r.ok,j})))
        .then(({ok,j}) => { if (ok) setSongs(j.songs || []); })
        .catch(() => {})
        .finally(() => setLoadingSongs(false));

      void Promise.allSettled([loadExamples, loadRelated, loadSongs]);
    } catch (e) {
      setError(e.message || '검색 중 오류가 발생했습니다.');
      setResult(null);
      setLoadingCore(false);
      setLoadingExamples(false);
      setLoadingRelated(false);
      setLoadingSongs(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    search();
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => { setResult(null); setQuery(''); setError(''); }}>
          <span className="brandMark">W</span><span>WordPop</span>
        </button>
        <div className="tagline">발음부터 팝송까지</div>
      </header>

      <section className={result ? 'hero compact' : 'hero'}>
        {!result && (
          <div className="heroCopy">
            <span className="eyebrow">ENGLISH WORD COMPANION</span>
            <h1>단어 하나로<br/><strong>영어가 연결됩니다.</strong></h1>
            <p>가장 중요한 단어 뜻과 발음을 먼저 보여주고, 예문과 관련 단어, 팝송은 순서대로 불러옵니다.</p>
          </div>
        )}

        <form className="searchBox" onSubmit={onSubmit}>
          <span className="searchIcon">⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="영어 또는 한글을 입력하세요" aria-label="단어 검색"/>
          <button type="submit" disabled={loadingCore}>{loadingCore ? '뜻 찾는 중...' : '검색'}</button>
        </form>

        {!result && <div className="quickWords"><span>추천 검색</span>{starterWords.map((word) => <button key={word} onClick={() => search(word)}>{word}</button>)}</div>}
        {!result && recent.length > 0 && <div className="recentRow"><span>최근 검색</span>{recent.map((word) => <button key={word} onClick={() => search(word)}>{word}</button>)}</div>}
      </section>

      {error && <div className="errorCard">{error}</div>}

      {result && (
        <div className="content">
          <section className="wordCard panel priorityPanel">
            <div>
              <div className="sourceBadge">1순위 · 단어 뜻 + 발음</div>
              <div className="wordTitleRow"><h2>{result.word}</h2><button className="roundSpeak" onClick={() => speak(result.word)} aria-label="단어 발음 듣기">🔊</button></div>
              <div className="phonetic">{result.phonetic || '발음기호 정보 없음'}</div>
              {result.koreanPronunciation && <div className="koPronounce">한글식 발음 · {result.koreanPronunciation}</div>}
            </div>
            <div className="meaningStack">
              {meanings.slice(0,3).map((item,i)=><div className="meaningItem" key={i}><span>{item.partOfSpeech || 'word'}</span><strong>{item.korean || item.definition}</strong>{item.definition && item.korean && <small>{item.definition}</small>}</div>)}
            </div>
          </section>

          <section className="panel">
            <div className="sectionHead"><div><span className="sectionKicker">STEP 2</span><h3>예문으로 익히기</h3></div></div>
            {loadingExamples && <div className="songEmpty">예문을 불러오는 중...</div>}
            {!loadingExamples && <div className="exampleList">{examples.map((ex,i)=><article className="example" key={i}><div className="exampleNumber">{String(i+1).padStart(2,'0')}</div><div className="exampleText"><p>{ex.en}</p><span>{ex.ko}</span></div><button className="miniSpeak" onClick={()=>speak(ex.en)}>🔊</button></article>)}</div>}
          </section>

          <section className="panel">
            <div className="sectionHead"><div><span className="sectionKicker">STEP 3</span><h3>관련 단어</h3></div></div>
            {loadingRelated && <div className="songEmpty">관련 단어를 불러오는 중...</div>}
            {!loadingRelated && <div className="relatedGrid">{related.map((item)=><button key={item.word} className="relatedChip" onClick={()=>search(item.word)}><strong>{item.word}</strong><span>{item.ko}</span></button>)}</div>}
          </section>

          <section className="panel songPanel">
            <div className="sectionHead">
              <div><span className="sectionKicker">STEP 4</span><h3>🎵 팝송으로 기억하기</h3></div>
              <a className="youtubeAll" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.word+' song')}`} target="_blank" rel="noreferrer">YouTube에서 더 보기 ↗</a>
            </div>
            {loadingSongs && <div className="songEmpty">팝송을 마지막으로 불러오는 중...</div>}
            {!loadingSongs && songs.length>0 && <div className="songGrid">{songs.slice(0,6).map((song)=><a className="songCard" key={song.id} href={song.youtubeUrl} target="_blank" rel="noreferrer">{song.artwork ? <img src={song.artwork} alt=""/> : <div className="albumFallback">♪</div>}<div><strong>{song.title}</strong><span>{song.artist}</span><small>검색 단어 · {result.word}</small></div><b>▶</b></a>)}</div>}
            {!loadingSongs && songs.length===0 && <div className="songEmpty">관련 곡을 자동으로 찾지 못했습니다.</div>}
            <p className="copyrightNote">※ 전체 가사는 제공하지 않고 곡 정보와 외부 검색 링크를 제공합니다.</p>
          </section>
        </div>
      )}

      <footer>WordPop · 뜻과 발음을 먼저, 나머지는 순차적으로 · v2</footer>
    </main>
  );
}
