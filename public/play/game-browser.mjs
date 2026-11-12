// Keep native gestures from interrupting the game's pointer controls.
for(const type of ['contextmenu','selectstart','dragstart','dblclick','gesturestart','gesturechange','gestureend']){
 document.addEventListener(type,e=>{if(e.target instanceof Element&&e.target.closest('input,select'))return;if(e.cancelable)e.preventDefault();},{passive:false});
}
document.addEventListener('touchmove',e=>{
 if(e.target instanceof Element&&e.target.closest('input,select,#menu'))return;
 if(e.cancelable)e.preventDefault();
},{passive:false});
let lastTap=0;
document.addEventListener('touchend',e=>{
 const now=performance.now(),gameTarget=e.target instanceof Element&&e.target.closest('canvas,#stick,#actions');
 if(gameTarget&&now-lastTap<350&&e.cancelable)e.preventDefault();
 lastTap=now;
},{passive:false});
export async function toggleGameFullscreen(){
 const help=document.getElementById('fullscreenHelp');
 if(navigator.standalone||matchMedia('(display-mode: standalone)').matches){help.hidden=false;help.textContent='You’re already playing without the Safari toolbar.';return;}
 try{
  if(document.fullscreenElement||document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit?.call(document);return;}
  const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
  if(request){await request.call(root);return;}
 }catch{}
 help.hidden=false;
}
