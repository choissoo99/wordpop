import { NextResponse } from 'next/server';

const KO_TO_EN={
  사과:'apple',사랑:'love',행복:'happy',행복한:'happy',아름다운:'beautiful',아름답다:'beautiful',꿈:'dream',
  친구:'friend',가족:'family',학교:'school',공부:'study',책:'book',음악:'music',노래:'song',시간:'time',
  물:'water',불:'fire',하늘:'sky',바다:'sea',집:'home',엄마:'mother',아빠:'father',아이:'child',
  좋은:'good',좋다:'good',나쁜:'bad',크다:'big',작다:'small',빠르다:'fast',느리다:'slow',
  새롭다:'new',예쁜:'pretty',강하다:'strong',약하다:'weak',먹다:'eat',마시다:'drink',가다:'go',
  오다:'come',보다:'see',듣다:'listen',말하다:'speak',읽다:'read',쓰다:'write',웃다:'smile',희망:'hope',
  가운데:'middle',중간:'middle',중앙:'center',센터:'center'
};

const KO_MEANING={
  apple:'사과',love:'사랑, 사랑하다',happy:'행복한, 기쁜',beautiful:'아름다운, 멋진',dream:'꿈, 꿈꾸다',
  friend:'친구',family:'가족',school:'학교',study:'공부하다, 연구',book:'책, 예약하다',music:'음악',song:'노래',
  time:'시간, 때',water:'물',fire:'불, 발사하다',sky:'하늘',sea:'바다',home:'집, 가정',mother:'어머니',
  father:'아버지',child:'아이, 어린이',good:'좋은, 훌륭한',bad:'나쁜',big:'큰',small:'작은',fast:'빠른, 빨리',
  slow:'느린, 천천히',new:'새로운',pretty:'예쁜, 꽤',strong:'강한',weak:'약한',eat:'먹다',drink:'마시다, 음료',
  go:'가다',come:'오다',see:'보다, 알다',listen:'듣다',speak:'말하다',read:'읽다',write:'쓰다',
  smile:'미소, 웃다',hope:'희망, 바라다',middle:'중간, 가운데, 중앙의',center:'중심, 중앙, 중심에 두다'
};

const PRONUNCIATION_KO={
  apple:'애플',love:'러브',happy:'해피',beautiful:'뷰티풀',dream:'드림',friend:'프렌드',family:'패밀리',
  school:'스쿨',study:'스터디',book:'북',music:'뮤직',song:'송',time:'타임',water:'워터',fire:'파이어',
  sky:'스카이',sea:'씨',home:'홈',mother:'마더',father:'파더',child:'차일드',good:'굿',bad:'배드',big:'빅',
  small:'스몰',fast:'패스트',slow:'슬로우',new:'뉴',pretty:'프리티',strong:'스트롱',weak:'위크',eat:'잇',
  drink:'드링크',go:'고우',come:'컴',see:'씨',listen:'리슨',speak:'스피크',read:'리드',write:'라이트',
  smile:'스마일',hope:'호프',middle:'미들',center:'센터'
};

const EXAMPLES={
  beautiful:[['She has a beautiful smile.','그녀는 아름다운 미소를 가지고 있다.'],["It's a beautiful day.",'아름다운 날이야.'],['The view is beautiful.','경치가 아름답다.']],
  love:[['I love this song.','나는 이 노래를 정말 좋아해.'],['Love can change people.','사랑은 사람을 변화시킬 수 있다.'],['They love spending time together.','그들은 함께 시간을 보내는 것을 좋아한다.']],
  happy:[['I am happy to see you.','너를 만나서 기뻐.'],['She looks very happy today.','그녀는 오늘 매우 행복해 보인다.'],['Music makes me happy.','음악은 나를 행복하게 한다.']],
  apple:[['I eat an apple every morning.','나는 매일 아침 사과 한 개를 먹는다.'],['This apple is sweet.','이 사과는 달다.'],['She cut the apple in half.','그녀는 사과를 반으로 잘랐다.']],
  dream:[['Never give up on your dream.','네 꿈을 절대 포기하지 마.'],['I had a strange dream last night.','나는 어젯밤 이상한 꿈을 꾸었다.'],['She dreams of becoming a singer.','그녀는 가수가 되는 것을 꿈꾼다.']],
  middle:[['He stood in the middle of the room.','그는 방 한가운데에 서 있었다.'],['The store is in the middle of the street.','그 가게는 거리 중간에 있다.'],['She woke up in the middle of the night.','그녀는 한밤중에 잠에서 깼다.']],
  center:[['The table is in the center of the room.','탁자는 방 중앙에 있다.'],['The city center is very busy.','도심은 매우 붐빈다.'],['Please center the image on the page.','이미지를 페이지 중앙에 맞춰 주세요.']]
};

const RELATED={
  beautiful:[['beauty','아름다움'],['pretty','예쁜'],['gorgeous','아주 아름다운'],['attractive','매력적인'],['beautifully','아름답게']],
  love:[['lovely','사랑스러운'],['lover','연인'],['beloved','사랑받는'],['heart','마음'],['affection','애정']],
  happy:[['happiness','행복'],['glad','기쁜'],['joy','기쁨'],['smile','미소'],['cheerful','쾌활한']],
  apple:[['fruit','과일'],['sweet','달콤한'],['fresh','신선한'],['tree','나무'],['red','빨간']],
  dream:[['hope','희망'],['wish','소원'],['goal','목표'],['imagine','상상하다'],['sleep','잠']],
  middle:[['center','중심'],['midpoint','중간 지점'],['central','중앙의'],['between','사이에'],['halfway','중간쯤에']],
  center:[['middle','중간'],['central','중앙의'],['core','핵심'],['heart','중심부'],['focus','초점']]
};

const isKorean=(text)=>/[가-힣]/.test(text);
const cleanWord=(text='')=>text.toLowerCase().trim().replace(/[^a-z'-]/g,'');
const posMap={n:'noun',v:'verb',adj:'adjective',adv:'adverb',u:'word'};

async function fastFetch(url,options={},ms=1200){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{
    return await fetch(url,{...options,signal:controller.signal});
  }finally{
    clearTimeout(timer);
  }
}

async function translate(text,langpair){
  try{
    const res=await fastFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`,{next:{revalidate:604800}},900);
    if(!res.ok)return '';
    const data=await res.json();
    return typeof data?.responseData?.translatedText==='string' ? data.responseData.translatedText.trim() : '';
  }catch{return '';}
}

async function getDictionary(word){
  try{
    const res=await fastFetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,{next:{revalidate:604800}},1200);
    if(!res.ok)return null;
    const entry=(await res.json())?.[0];
    if(!entry)return null;
    const phonetic=entry.phonetic||entry.phonetics?.find(x=>x.text)?.text||'';
    const meanings=(entry.meanings||[]).slice(0,4).map(m=>({
      partOfSpeech:m.partOfSpeech||'word',
      definition:m.definitions?.[0]?.definition||''
    })).filter(x=>x.definition);
    const examples=(entry.meanings||[]).flatMap(m=>m.definitions||[]).map(d=>d.example).filter(Boolean).slice(0,3);
    const synonyms=[...new Set((entry.meanings||[]).flatMap(m=>m.synonyms||[]))].slice(0,5);
    return {word:entry.word||word,phonetic,meanings,examples,synonyms};
  }catch{return null;}
}

async function getDatamuse(word){
  try{
    const res=await fastFetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dp&max=5`,{next:{revalidate:604800}},1200);
    if(!res.ok)return null;
    const data=await res.json();
    const exact=(data||[]).find(x=>x.word?.toLowerCase()===word.toLowerCase()) || data?.[0];
    if(!exact)return null;
    const defs=(exact.defs||[]).slice(0,4).map(raw=>{
      const [tag,...rest]=raw.split('\t');
      return {partOfSpeech:posMap[tag]||tag||'word',definition:rest.join(' ').trim()};
    }).filter(x=>x.definition);
    const pron=(exact.tags||[]).find(t=>t.startsWith('pron:'))?.slice(5)||'';
    const related=(data||[]).filter(x=>x.word&&x.word!==word).map(x=>x.word).slice(0,5);
    return {word:exact.word||word,phonetic:pron,meanings:defs,examples:[],synonyms:related};
  }catch{return null;}
}

async function resolveEnglishFromKorean(original){
  if(KO_TO_EN[original])return KO_TO_EN[original];
  const translated=await translate(original,'ko|en');
  return cleanWord(translated.toLowerCase().match(/[a-z][a-z'-]*/)?.[0]||'');
}

export async function GET(request){
  const {searchParams}=new URL(request.url);
  const original=(searchParams.get('q')||'').trim();
  const part=(searchParams.get('part')||'core').toLowerCase();
  if(!original)return NextResponse.json({error:'검색어를 입력해 주세요.'},{status:400});

  const inputLanguage=isKorean(original)?'ko':'en';
  const word=inputLanguage==='ko' ? await resolveEnglishFromKorean(original) : cleanWord(original);
  if(!word)return NextResponse.json({error:`“${original}”에 해당하는 영어 단어를 찾지 못했습니다.`},{status:404});

  if(part==='examples'){
    const preset=EXAMPLES[word]?.map(([en,ko])=>({en,ko}));
    if(preset?.length){
      return NextResponse.json({examples:preset.slice(0,3)},{headers:{'Cache-Control':'public, s-maxage=2592000, stale-while-revalidate=2592000'}});
    }
    const data=await getDictionary(word);
    const examples=(data?.examples||[]).slice(0,3).map(en=>({en,ko:'영어 문장으로 먼저 익혀보세요.'}));
    const fallback=examples.length?examples:[
      {en:`I learned the word “${word}” today.`,ko:`오늘 “${word}”라는 단어를 배웠습니다.`},
      {en:`Can you use “${word}” in a sentence?`,ko:`“${word}”를 문장에서 사용할 수 있나요?`}
    ];
    return NextResponse.json({examples:fallback},{headers:{'Cache-Control':'public, s-maxage=604800, stale-while-revalidate=2592000'}});
  }

  if(part==='related'){
    const preset=RELATED[word]?.map(([w,ko])=>({word:w,ko}));
    if(preset?.length){
      return NextResponse.json({related:preset.slice(0,5)},{headers:{'Cache-Control':'public, s-maxage=2592000, stale-while-revalidate=2592000'}});
    }
    const dictionary=await getDictionary(word);
    let related=(dictionary?.synonyms||[]).slice(0,5).map(w=>({word:w,ko:'관련 단어'}));
    if(!related.length){
      const datamuse=await getDatamuse(word);
      related=(datamuse?.synonyms||[]).slice(0,5).map(w=>({word:w,ko:'관련 단어'}));
    }
    return NextResponse.json({related},{headers:{'Cache-Control':'public, s-maxage=604800, stale-while-revalidate=2592000'}});
  }

  const knownKorean=KO_MEANING[word] || (inputLanguage==='ko' ? original : '');
  const [dictionary,datamuse,translatedMeaning]=await Promise.all([
    getDictionary(word),
    getDatamuse(word),
    knownKorean ? Promise.resolve(knownKorean) : translate(word,'en|ko')
  ]);

  const data=dictionary||datamuse;
  if(!data)return NextResponse.json({error:`“${word}” 단어 정보를 찾지 못했습니다. 철자를 확인해 주세요.`},{status:404});

  const phonetic=(dictionary?.phonetic || datamuse?.phonetic || '').trim();
  const meanings=(data.meanings?.length?data.meanings:[{partOfSpeech:'word',definition:'영어 단어'}]).slice(0,3).map((m,i)=>({
    ...m,korean:i===0?(translatedMeaning||''):''
  }));

  return NextResponse.json({
    original,inputLanguage,word:data.word||word,phonetic,
    koreanPronunciation:PRONUNCIATION_KO[word]||'',meanings
  },{
    headers:{'Cache-Control':'public, s-maxage=604800, stale-while-revalidate=2592000'}
  });
}
