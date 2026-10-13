() => {
  if (window.veilCanvasObserver) window.veilCanvasObserver.disconnect();
  const setBridge = (payload) => {
    const input = document.querySelector('#veil-mask-data textarea, #veil-mask-data input');
    if (!input) return;
    input.value = payload;
    input.dispatchEvent(new Event('input', {bubbles:true}));
  };
  const init = () => {
    document.querySelectorAll('[data-veil-canvas]').forEach(host => {
      if (host.dataset.ready) return;
      host.dataset.ready = 'loading';
      const image = host.querySelector('[data-background]');
      const canvas = host.querySelector('canvas');
      const status = host.querySelector('[data-canvas-status]');
      const start = () => {
        if (host.dataset.ready === 'yes') return;
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        const mask = document.createElement('canvas');
        mask.width = canvas.width; mask.height = canvas.height;
        const pen = mask.getContext('2d');
        let tool='draw', drawing=false, previous=null, pointerId=null;
        const history=[];
        const size=host.querySelector('[data-size]');
        const view=host.querySelector('.veil-canvas-view');
        let zoom=1;
        const applyZoom=(next)=>{
          const old=zoom;
          const centreX=(view.scrollLeft+view.clientWidth/2)/old;
          const centreY=(view.scrollTop+view.clientHeight/2)/old;
          zoom=Math.max(0.1,Math.min(8,next));
          canvas.style.maxWidth='none';canvas.style.maxHeight='none';
          canvas.style.width=(canvas.width*zoom)+'px';canvas.style.height=(canvas.height*zoom)+'px';
          host.querySelector('[data-zoom-label]').textContent=Math.round(zoom*100)+'%';
          view.scrollLeft=Math.max(0,centreX*zoom-view.clientWidth/2);
          view.scrollTop=Math.max(0,centreY*zoom-view.clientHeight/2);
        };
        const fitZoom=()=>applyZoom(Math.min(1,(view.clientWidth||canvas.width)/canvas.width,650/canvas.height));
        host.querySelector('[data-zoom-in]').addEventListener('click',()=>applyZoom(zoom*1.25));
        host.querySelector('[data-zoom-out]').addEventListener('click',()=>applyZoom(zoom/1.25));
        host.querySelector('[data-zoom-fit]').addEventListener('click',fitZoom);
        host.querySelector('[data-zoom-original]').addEventListener('click',()=>applyZoom(1));
        canvas.addEventListener('wheel',event=>{
          if(!event.ctrlKey)return;
          event.preventDefault();applyZoom(zoom*(event.deltaY<0?1.1:1/1.1));
        },{passive:false});
        const redraw = () => {
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(image,0,0);
          ctx.save(); ctx.globalAlpha=0.8; ctx.drawImage(mask,0,0); ctx.restore();
        };
        const exportMask = () => JSON.stringify({key:host.dataset.key,mask:mask.toDataURL('image/png')});
        const publish = () => setBridge(exportMask());
        const snapshot = () => { history.push(mask.toDataURL('image/png')); if(history.length>15)history.shift(); };
        const position = event => {
          const r=canvas.getBoundingClientRect();
          return {x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height};
        };
        const segment = (from,to) => {
          pen.globalCompositeOperation=tool==='erase'?'destination-out':'source-over';
          pen.strokeStyle='#ff3366';pen.fillStyle='#ff3366';
          pen.lineWidth=Number(size.value);pen.lineCap='round';pen.lineJoin='round';
          pen.beginPath();pen.moveTo(from.x,from.y);pen.lineTo(to.x,to.y);pen.stroke();
          pen.beginPath();pen.arc(to.x,to.y,Number(size.value)/2,0,Math.PI*2);pen.fill();
          // This is a synchronous Canvas redraw, including while the button is held.
          redraw();
        };
        canvas.addEventListener('pointerdown', event => {
          if(event.button!==0 || drawing)return;
          event.preventDefault();canvas.focus();snapshot();drawing=true;pointerId=event.pointerId;
          canvas.setPointerCapture(event.pointerId);previous=position(event);segment(previous,previous);
          status.textContent=tool==='erase'?'選択範囲を消しています':'描画中';
        });
        canvas.addEventListener('pointermove',event => {
          if(!drawing || event.pointerId!==pointerId)return;
          event.preventDefault();
          const events=event.getCoalescedEvents?event.getCoalescedEvents():[event];
          for(const item of events.length?events:[event]){const next=position(item);segment(previous,next);previous=next;}
        });
        const finish=event => {
          if(!drawing || event.pointerId!==pointerId)return;
          drawing=false;previous=null;pointerId=null;
          if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
          publish();status.textContent='範囲を指定しました。「選択した範囲を処理して保存」で反映します。';
        };
        canvas.addEventListener('pointerup',finish);
        canvas.addEventListener('pointercancel',finish);
        canvas.addEventListener('lostpointercapture',finish);
        host.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>{
          tool=button.dataset.tool;
          host.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
          status.textContent=tool==='draw'?'ペンで閉じた線を描いてください':'選択範囲を消せます';
        }));
        size.addEventListener('input',()=>host.querySelector('[data-size-label]').textContent=size.value);
        host.querySelector('[data-clear]').addEventListener('click',()=>{
          snapshot();pen.clearRect(0,0,mask.width,mask.height);redraw();publish();status.textContent='選択範囲をクリアしました。';
        });
        host.querySelector('[data-undo]').addEventListener('click',()=>{
          if(!history.length)return;
          const saved=new Image();saved.onload=()=>{pen.clearRect(0,0,mask.width,mask.height);pen.globalCompositeOperation='source-over';pen.drawImage(saved,0,0);redraw();publish();};saved.src=history.pop();
        });
        host.veilExport=exportMask;
        fitZoom();redraw();publish();host.dataset.ready='yes';status.textContent='左クリックを押したまま、漏れた場所を囲んでください。拡大は＋またはCtrl＋ホイール、移動はスクロールバーを使えます。';
      };
      image.addEventListener('load',start,{once:true});
      image.addEventListener('error',()=>status.textContent='画像を読み込めません。「読み直す」を押してください。',{once:true});
      if(image.complete && image.naturalWidth)start();
    });
  };
  window.veilCanvasExport = () => document.querySelector('[data-veil-canvas]')?.veilExport?.() || '';
  window.veilCanvasObserver=new MutationObserver(init);
  window.veilCanvasObserver.observe(document.body,{childList:true,subtree:true});
  init();
}
