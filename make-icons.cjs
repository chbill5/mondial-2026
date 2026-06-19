const fs=require('fs'), zlib=require('zlib');
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1));}return(~c)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);const t=Buffer.from(type,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);return Buffer.concat([len,t,data,crc]);}
function png(S){
  const navy=[12,31,43],white=[255,255,255],blue=[0,35,149],red=[237,41,57];
  const cx=S/2,cy=S*0.45,r=S*0.30;
  const y0=Math.round(S*0.78),y1=Math.round(S*0.87),x0=Math.round(S*0.23),x1=Math.round(S*0.77),seg=(x1-x0)/3;
  const raw=Buffer.alloc(S*(1+S*3));let p=0;
  for(let y=0;y<S;y++){raw[p++]=0;for(let x=0;x<S;x++){let col=navy;const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=r*r)col=white;if(y>=y0&&y<y1&&x>=x0&&x<x1){const si=Math.floor((x-x0)/seg);col=si<=0?blue:(si===1?white:red);}raw[p++]=col[0];raw[p++]=col[1];raw[p++]=col[2];}}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(S,0);ihdr.writeUInt32BE(S,4);ihdr[8]=8;ihdr[9]=2;
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
fs.writeFileSync('icon-192.png',png(192));
fs.writeFileSync('icon-512.png',png(512));
console.log('icons OK');
