// Secondary fingers must not depend on the browser synthesizing a click.
export function bindAction(button,action){
 button.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();e.stopPropagation();action();});
 // Retain keyboard and assistive-technology activation, without firing twice.
 button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(e.detail===0)action();});
}
