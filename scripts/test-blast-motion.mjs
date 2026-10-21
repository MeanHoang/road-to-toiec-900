import assert from 'node:assert/strict';
import { createBubbles, advanceBubbles } from '../features/game/blastMotion.js';
for (const [width,height] of [[1326,470],[374,580],[304,300],[700,170]]) {
  const bubbles=createBubbles(width,height,4,()=>.4);
  const initial=structuredClone(bubbles);
  for(let frame=0;frame<3600;frame++) {
    advanceBubbles(bubbles,width,height,1/60);
    for(const b of bubbles){assert.ok(Number.isFinite(b.x+b.y));assert.ok(b.x>=0&&b.y>=0&&b.x+b.size<=width+.01&&b.y+b.size<=height+.01);}
  }
  assert.ok(bubbles.some((b,i)=>Math.abs(b.x-initial[i].x)>3||Math.abs(b.y-initial[i].y)>3),'bubbles must travel, not only wiggle in place');
}
const moving=[{x:20,y:30,size:80,vx:-50,vy:0}];advanceBubbles(moving,400,300,2);assert.ok(moving[0].x>18,'background-tab delay must not teleport a bubble');
const frozen=createBubbles(800,450,4,()=>.4),anchor=structuredClone(frozen[0]);
for(let frame=0;frame<500;frame++)advanceBubbles(frozen,800,450,1/60,new Set([0]));
assert.equal(frozen[0].x,anchor.x);assert.equal(frozen[0].y,anchor.y);
const pair=[{x:30,y:30,size:80,vx:40,vy:0},{x:100,y:30,size:80,vx:-40,vy:0}];
advanceBubbles(pair,400,300,1/60);assert.ok(pair[0].vx<0&&pair[1].vx>0,'colliding answers bounce apart');
console.log('✓ Free motion, viewport bounds, wall/answer collisions, focus freeze and suspended-frame clamp');
