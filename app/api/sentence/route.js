import { NextResponse } from 'next/server';
import { CORE_WORDS } from '../../coreWords';

const STOPWORDS=new Set([
  'a','an','the','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their',
  'is','am','are','was','were','be','been','being','do','does','did','have','has','had','will','would','can','could','should',
  'to','of','in','on','at','for','from','with','and','or','but','if','then','than','that','this','these','those','as','by',
  'not','no','yes','very','too','so','just','really'
]);

async function fastFetch(url,ms=1600){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{return await fetch(url,{signal:controller.signal,next:{revalidate:86400}});}
  finally{clearTimeout(timer);}
}

async function translate(text,langpair){
  try{
    const res=await fastFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`,1600);
    if(!res.ok)return '';
    const data=await res.json();
    return typeof data?.responseData?.translatedText==='string' ? data.responseData.translatedText.trim() : '';
  }catch{return '';}
}

function isKorean(text){return /[가-힣]/.test(text);}

function extractEnglishKeywords(sentence){
  const words=[...new Set((sentence.toLowerCase().match(/[a-z][a-z'-]*/g)||[]))];
  return words
    .filter(w=>!STOPWORDS.has(w) && w.length>1)
    .slice(0,8)
    .map(word=>{
      const local=CORE_WORDS[word];
      return {
        word,
        meaning:local?.m||'단어 뜻 보기',
        phonetic:local?.ipa||''
      };
    });
}

export async function GET(request){
  const {searchParams}=new URL(request.url);
  const q=(searchParams.get('q')||'').trim();
  if(!q)return NextResponse.json({error:'문장을 입력해 주세요.'},{status:400});

  const korean=isKorean(q);
  const translation=await translate(q,korean?'ko|en':'en|ko');

  const englishSentence=korean ? translation : q;
  const keywords=extractEnglishKeywords(englishSentence||'');

  return NextResponse.json({
    type:'sentence',
    original:q,
    inputLanguage:korean?'ko':'en',
    translation:translation||'번역을 불러오지 못했습니다.',
    speakText:korean ? (translation||q) : q,
    keywords
  },{
    headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}
  });
}
