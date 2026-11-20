export const characters = [
  {id:'sage',name:'Sage',col:0,row:0,description:'A curious mind, a quiet clue.'},
  {id:'amber',name:'Amber',col:50,row:0,description:'A little charm. A sharp instinct.'},
  {id:'mint',name:'Mint',col:100,row:0,description:'Cool, calm, and hard to read.'},
  {id:'blue',name:'Blue',col:0,row:100,description:'Listen closely. Find the detail.'},
  {id:'violet',name:'Violet',col:50,row:100,description:'There is always another possibility.'},
  {id:'coral',name:'Coral',col:100,row:100,description:'A warm welcome. A clever disguise.'},
  {id:'pearl',name:'Pearl',col:0,row:0,image:'/lobby-art/pearl.png',grid:'100% 100%',description:'A gentle smile. Nothing slips past.'},
  {id:'rust',name:'Rust',col:0,row:0,image:'/lobby-art/rust.png',grid:'100% 100%',description:'A steady gaze. A surprising clue.'},
].map(c=>({image:'/lobby-art/members.png',grid:'300% 200%',...c}));
export function isCharacter(id){return characters.some(c=>c.id===id);}
export function characterFor(id,index=0){return characters.find(c=>c.id===id)||characters[((index%characters.length)+characters.length)%characters.length];}
