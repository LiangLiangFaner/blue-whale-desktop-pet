'use strict';
const api=window.petApi, $=s=>document.querySelector(s);
let state={},currentSettings={},busy=false,attached=false,gameTimer=null,gameEnd=0,score=0;
let activeReply=null,settingsDirty=false,interactionDraft=[];
function setSettingsDirty(value){
 settingsDirty=value;const status=$('#save-state');status.textContent=value?'有未保存的更改':'所有更改已保存';status.classList.toggle('dirty',value);$('#save-settings').textContent=value?'保存更改':'保存设置';
}
function syncSettingDependencies(){
 const form=$('#settings-form');form.elements.perchFrequency.disabled=!form.elements.perchEnabled.checked;
 form.elements.autoVision.disabled=!form.elements.vision.checked;if(!form.elements.vision.checked)form.elements.autoVision.checked=false;
}
api?.onChatDelta(value=>{
  if(!activeReply||value.requestId!==activeReply.id||typeof value.content!=='string')return;
  const list=$('#messages'),nearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<80;
  activeReply.text=value.content;activeReply.node.textContent=value.content;
  if(nearBottom)activeReply.node.scrollIntoView({block:'end'});
});
function notice(text){$('#notice').textContent=text;$('#notice').hidden=!text;}
function tab(name){
 const current=document.querySelector('.page.active')?.id;
 if(current==='settings'&&name!=='settings'&&settingsDirty){
  if(!confirm('设置还没有保存。确定放弃这些更改并离开吗？'))return;
  fillSettings(currentSettings);
 }
 if(name!=='play'&&gameTimer)stopGame();document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id===name));document.querySelectorAll('[data-tab]').forEach(e=>e.classList.toggle('selected',e.dataset.tab===name));notice('');
}
document.querySelectorAll('[data-tab]').forEach(e=>e.onclick=()=>tab(e.dataset.tab));
$('#start-chat').onclick=()=>{tab('chat');$('#prompt').focus();};
$('#feed').onclick=()=>api?.interact('feed');
function updateNextInteraction(settings){
 const next=settings.nextScheduledInteraction,el=$('#next-interaction');
 if(!next){el.textContent='还没有安排，去设置里添加一条吧。';return;}
 const date=new Date(next.at),today=new Date(),tomorrow=new Date();tomorrow.setDate(today.getDate()+1);
 const day=date.toDateString()===today.toDateString()?'今天':date.toDateString()===tomorrow.toDateString()?'明天':`${date.getMonth()+1}月${date.getDate()}日`;
 const time=`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
 el.textContent=`${day} ${time} · ${next.content}`;
}
$('#manage-interactions').onclick=()=>{tab('settings');requestAnimationFrame(()=>$('#scheduled-interactions').scrollIntoView({block:'start'}));};
document.querySelectorAll('[data-action]').forEach(e=>e.onclick=()=>api?.interact(e.dataset.action));
async function call(fn){try{const r=await fn();if(!r.ok)throw new Error(r.error);return r.value;}catch(e){notice(e.message||'暂时无法完成，请重试。');return undefined;}}
function updateState(value){state=value;$('#mode-label').textContent=({company:'自在待着',focus:'一起专注',quiet:'安静待着'})[state.mode]||'自在待着';$('#status').textContent=state.chatBusy?'等一下，好像有点思路了……':'有事就说嘛，我听着呢。';$('#fullness').textContent=state.fullness>85?'满足了，下一顿再叫我。':state.fullness<35?'有点馋，想补充脑力口粮。':'刚刚好，还能再吃一点。';$('#focus').textContent=state.mode==='focus'?'结束专注':'开始专注';updateClock();}
function updateClock(){const s=Math.max(0,Math.ceil(((state.focusUntil||0)-Date.now())/1000));$('#focus-clock').textContent=s?`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:'一起专注';}
setInterval(updateClock,1000);
$('#focus').onclick=()=>call(()=>api.mode(state.mode==='focus'?'company':'focus',Number($('#minutes').value))).then(v=>v&&updateState(v));
$('#quiet').onclick=()=>call(()=>api.mode(state.mode==='quiet'?'company':'quiet')).then(v=>v&&updateState(v));
function message(role,text,error=false){$('#messages .chat-empty')?.remove();const el=document.createElement('div');el.className=`message ${role}${error?' error':''}`;el.textContent=text;$('#messages').append(el);el.scrollIntoView({block:'end'});return el;}
function setBusy(value){busy=value;$('#send').disabled=value;$('#cancel').hidden=!value;$('#capture').disabled=value;$('#clear-chat').disabled=value;}
$('#chat-form').onsubmit=async e=>{e.preventDefault();if(busy||!api)return;const text=$('#prompt').value.trim();if(!text)return;
  message('user',text);const pending=message('assistant','让我想想……');setBusy(true);notice('');
  activeReply={id:crypto.randomUUID(),node:pending,text:''};
  try{const result=await api.chat({text,attach:attached,requestId:activeReply.id});if(!result.ok)throw new Error(result.error);pending.textContent=result.value;if($('#prompt').value.trim()===text)$('#prompt').value='';}
  catch(err){if(activeReply.text){pending.textContent=activeReply.text;message('assistant',err.message,true);}else{pending.textContent=err.message;pending.classList.add('error');}}
  finally{activeReply=null;setBusy(false);removeCapture();}
};
$('#prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#chat-form').requestSubmit();}};
$('#cancel').onclick=()=>api?.cancel();
$('#clear-chat').onclick=async()=>{const v=await call(()=>api.clear());if(v){$('#messages').replaceChildren();removeCapture();notice('对话已清空。');}};
function removeCapture(){attached=false;$('#capture-preview').removeAttribute('src');$('#attachment').hidden=true;api?.discardCapture();}
$('#remove-capture').onclick=removeCapture;
$('#capture').onclick=async()=>{const image=await call(()=>api.capture());if(image){attached=true;$('#capture-preview').src=image;$('#attachment').hidden=false;}};
function interactionStatus(task){
 if(task.lastRunAt){const time=new Date(task.lastRunAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});return `${task.repeat==='once'&&!task.enabled?'已完成':'上次触发'} · ${time}`;}
 return task.enabled?'尚未触发':'已停用';
}
function renderInteractions(){
 const list=$('#interaction-list');list.replaceChildren();
 if(!interactionDraft.length){const empty=document.createElement('p');empty.className='interaction-empty';empty.textContent='还没有定时互动。添加一条吃饭、喝水、休息或任何你想让她主动提起的事。';list.append(empty);}
 for(const task of interactionDraft){
  const card=document.createElement('div');card.className='interaction-card';card.dataset.interactionId=task.id;
  card.innerHTML='<div class="interaction-top"><label class="check"><input data-field="enabled" type="checkbox">启用</label><div class="interaction-actions"><button type="button" data-action="test">试一次</button><button type="button" class="danger" data-action="remove">删除</button></div></div><div class="interaction-schedule"><label>时间<input data-field="time" type="time" required></label><label>重复<select data-field="repeat"><option value="once">单次</option><option value="daily">每天</option><option value="weekdays">工作日</option></select></label></div><label>互动内容<textarea data-field="content" maxlength="300" rows="2" required placeholder="例如：提醒我站起来活动一下，再陪我聊两句。"></textarea></label><div class="interaction-bottom"><label class="check"><input data-field="useModel" type="checkbox">让模型临时组织语言</label><small data-role="status"></small></div>';
  for(const field of card.querySelectorAll('[data-field]')){const key=field.dataset.field;if(field.type==='checkbox')field.checked=task[key]===true;else field.value=task[key]??'';}
  card.querySelector('[data-role="status"]').textContent=interactionStatus(task);
  card.querySelector('[data-action="test"]').disabled=!task.content.trim();
  list.append(card);
 }
 $('#add-interaction').disabled=interactionDraft.length>=30;
}
$('#add-interaction').onclick=()=>{
 interactionDraft.push({id:crypto.randomUUID(),content:'',time:'11:10',repeat:'daily',enabled:true,useModel:true,lastRunAt:0,lastRunKey:''});
 renderInteractions();setSettingsDirty(true);$('#interaction-list .interaction-card:last-child textarea')?.focus();
};
$('#interaction-list').addEventListener('input',event=>{
 const field=event.target.closest('[data-field]'),card=event.target.closest('[data-interaction-id]');if(!field||!card)return;
 const task=interactionDraft.find(item=>item.id===card.dataset.interactionId);if(!task)return;
 const key=field.dataset.field;task[key]=field.type==='checkbox'?field.checked:field.value;
 if(key==='time'||key==='repeat'){task.lastRunAt=0;task.lastRunKey='';}
 if(key==='content')card.querySelector('[data-action="test"]').disabled=!task.content.trim();
 card.querySelector('[data-role="status"]').textContent=interactionStatus(task);
});
$('#interaction-list').addEventListener('click',async event=>{
 const button=event.target.closest('button[data-action]');if(!button)return;
 const card=button.closest('[data-interaction-id]'),id=card.dataset.interactionId;
 if(button.dataset.action==='remove'){
  interactionDraft=interactionDraft.filter(task=>task.id!==id);renderInteractions();setSettingsDirty(true);return;
 }
 if(settingsDirty){notice('请先保存定时互动，再试运行。');return;}
 button.disabled=true;const result=await call(()=>api.testInteraction(id));button.disabled=false;
 if(result)notice(`试运行：${result.message}${result.usedFallback?'（按原文提醒）':''}`);
});
function fillSettings(s){currentSettings=s;updateNextInteraction(s);interactionDraft=(s.scheduledInteractions||[]).map(task=>({...task}));renderInteractions();const form=$('#settings-form');for(const [key,value] of Object.entries(s)){const field=form.elements.namedItem(key);if(!field)continue;if(field.type==='checkbox')field.checked=value===true;else field.value=value??'';}
  $('#size-slider').value=Math.round(s.scale*100);$('#size-output').textContent=`${Math.round(s.scale*100)}%`;
  form.elements.apiKey.value='';form.elements.removeKey.checked=false;$('#key-state').textContent=s.hasKey?'已安全保存访问密钥。':'尚未保存密钥；无认证的本机服务可留空。';$('#memory-summary').textContent=s.memory||'叫你什么、什么时候安静？去设置里告诉我。';syncSettingDependencies();setSettingsDirty(false);}
$('#settings-form').addEventListener('input',()=>{setSettingsDirty(true);syncSettingDependencies();});
$('#settings-form').onsubmit=async e=>{e.preventDefault();
  const empty=interactionDraft.find(task=>!task.content.trim());if(empty){notice('每条定时互动都需要填写内容，空白任务请先删除。');document.querySelector(`[data-interaction-id="${empty.id}"] textarea`)?.focus();return;}
  $('#save-settings').disabled=true;const form=e.currentTarget;const values={};
  for(const field of form.elements){if(!field.name||['apiKey','removeKey'].includes(field.name))continue;values[field.name]=field.type==='checkbox'?field.checked:field.name==='scale'?Number(field.value):field.value;}
  values.scale=Number($('#size-slider').value)/100;delete values.scalePercent;values.scheduledInteractions=interactionDraft;
  if(form.elements.apiKey.value)values.apiKey=form.elements.apiKey.value;if(form.elements.removeKey.checked)values.apiKey='';
  const result=await call(()=>api.save(values));if(result){fillSettings(result);notice('设置已保存。');}$('#save-settings').disabled=false;
};
$('#center-pet').onclick=async()=>{const result=await call(()=>api.centerPet());if(result){currentSettings=result;notice('大肥鱼已经回到屏幕内。');}};
$('#reset-settings').onclick=async()=>{
 if(!confirm('恢复默认的陪伴和桌面设置吗？模型配置、访问密钥、我们的约定、定时互动和聊天记录都会保留。'))return;
 const button=$('#reset-settings');button.disabled=true;const result=await call(()=>api.resetSettings());button.disabled=false;
 if(result){fillSettings(result);notice('已恢复默认设置，模型配置、密钥、约定、定时互动和聊天记录均已保留。');}
};
$('#export').onclick=async()=>{const dest=await call(()=>api.exportPet());if(dest)notice(`宠物包已导出到：${dest}`);};
let sizeTimer=null;
$('#size-slider').oninput=()=>{const percent=Number($('#size-slider').value);$('#size-output').textContent=`${percent}%`;clearTimeout(sizeTimer);sizeTimer=setTimeout(()=>call(()=>api.scale(percent/100)).then(s=>{if(s)currentSettings=s;}),60);};
const expressions=[['摸摸','pet'],['吃 token','feed'],['跳舞','dance'],['庆祝','celebrate'],['打招呼','wave'],['探头','peek'],['偷偷伸手','sneak'],['吃饱满足','satisfied'],['认真审阅','review'],['震惊','shock'],['鼓腮赌气','pout'],['认错','sorry'],['偷偷哼歌','hum'],['饭前小憩','meal-break'],['偷吃玩字谜','token-game'],['轻摇尾巴','tail-sway'],['蜷起来','curl'],['伸懒腰','stretch']];
for(const [name,kind]of expressions){const button=document.createElement('button');button.textContent=name;button.onclick=()=>api?.interact(kind);$('#expression-gallery').append(button);}
function moveToken(){const board=$('#game-board');const token=$('#token');token.style.left=`${12+Math.random()*Math.max(1,board.clientWidth-72)}px`;token.style.top=`${12+Math.random()*Math.max(1,board.clientHeight-72)}px`;}
function stopGame(){clearInterval(gameTimer);gameTimer=null;$('#token').hidden=true;$('#game-start').disabled=false;$('#score').textContent=`接住 ${score} 口！大肥鱼收好了。`;api?.interact(score>5?'celebrate':'feed');}
$('#game-start').onclick=()=>{score=0;gameEnd=Date.now()+30000;$('#token').hidden=false;$('#game-start').disabled=true;moveToken();$('#token').focus();gameTimer=setInterval(()=>{const left=Math.max(0,Math.ceil((gameEnd-Date.now())/1000));$('#score').textContent=`${score} 口 · 剩余 ${left} 秒`;if(!left)stopGame();},200);};
$('#token').onclick=()=>{if(!gameTimer)return;score++;moveToken();};
window.addEventListener('beforeunload',()=>clearInterval(gameTimer));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&gameTimer)stopGame();});
api?.onState(updateState);api?.onNotice(notice);
api?.onSettings(s=>{currentSettings=s;if(!settingsDirty)fillSettings(s);else{if(!s.autoVision)$('#settings-form').elements.autoVision.checked=false;syncSettingDependencies();}$('#memory-summary').textContent=s.memory||'叫你什么、什么时候安静？去设置里告诉我。';});
if(api){call(()=>api.settings()).then(data=>{if(!data)return;fillSettings(data.settings);updateState(data.state);for(const m of data.history)message(m.role,m.content);});api.ready();}else notice('这是界面预览。桌面功能请通过应用启动。');
