import { NextResponse } from 'next/server';

const CURATED={
  beautiful:[['Christina Aguilera','Beautiful'],['James Blunt',"You're Beautiful"],['Bazzi','Beautiful']],
  love:[['Taylor Swift','Love Story'],['Ellie Goulding','Love Me Like You Do'],['The Beatles','All You Need Is Love']],
  happy:[['Pharrell Williams','Happy'],['Marshmello & Bastille','Happier'],['Bobby McFerrin',"Don't Worry Be Happy"]],
  dream:[['Aerosmith','Dream On'],['The Cranberries','Dreams'],['Fleetwood Mac','Dreams']]
};

export async function GET(request){
  const {searchParams}=new URL(request.url);
  const term=(searchParams.get('term')||'').trim().toLowerCase();
  if(!term)return NextResponse.json({songs:[]});
  if(CURATED[term])return NextResponse.json({songs:CURATED[term].map(([artist,title],i)=>({id:`c-${i}`,artist,title,artwork:'',youtubeUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`}))});
  try{
    const res=await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=18`,{next:{revalidate:86400}});
    const data=await res.json();
    const exact=(data.results||[]).filter(x=>x.trackName?.toLowerCase().includes(term));
    const source=exact.length?exact:(data.results||[]).slice(0,6);
    return NextResponse.json({songs:source.slice(0,6).map(x=>({id:x.trackId,title:x.trackName,artist:x.artistName,artwork:(x.artworkUrl100||'').replace('100x100bb','300x300bb'),youtubeUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent(`${x.artistName} ${x.trackName}`)}`}))});
  }catch{return NextResponse.json({songs:[]});}
}
