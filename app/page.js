'use client';

import { useEffect, useMemo, useState } from 'react';

const starterWords = ['apple', 'love', 'happy', 'beautiful', 'dream'];

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
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
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
    setSongs([]);

    const cacheKey = `wordpop-cache:${text.toLowerCase()}`;
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch {}

    if (cached) {
      setResult(cached);
      setLoading(false);
      fetch(`/api/songs?term=${encodeURIComponent(cached.word)}`)
        .then((r) => r.json())
        .then((j) => setSongs(j.songs || []))
        .catch(() => {});
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const lookupRes = await fetch(`/api/lookup?q=${encodeURIComponent(text)}`);
      const lookup = await lookupRes.json();
      if (!lookupRes.ok) throw new Error(lookup.error || '단어를 찾지 못했습니다.');
      setResult(lookup);
      setLoading(false);
      try { localStorage.setItem(cacheKey, JSON.stringify(lookup)); } catch {}

      const nextRecent = [text, ...recent.filter((x) => x !== text)].slice(0, 7);
      setRecent(nextRecent);
      localStorage.setItem('wordpop-recent', JSON.stringify(nextRecent));

      fetch(`/api/songs?term=${encodeURIComponent(lookup.word)}`)
        .then((r) => r.json())
        .then((j) => setSongs(j.songs || []))
        .catch(() => {});
    } catch (e) {
      setError(e.message || '검색 중 오류가 발생했습니다.');
      setLoading(false);
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
            <p>영어 또는 한글을 입력하면 발음기호, 뜻, 예문, 관련 단어와 팝송까지 한 화면에서 공부하세요.</p>
          </div>
        )}

        <form className="searchBox" onSubmit={onSubmit}>
          <span className="searchIcon">⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="영어 또는 한글을 입력하세요  예) beautiful, 아름다운" aria-label="단어 검색"/>
          <button type="submit" disabled={loading}>{loading ? '찾는 중...' : '검색'}</button>
        </form>

        {!result && <div className="quickWords"><span>추천 검색</span>{starterWords.map((word) => <button key={word} onClick={() => search(word)}>{word}</button>)}</div>}
        {!result && recent.length > 0 && <div className="recentRow"><span>최근 검색</span>{recent.map((word) => <button key={word} onClick={() => search(word)}>{word}</button>)}</div>}
      </section>

      {error && <div className="errorCard">{error}</div>}

      {result && (
        <div className="content">
          <section className="wordCard panel">
            <div>
              <div className="sourceBadge">{result.inputLanguage === 'ko' ? `“${result.original}” → 영어` : '영어 단어'}</div>
              <div className="wordTitleRow"><h2>{result.word}</h2><button className="roundSpeak" onClick={() => speak(result.word)} aria-label="단어 발음 듣기">🔊</button></div>
              <div className="phonetic">{result.phonetic || '발음기호 정보 없음'}</div>
              {result.koreanPronunciation && <div className="koPronounce">한글식 발음 · {result.koreanPronunciation}</div>}
            </div>
            <div className="meaningStack">
              {meanings.slice(0,4).map((item,i)=><div className="meaningItem" key={i}><span>{item.partOfSpeech || 'word'}</span><strong>{item.korean || item.definition}</strong>{item.definition && item.korean && <small>{item.definition}</small>}</div>)}
            </div>
          </section>

          <section className="panel">
            <div className="sectionHead"><div><span className="sectionKicker">EXAMPLES</span><h3>예문으로 익히기</h3></div></div>
            <div className="exampleList">
              {(result.examples || []).map((ex,i)=><article className="example" key={i}><div className="exampleNumber">{String(i+1).padStart(2,'0')}</div><div className="exampleText"><p>{ex.en}</p><span>{ex.ko}</span></div><button className="miniSpeak" onClick={()=>speak(ex.en)}>🔊</button></article>)}
            </div>
          </section>

          <section className="panel">
            <div className="sectionHead"><div><span className="sectionKicker">RELATED WORDS</span><h3>관련 단어</h3></div></div>
            <div className="relatedGrid">{(result.related || []).map((item)=><button key={item.word} className="relatedChip" onClick={()=>search(item.word)}><strong>{item.word}</strong><span>{item.ko}</span></button>)}</div>
          </section>

          <section className="panel songPanel">
            <div className="sectionHead">
              <div><span className="sectionKicker">LEARN WITH MUSIC</span><h3>🎵 팝송으로 기억하기</h3></div>
              <a className="youtubeAll" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.word+' song')}`} target="_blank" rel="noreferrer">YouTube에서 더 보기 ↗</a>
            </div>
            {songs.length>0 ? <div className="songGrid">{songs.slice(0,6).map((song)=><a className="songCard" key={song.id} href={song.youtubeUrl} target="_blank" rel="noreferrer">{song.artwork ? <img src={song.artwork} alt=""/> : <div className="albumFallback">♪</div>}<div><strong>{song.title}</strong><span>{song.artist}</span><small>검색 단어 · {result.word}</small></div><b>▶</b></a>)}</div> : <div className="songEmpty">관련 곡을 자동으로 찾지 못했습니다.</div>}
            <p className="copyrightNote">※ 저작권 보호를 위해 전체 가사는 제공하지 않고 곡 정보와 외부 검색 링크를 제공합니다.</p>
          </section>
        </div>
      )}
      <footer>WordPop · 단어 하나로 발음부터 팝송까지</footer>
    </main>
  );
}
