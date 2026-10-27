"""Package generated atlases and record fixed ground/head anchors; no limb warping."""
from pathlib import Path
from PIL import Image
import json,sys
ROOT=Path(__file__).resolve().parents[1]
BASE=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'.hd2d-source'
OUT=ROOT/'sinais-enterrados/art/hd2d'
SOURCES={
 'hero':('exec-aabce6a5-1994-4cb3-931d-51ca83d4ccca.png',4,3),
 'npcs':('exec-a43c6956-5330-44ac-b0ef-29c78e34c64c.png',4,3),
 'enemies':('exec-6a3b931d-2b93-4d66-bc64-1ee2727d95bf.png',6,3),
 'rooms':('exec-9c1294e0-26c7-4eec-94d9-18d774fa66ed.png',2,3),
 'props':('exec-a5cb90b4-ebde-41a0-9993-446af8914dd7.png',4,2),
}
manifest={}
for name,(file,cols,rows) in SOURCES.items():
 im=Image.open(BASE/file).convert('RGBA');w,h=im.size;frames=[]
 for row in range(rows):
  for col in range(cols):
   x0,x1=round(col*w/cols),round((col+1)*w/cols);y0,y1=round(row*h/rows),round((row+1)*h/rows)
   cell=im.crop((x0,y0,x1,y1));mask=cell.getchannel('A').point(lambda v:255 if v>64 else 0);box=mask.getbbox() or (0,0,cell.width,cell.height)
   ax=cell.width/2
   if name in ['hero','npcs','enemies']:
    # Head-band connected components distinguish head from the pen behind it.
    lo=box[1]+round((box[3]-box[1])*.08);hi=box[1]+round((box[3]-box[1])*.24)
    pix=mask.load();seen=set();parts=[]
    for yy in range(lo,hi):
     for xx in range(cell.width):
      if (xx,yy) in seen or not pix[xx,yy]:continue
      todo=[(xx,yy)];seen.add((xx,yy));pts=[]
      while todo:
       qx,qy=todo.pop();pts.append((qx,qy))
       for nx,ny in [(qx-1,qy),(qx+1,qy),(qx,qy-1),(qx,qy+1)]:
        if 0<=nx<cell.width and lo<=ny<hi and (nx,ny) not in seen and pix[nx,ny]:seen.add((nx,ny));todo.append((nx,ny))
      parts.append(pts)
    if parts:
     points=max(parts,key=len);ax=(min(p[0] for p in points)+max(p[0] for p in points))/2
   frames.append({'x':x0,'y':y0,'w':x1-x0,'h':y1-y0,'bounds':list(box),'anchorX':round(ax,2),'foot':box[3]})
 im.save(OUT/(name+'.webp'),'WEBP',quality=91,method=6,exact=True)
 manifest[name]={'url':'art/hd2d/'+name+'.webp','width':w,'height':h,'cols':cols,'rows':rows,'frames':frames,'rowHeights':[max(f['bounds'][3]-f['bounds'][1] for f in frames[r*cols:(r+1)*cols]) for r in range(rows)]}
 print(name, im.size, (OUT/(name+'.webp')).stat().st_size, [f['anchorX'] for f in frames][:6])
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'manifest.js').write_text('window.HD2D_ATLAS='+json.dumps(manifest,separators=(',',':'))+';\n')
