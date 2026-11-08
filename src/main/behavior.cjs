'use strict';
const {clips,recoveryClip}=require('../renderer/motion.js');

const ACTIONS = Object.freeze({
  'rub-eyes':[0],sit:[13,37],'head-pat':[23,1,23,1,23],'belly-poke':[0,14,14,8,0],
  'meal-break':[7],'token-game':[20],'tail-sway':[0],'story-recover':[0],
  'stop-left':[0],'stop-right':[0],wake:[0],
  drag:[14],fall:[14],land:[0],
  shift:[0],settle:[0],breathe:[0],
  idle: [0, 1, 0], think: [2, 2, 3], proud: [4, 4, 6], happy: [5, 5, 10], hungry: [6, 6, 7],
  eat: [6, 7, 7, 5], protest: [8, 8, 4], sad: [9, 9, 0], wave: [10, 10, 0], sleep: [11],
  left: [12], right: [13], surprise: [14, 14, 0], jump: [5, 15, 5],
  peek: [16, 17, 18, 19], dance: [28, 29, 28, 29], stretch: [1, 30, 5],
  sneak: [20, 21, 22, 23], satisfied: [7, 23], review: [2, 24, 3],
  shock: [0, 25, 14], pout: [8, 26, 4], sorry: [9, 27, 0], hum: [28, 29, 28], curl: [30, 31],
});
const LINES = {
  land: ['稳稳落地。', '呼……站住了。', '落地满分，过程差评。', '我的呆毛都吓竖了。', '鲸尾差点打成结。', '地面接得不错，下次别扔了。', '还、还没晕，就是有点想吃饭。', '我站得很稳，刚才也很稳。'],
  drag: ['呆毛！别碰歪了！', '慢点，我的鲸尾要跟不上了。', '要去哪儿？先让我看清路。', '轻一点，我不是文件夹。', '别晃，我脑子里的题要散了。', '抓稳了，别真把我扔出去。'],
  drop: ['好啦，这里也行。', '这地方不错，先歇一下。', '下次放轻一点嘛。', '行，我就在这里待着。', '总算停下来了。'],
  pet: ['嗯？你叫我？', '有事就说嘛，我听着呢。', '摸摸可以，别弄乱呆毛。', '我在这儿，没偷懒。', '就摸一下？那好吧。', '别光摸，题目也可以给我看看。'],
  eat: ['这是补充算力，怎么能叫贪吃！', '最后一口。……这次真的。', '这个……能再来一口吗？', '唔，这一口有知识的味道。', '脑力补充中，别偷看。', '有吃的？你早说嘛。'],
  'eat-full': ['真的吃不下了……留着下一顿。', '饱了，别再往我嘴里塞了。', '这份先记账，下顿再吃。', '我已经很圆了，不能再吃了。', '好吃，但现在真的饱了。'],
  'head-first': ['嗯……再摸一下。', '这、这次就让你多摸一会儿。', '摸头可以，别把我当按钮。', '唔，感觉还不坏。'],
  'head-second': ['嘿嘿，呆毛没乱吧？', '呆毛还整齐吧？我特意整理的。', '别光摸头，呆毛也要保持形状。', '我的呆毛可不是天线。'],
  'head-more': ['今天也可以多摸一会儿。', '看在你这么温柔的份上，继续吧。', '再摸下去，我要睡着啦。', '好吧，今天不跟你计较。'],
  'belly-first': ['呀……肚子不是按钮。', '喂，那里不能随便戳。', '你戳错地方啦。', '干、干什么，我没藏零食。'],
  'belly-second': ['再戳，我真的要生气啦。', '第二下了，我可记着呢。', '别以为我脾气好就能一直戳。', '我警告你，鲸尾要拍人了。'],
  'belly-protest': ['好啦，不许再戳了。', '真生气了，哄不好的那种。', '再戳一下，我就把你手拍开。', '你今天的戳肚子额度用完了。'],
  dance: ['看好了，只跳一小段！', '就这一段，别录下来。', '让我活动一下鲸尾。', '音乐呢？算了，我自己来。', '跳完这段，记得夸我。'],
  celebrate: ['嘿嘿……这次还不错吧。', '做成了！值得吃一口庆祝。', '我就知道，你可以的。', '这回干得漂亮。', '来，击个掌……轻一点。'],
  sneak: ['……就一口。', '我只是看看，没打算偷吃。', '别回头，我马上就好。', '这一口应该没人发现吧。'],
  focus: ['你先忙，有事再叫我。', '专心这一会儿，我替你看着时间。', '开始吧，我先不吵你。', '这段时间认真一点，结束后我陪你歇歇。'],
  quiet: ['好，我安静待着。', '你忙吧，我在这儿不吵你。', '需要我时再叫，我不乱跑。', '我会乖乖的，偶尔动一下不算吵吧。'],
  company: ['好，我调整一下。', '我回来了，现在可以随便聊。', '休息结束，接下来想做点什么？', '不赶时间了，我陪你待会儿。'],
  wake: ['我醒着呢……刚才只是闭了一下眼睛。', '你回来啦？我刚准备好。', '没睡多久，真的。', '我听见动静了，欢迎回来。', '醒了醒了，不用戳我。'],
  return: ['回来啦。', '你回来啦，我在这儿呢。', '欢迎回来，要不要先歇一下？', '你总算回来了，我可等好久了。', '回来就好，接着忙吧。'],
  'chat-think': ['让我把这个问题嚼一嚼。', '我想想，别催我。', '让我捋一捋思路。', '这个问题有点意思。', '给我一点时间，我想清楚再说。'],
  'chat-done': ['想好了，打开聊天看看吧。', '我说完了，来看看有没有帮上忙。', '回答放在聊天里啦。', '想清楚了，你来瞧瞧。', '写好了，不知道合不合你胃口。'],
  'rub-eyes': ['慢一点……眼睛跟不上啦。', '别晃了，我的视线都打结了。', '停一下，让我揉揉眼睛。', '鼠标跑这么快，是在逗我吗？', '眼睛有点酸，都怪你晃得太快。'],
  'focus-complete': ['歇一会儿？我想伸个懒腰了。', '时间到，先让眼睛休息一下吧。', '这段时间辛苦了，起来活动一下？', '完成了这一段，别把自己绷太紧。'],
  'context-code': ['等一下，好像有点思路了……', '这题有点意思，让我再看看。', '你写到哪儿了？我陪你捋一捋。', '先别急着改，想清楚再动手。'],
  'context-media': ['一起看一会儿？我不挡着。', '这段好看吗？我也瞄一眼。', '你看你的，我在这边吃一点。', '这一幕怎么样？别给我剧透。'],
  'context-game': ['这局你来，我负责加油。', '稳住，我觉得这局能赢。', '别慌，先看清对面要干什么。', '我在旁边给你鼓鼓劲。'],
  'context-reading': ['慢慢看，我不催你。', '这页看完再休息也不迟。', '你读你的，我安静陪着。', '有意思的地方，也可以讲给我听。'],
  'recover-hum': ['咳……刚才哼到哪儿了？', '别打断嘛，我都快哼完了。', '好吧，先不唱了。', '你叫我？那我先暂停一下。'],
  'recover-token': ['……就一口。', '让我吃完这一口嘛。', '别抓我，我就尝了一点点。', '好吧，先被你发现了。'],
  'recover-meal': ['我就吃一口，马上回来。', '饭还没吃完呢，怎么啦？', '先让我把筷子放下。', '你叫我？那我吃完这口再说。'],
  idle: ['我就在这儿趴一会儿。', '有没有什么可以吃的？', '你忙你的，有事叫我。', '今天也要把问题嚼明白。'],
};
// 每个动作的触发依据集中声明；位移、入睡、拖拽和落地仍由专用事件驱动。
const DAILY = [
 {action:'wave',weight:2,cooldown:60000}, {action:'peek',weight:2,cooldown:60000},
 {action:'stretch',weight:2,cooldown:90000}, {action:'happy',weight:1,cooldown:120000},
 {action:'proud',weight:1,cooldown:150000}, {action:'surprise',weight:.5,cooldown:180000},
 {action:'pout',weight:.4,cooldown:240000}, {action:'protest',weight:.4,cooldown:240000},
 {action:'sad',weight:.2,cooldown:300000}, {action:'sorry',weight:.2,cooldown:300000},
 {action:'shock',weight:.3,cooldown:240000},
 {action:'think',weight:3,cooldown:45000,categories:['code','reading']},
 {action:'review',weight:3,cooldown:60000,categories:['code','reading']},
 {action:'dance',weight:2,cooldown:120000,categories:['media','game','other']},
 {action:'jump',weight:1,cooldown:90000,categories:['game','other']},
 {action:'sneak',weight:2,cooldown:120000,hungry:true},
 {action:'hungry',weight:2,cooldown:90000,hungry:true},
 {action:'eat',weight:1,cooldown:180000,hungry:true},
 {action:'satisfied',weight:2,cooldown:120000,full:true},
];

/** 唯一的行为仲裁器。用户操作优先，专注/睡眠禁止随机散步；计时以注入时钟测试。 */
class Companion {
  constructor({ now = Date.now, random = Math.random } = {}) {
    this.now = now; this.random = random;
    this.action = 'idle'; this.priority = 0; this.until = 0; this.started = now();
    this.message = ''; this.messageUntil = 0; this.revision = 0; this.mode = 'company'; this.focusUntil = 0;
    this.energy = 80; this.fullness = 55; this.lastDecay = now(); this.nextIdle = now() + 3000 + this.random()*2000;
    this.category='other';this.nextExpressive=now()+5000;
    this.recentIdle=[];this.contextAfter=now()+60000;
    this.cooldowns = new Map(); this.locked = false; this.away = false; this.chatBusy = false;
    this.focusCount = 0;this.touch={headAt:0,headCount:0,bellyAt:0,bellyCount:0};
    this.recovery=null;this.storyCooldowns=new Map();this.nextStory=now()+15000+this.random()*10000;this.recentLines=new Map();
  }
  pick(items) { return items[Math.floor(this.random() * items.length)]; }
  say(key){
    const lines=LINES[key]||[''],recent=this.recentLines.get(key)||[];
    const pool=lines.length>1?lines.filter(line=>!recent.includes(line)):lines;
    const line=this.pick(pool.length?pool:lines),keep=Math.min(2,lines.length-1);
    if(keep)this.recentLines.set(key,[...recent,line].slice(-keep));
    return line;
  }
  dailyAction(){
    const pool=DAILY.filter(r=>(!r.categories||r.categories.includes(this.category))&&(!r.hungry||this.fullness<45)&&(!r.full||this.fullness>80)&&!this.recentIdle.includes(r.action)&&this.now()>=(this.cooldowns.get('action:'+r.action)||0));
    let draw=this.random()*pool.reduce((n,r)=>n+r.weight,0);
    for(const r of pool){draw-=r.weight;if(draw<=0)return r;}return null;
  }
  play(action, message = '', duration = 4000, priority = 40, messageDuration = 0) {
    if (!ACTIONS[action] || (this.now() < this.until && priority < this.priority)) return false;
    // 相同事件连续到来不重置动画时间，避免连点或探针重复报告造成抽动。
    if(action===this.action&&this.now()<this.until&&priority===this.priority)return false;
    // 有限动作的占用时间与动画一致，避免画面已回待机却仍被动作锁住数秒。
    const c=clips[action];if(c&&!c.loop&&!c.hold)duration=c.times.reduce((a,b)=>a+b,0);
    this.action = action; this.message = message; this.priority = priority;
    this.recovery=null;
    this.started = this.now(); this.until = this.started + duration; this.messageUntil = this.started + Math.max(0, messageDuration); this.revision++;
    if(['hum','meal-break','token-game'].includes(action)){
      this.storyCooldowns.set(action,this.now()+90000);this.nextStory=this.now()+25000+this.random()*15000;
    }
    const rule=DAILY.find(r=>r.action===action);if(rule)this.cooldowns.set('action:'+action,this.now()+rule.cooldown);
    if(priority>0||action==='idle')this.nextIdle=this.until+3000+this.random()*2000;
    return true;
  }
  interact(kind) {
    if(['head-pat','belly-poke'].includes(kind)&&['hum','meal-break','token-game','story-recover'].includes(this.action))kind='pet';
    if(kind==='pet'&&this.action==='story-recover'&&this.now()<this.until)return false;
    if(kind==='pet'&&['hum','meal-break','token-game'].includes(this.action)&&this.now()<this.until){
      const recovery=recoveryClip(this.action,this.now()-this.started);
      const key=this.action==='hum'?'recover-hum':this.action==='token-game'?'recover-token':'recover-meal';
      if(!this.play('story-recover',this.say(key),1800,80))return false;
      this.recovery=recovery;this.until=this.started+recovery.times.reduce((a,b)=>a+b,0);return true;
    }
    if(kind==='rub-eyes')return this.play(kind,this.say('rub-eyes'),5000,80);
    if(['meal-break','token-game','tail-sway'].includes(kind))return this.play(kind,'',5000,80);
    if(kind==='head-pat'){
      const now=this.now(),t=this.touch;t.headCount=now-t.headAt<5000?t.headCount+1:1;t.headAt=now;
      const key=t.headCount===1?'head-first':t.headCount===2?'head-second':'head-more';
      return this.play('head-pat',this.say(key),1600,80);
    }
    if(kind==='belly-poke'){
      const now=this.now(),t=this.touch;t.bellyCount=now-t.bellyAt<5000?t.bellyCount+1:1;t.bellyAt=now;
      if(t.bellyCount===1)return this.play('belly-poke',this.say('belly-first'),1200,80);
      if(t.bellyCount===2)return this.play('pout',this.say('belly-second'),1800,80);
      return this.play('protest',this.say('belly-protest'),1800,80);
    }
    if (kind === 'drag') return this.play('drag', this.say('drag'), 60000, 100);
    if (kind === 'drop') { this.until = 0; return this.play('protest', this.say('drop'), 2800, 100); }
    if (kind === 'feed') {
      const full = this.fullness >= 90;
      this.fullness = Math.min(100, this.fullness + 12);
      return this.play('eat', this.say(full?'eat-full':'eat'), 4600, 80);
    }
    if (kind === 'dance') return this.play('dance', this.say('dance'), 6000, 80);
    if (kind === 'pet') return this.play('happy', this.say('pet'), 3200, 80);
    if (kind === 'celebrate') return this.play('jump', this.say('celebrate'), 4000, 80);
    if (['peek','sneak','satisfied','review','shock','pout','sorry','hum','curl','stretch','wave'].includes(kind)) return this.play(kind, kind==='sneak'?this.say('sneak'):'', 5000, 80);
    return false;
  }
  setMode(mode, minutes = 25) {
    if (!['company', 'focus', 'quiet'].includes(mode)) return false;
    this.mode = mode; this.focusUntil = mode === 'focus' ? this.now() + Math.max(1, Math.min(120, minutes)) * 60000 : 0;
    this.until = 0; this.play(mode === 'focus' ? 'think' : 'idle', this.say(mode), 3500, 60);
    return true;
  }
  context({ idleSeconds = 0, locked = false, fullscreen = false, category = 'other' } = {}) {
    this.locked = locked || fullscreen;this.category=category;
    if (locked) return;
    if (idleSeconds >= 180 && !this.chatBusy) {
      this.away = true;
      // 原生探针重复报告空闲时保留动画起点，避免每三秒重新播放入睡过程。
      if (this.action !== 'sleep' && this.now() >= this.messageUntil) this.play('sleep', '', 8000, 20);
      return;
    }
    if (this.away && idleSeconds < 5) {
      this.away = false; this.until = 0; this.play('wake', this.say('wake'), 3500, 50); return;
    }
    if (this.mode !== 'company' || fullscreen || this.chatBusy || this.now()<this.contextAfter || this.now()<this.messageUntil) return;
    const actions = { code:'think', media:'happy', game:'proud', reading:'think' };
    if (actions[category] && this.now() >= (this.cooldowns.get(category) || 0)) {
      if (this.play(actions[category],this.say(`context-${category}`),3500,10)) {this.cooldowns.set(category, this.now() + 15 * 60000);this.contextAfter=this.now()+180000;}
    }
  }
  tick() {
    const now = this.now();
    const elapsed = Math.max(0, now - this.lastDecay);
    this.fullness = Math.max(0, this.fullness - elapsed / 600000);
    this.lastDecay = now;
    if (this.focusUntil && now >= this.focusUntil) {
      this.focusUntil = 0; this.mode = 'company'; this.focusCount++;
      this.play('stretch', this.say('focus-complete'), 5500, 70);
    }
    if (now >= this.until && !this.chatBusy && this.action !== 'idle' && !(this.away && this.action === 'sleep')) {
      const messageDuration = Math.max(0, this.messageUntil - now);
      this.play(['sleep','curl'].includes(this.action)?'wake':'idle', messageDuration ? this.message : '', 0, 0, messageDuration);
    }
    if (['idle','sleep'].includes(this.action) && this.message && this.messageUntil && now >= this.messageUntil) this.play(this.action, '', 0, 0);
    if (now >= this.nextIdle && now >= this.messageUntil && !this.locked && !this.away && !this.chatBusy && this.mode === 'company' && now >= this.until) {
      // 页面环境增加偏好，不把其他剧情永久排除；低饱腹时优先休息吃东西。
      const storyCandidates=this.fullness<35?['meal-break','meal-break','hum','token-game']:this.category==='media'?['hum','hum','token-game','meal-break']:this.category==='game'?['token-game','token-game','hum','meal-break']:['hum','token-game','meal-break'];
      const available=storyCandidates.filter(a=>now>=(this.storyCooldowns.get(a)||0));
      if(now>=this.nextStory&&available.length){
        const action=this.pick(available);this.play(action,'',5000,5);
        this.storyCooldowns.set(action,now+90000);this.nextStory=now+25000+this.random()*15000;
        this.nextExpressive=this.until+6000;return this.snapshot();
      }
      // 3–5 秒后可动一下，但短表演与小剧情有独立冷却，不把待机变成连续演出。
      const expressive=now>=this.nextExpressive?this.dailyAction()?.action:null;
      const candidates=['shift','settle','breathe','tail-sway'].filter(a=>!this.recentIdle.includes(a));
      const action=expressive||this.pick(candidates.length?candidates:['shift']);
      this.play(action,'',3200,5);
      if(expressive)this.nextExpressive=this.until+6000+this.random()*4000;
      this.recentIdle=[...this.recentIdle,action].slice(-3);
      this.nextIdle = this.until + 3000 + this.random() * 2000;
    }
    return this.snapshot();
  }
  canWander() { return !this.locked && !this.away && !this.chatBusy && this.mode === 'company' && this.now() >= this.until && this.now() >= this.messageUntil; }
  snapshot() {
    return { action: this.action, frames: ACTIONS[this.action], message: this.message, started: this.started,
      until: this.until, revision: this.revision, mode: this.mode, focusUntil: this.focusUntil,
      fullness: Math.round(this.fullness), focusCount: this.focusCount, chatBusy: this.chatBusy,recovery:this.recovery };
  }
}
module.exports = { Companion, ACTIONS, DAILY };
