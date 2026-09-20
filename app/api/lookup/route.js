import { NextResponse } from 'next/server';

const KO_TO_EN={사과:'apple',사랑:'love',행복:'happy',행복한:'happy',아름다운:'beautiful',아름답다:'beautiful',꿈:'dream',친구:'friend',가족:'family',학교:'school',공부:'study',책:'book',음악:'music',노래:'song',시간:'time',물:'water',불:'fire',하늘:'sky',바다:'sea',집:'home',엄마:'mother',아빠:'father',아이:'child',좋은:'good',좋다:'good',나쁜:'bad',크다:'big',작다:'small',빠르다:'fast',느리다:'slow',새롭다:'new',예쁜:'pretty',강하다:'strong',약하다:'weak',먹다:'eat',마시다:'drink',가다:'go',오다:'come',보다:'see',듣다:'listen',말하다:'speak',읽다:'read',쓰다:'write',웃다:'smile',희망:'hope'};
const KO_MEANING={apple:'사과',love:'사랑, 사랑하다',happy:'행복한, 기쁜',beautiful:'아름다운, 멋진',dream:'꿈, 꿈꾸다',friend:'친구',family:'가족',school:'학교',study:'공부하다, 연구',book:'책, 예약하다',music:'음악',song:'노래',time:'시간, 때',water:'물',fire:'불, 발사하다',sky:'하늘',sea:'바다',home:'집, 가정',mother:'어머니',father:'아버지',child:'아이, 어린이',good:'좋은, 훌륭한',bad:'나쁜',big:'큰',small:'작은',fast:'빠른, 빨리',slow:'느린, 천천히',new:'새로운',pretty:'예쁜, 꽤',strong:'강한',weak:'약한',eat:'먹다',drink:'마시다, 음료',go:'가다',come:'오다',see:'보다, 알다',listen:'듣다',speak:'말하다',read:'읽다',write:'쓰다',smile:'미소, 웃다',hope:'희망, 바라다'};
const PRONUNCIATION_KO={apple:'애플',love:'러브',happy:'해피',beautiful:'뷰티풀',dream:'드림',friend:'프렌드',family:'패밀리',school:'스쿨',study:'스터디',book:'북',music:'뮤직',song:'송',time:'타임',water:'워터',fire:'파이어',sky:'스카이',sea:'씨',home:'홈',mother:'마더',father:'파더',child:'차일드',good:'굿',bad:'배드',big:'빅',small:'스몰',fast:'패스트',slow:'슬로우',new:'뉴',pretty:'프리티',strong:'스트롱',weak:'위크',eat:'잇',drink:'드링크',go:'고우',come:'컴',see:'씨',listen:'리슨',speak:'스피크',read:'리드',write:'라이트',smile:'스마일',hope:'호프'};
const EXAMPLES={beautiful:[['She has a beautiful smile.','그녀는 아름다운 미소를 가지고 있다.'],["It's a beautiful day.",'아름다운 날이야.'],['The view is beautiful.','경치가 아름답다.']],love:[['I love this song.','나는 이 노래를 정말 좋아해.'],['Love can change people.','사랑은 사람을 변화시킬 수 있다.'],['They love spending time together.','그들은 함께 시간을 보내는 것을 좋아한다.']],happy:[['I am happy to see you.','너를 만나서 기뻐.'],['She looks very happy today.','그녀는 오늘 매우 행복해 보인다.'],['Music makes me happy.','음악은 나를 행복하게 한다.']],apple:[['I eat an apple every morning.','나는 매일 아침 사과 한 개를 먹는다.'],['This apple is sweet.','이 사과는 달다.'],['She cut the apple in half.','그녀는 사과를 반으로 잘랐다.']],dream:[['Never give up on your dream.','네 꿈을 절대 포기하지 마.'],['I had a strange dream last night.','나는 어젯밤 이상한 꿈을 꾸었다.'],['She dreams of becoming a singer.','그녀는 가수가 되는 것을 꿈꾼다.']]};
const RELATED={beautiful:[['beauty','아름다움'],['pretty','예쁜'],['gorgeous','아주 아름다운'],['attractive','매력적인'],['beautifully','아름답게']],love:[['lovely','사랑스러운'],['lover','연인'],['beloved','사랑받는'],['heart','마음'],['affection','애정']],happy:[['happiness','행복'],['glad','기쁜'],['joy','기쁨'],['smile','미소'],['cheerful','쾌활한']],apple:[['fruit','과일'],['sweet','달콤한'],['fresh','신선한'],['tree','나무'],['red','빨간']],dream:[['hope','희망'],['wish','소원'],['goal','목표'],['imagine','상상하다'],['sleep','잠']]};
const isKorean=(t)=>/[가-힣]/.test(t);

export async function GET(request){
  const {searchParams}=new URL(request.url);
  const original=(searchParams.get('q')||'').trim();
  if(!original)return NextResponse.json({error:'검색어를 입력해 주세요.'},{status:400});
  const inputLanguage=isKorean(original)?'ko':'en';
  let word=inputLanguage==='ko'?KO_TO_EN[original]:original.toLowerCase();
  if(!word)return NextResponse.json({error:`“${original}”은(는) 현재 한글 사전에 없습니다.`},{status:404});
  word=word.replace(/[^a-zA-Z'-]/g,'');
  try{
    const res=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,{next:{revalidate:86400}});
    if(!res.ok)throw new Error();
    const entry=(await res.json())[0];
    const phonetic=entry.phonetic||entry.phonetics?.find(x=>x.text)?.text||'';
    const meanings=(entry.meanings||[]).slice(0,4).map((m,i)=>({partOfSpeech:m.partOfSpeech,definition:m.definitions?.[0]?.definition||'',korean:i===0?(KO_MEANING[word]||''):''}));
    const dictExamples=(entry.meanings||[]).flatMap(m=>m.definitions||[]).map(d=>d.example).filter(Boolean).slice(0,3);
    let examples=EXAMPLES[word]?.map(([en,ko])=>({en,ko}))||dictExamples.map(en=>({en,ko:'예문 해석은 추후 자동 번역 기능으로 확장할 수 있습니다.'}));
    if(!examples.length)examples=[{en:`I learned the word “${word}” today.`,ko:`나는 오늘 “${word}”라는 단어를 배웠다.`}];
    const synonyms=[...new Set((entry.meanings||[]).flatMap(m=>m.synonyms||[]))].slice(0,5);
    const related=RELATED[word]?.map(([w,ko])=>({word:w,ko}))||synonyms.map(w=>({word:w,ko:'관련 단어'}));
    return NextResponse.json({original,inputLanguage,word:entry.word||word,phonetic,koreanPronunciation:PRONUNCIATION_KO[word]||'',meanings,examples:examples.slice(0,3),related:related.slice(0,5)});
  }catch{
    if(KO_MEANING[word])return NextResponse.json({original,inputLanguage,word,phonetic:'',koreanPronunciation:PRONUNCIATION_KO[word]||'',meanings:[{partOfSpeech:'word',definition:'기본 내장 단어',korean:KO_MEANING[word]}],examples:(EXAMPLES[word]||[]).map(([en,ko])=>({en,ko})),related:(RELATED[word]||[]).map(([w,ko])=>({word:w,ko}))});
    return NextResponse.json({error:'사전 서비스에서 해당 단어를 찾지 못했습니다.'},{status:404});
  }
}
