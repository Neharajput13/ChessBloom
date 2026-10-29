const initialBoard = [
  ["♜","♞","♝","♛","♚","♝","♞","♜"],
  ["♟","♟","♟","♟","♟","♟","♟","♟"],
  ["","","","","","","",""],["","","","","","","",""],["","","","","","","",""],["","","","","","","",""],
  ["♙","♙","♙","♙","♙","♙","♙","♙"],
  ["♖","♘","♗","♕","♔","♗","♘","♖"]
];
let board = initialBoard.map(row => [...row]), selected = null, moves = [], lastMove = null, currentTurn = "white", gameMode = "computer", computerThinking = false;
const boardEl = document.getElementById("board"), moveList = document.getElementById("moveList"), moveCount = document.getElementById("moveCount"), coachMessage = document.getElementById("coachMessage"), toast = document.getElementById("toast"), turnStatus = document.getElementById("turnStatus");
const files = "abcdefgh";
const whitePieces = "♔♕♖♗♘♙";
function isWhite(piece){ return whitePieces.includes(piece); }
function renderBoard(){
  boardEl.innerHTML = "";
  board.forEach((row,r)=>row.forEach((piece,c)=>{
    const square=document.createElement("div"); square.className=`square ${(r+c)%2?"dark":"light"}`;
    if(lastMove && (lastMove.from[0]===r&&lastMove.from[1]===c || lastMove.to[0]===r&&lastMove.to[1]===c)) square.classList.add("last-move");
    if(selected && selected[0]===r&&selected[1]===c) square.classList.add("selected");
    if(selected && !piece && isLegal(selected,[r,c])) square.classList.add("hint");
    if(piece){ const span=document.createElement("span"); span.className=`piece ${isWhite(piece)?"white":"black"}`; span.textContent=piece; square.appendChild(span); }
    square.addEventListener("click",()=>handleSquare(r,c)); boardEl.appendChild(square);
  }));
}
function updateTurnStatus(){
  const computerTurn = gameMode === "computer" && currentTurn === "black";
  turnStatus.classList.toggle("computer-turn", computerTurn);
  turnStatus.querySelector("strong").textContent = computerTurn ? "Bloom is thinking" : "Your turn";
  turnStatus.querySelector("small").textContent = `${currentTurn === "white" ? "White" : "Black"} · ${gameMode === "computer" ? "Vs computer" : "Two players"}`;
}
function pathClear(from,to){
  const dr=Math.sign(to[0]-from[0]), dc=Math.sign(to[1]-from[1]); let r=from[0]+dr,c=from[1]+dc;
  while(r!==to[0]||c!==to[1]){if(board[r][c])return false;r+=dr;c+=dc} return true;
}
function isLegal(from,to){
  const piece=board[from[0]][from[1]], target=board[to[0]][to[1]];
  if(!piece || (target && isWhite(piece)===isWhite(target))) return false;
  const dr=to[0]-from[0],dc=to[1]-from[1], ar=Math.abs(dr),ac=Math.abs(dc), type=piece.replace(/[♔♚]/g,"♚").replace(/[♕♛]/g,"♛").replace(/[♖♜]/g,"♜").replace(/[♗♝]/g,"♝").replace(/[♘♞]/g,"♞").replace(/[♙♟]/g,"♟");
  if(type==="♟"){const dir=isWhite(piece)?-1:1,start=isWhite(piece)?6:1;return dc===0&&!target&&(dr===dir||(from[0]===start&&dr===2*dir&&!board[from[0]+dir][from[1]]))||ac===1&&dr===dir&&target}
  if(type==="♞")return ar*ac===2;
  if(type==="♝")return ar===ac&&pathClear(from,to);
  if(type==="♜")return (dr===0||dc===0)&&pathClear(from,to);
  if(type==="♛")return (ar===ac||dr===0||dc===0)&&pathClear(from,to);
  if(type==="♚")return ar<=1&&ac<=1;
  return false;
}
function handleSquare(r,c){
  if(computerThinking || (gameMode === "computer" && currentTurn === "black")) return;
  const piece=board[r][c];
  const playerIsWhite = currentTurn === "white";
  if(!selected){ if(piece&&isWhite(piece)===playerIsWhite){selected=[r,c]; coach("Nice choice. Where would you like to move it?"); renderBoard();} else coach(`It’s ${playerIsWhite ? "White" : "Black"}’s turn. Choose the ${playerIsWhite ? "white" : "black"} piece you want to move.`); return; }
  if(piece&&isWhite(piece)===playerIsWhite){selected=[r,c];renderBoard();return}
  if(isLegal(selected,[r,c])){
    const from=[...selected], moved=board[from[0]][from[1]], captured=board[r][c];
    board[r][c]=moved; board[from[0]][from[1]]=""; lastMove={from,to:[r,c]}; moves.push({piece:moved,from,to:[r,c],captured,color:currentTurn}); selected=null; currentTurn=currentTurn==="white"?"black":"white"; renderMoves(); renderBoard(); updateTurnStatus();
    coach(captured?`Great! You captured a piece. That ${pieceName(moved)} was defended, so keep checking what can capture back.`:`That’s a legal move. Before your next move, ask: “What changed?”`);
    if(gameMode === "computer" && currentTurn === "black") computerMove();
  } else { coach("That piece can’t move there yet. Try one of the highlighted squares."); }
}
function allLegalMoves(color){
  const result=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c] && isWhite(board[r][c])===(color==="white")){
    for(let tr=0;tr<8;tr++) for(let tc=0;tc<8;tc++) if(isLegal([r,c],[tr,tc])) result.push({from:[r,c],to:[tr,tc]});
  }
  return result;
}
function computerMove(){
  computerThinking=true; updateTurnStatus(); coach("Bloom is looking for a thoughtful reply...");
  setTimeout(()=>{
    const options=allLegalMoves("black");
    if(!options.length){computerThinking=false;coach("You’ve boxed in Bloom! That’s a strong position.");return}
    const captures=options.filter(move=>board[move.to[0]][move.to[1]]);
    const move=(captures.length?captures:options)[Math.floor(Math.random()*(captures.length?captures.length:options.length))];
    const moved=board[move.from[0]][move.from[1]], captured=board[move.to[0]][move.to[1]];
    board[move.to[0]][move.to[1]]=moved;board[move.from[0]][move.from[1]]="";lastMove=move;
    moves.push({piece:moved,from:move.from,to:move.to,captured,color:"black"});currentTurn="white";computerThinking=false;renderMoves();renderBoard();updateTurnStatus();
    coach(captured?`Bloom captured your ${pieceName(captured)}. Can you find a useful response?`:"Bloom moved. Look for checks, captures, and threats before choosing your reply.");
  },650);
}
function pieceName(piece){
  const normalized=piece.replace(/[♔♚]/g,"♔").replace(/[♕♛]/g,"♕").replace(/[♖♜]/g,"♖").replace(/[♗♝]/g,"♗").replace(/[♘♞]/g,"♘").replace(/[♙♟]/g,"♙");
  return ({ "♙":"pawn","♘":"knight","♗":"bishop","♖":"rook","♕":"queen","♔":"king"})[normalized]||"piece";
}
function renderMoves(){
  moveCount.textContent=moves.length;
  if(!moves.length){moveList.innerHTML='<div class="empty-moves">Your moves will appear here</div>';return}
  let html=""; for(let i=0;i<moves.length;i+=2){const m=moves[i], n=moves[i+1];html+=`<div class="move-row"><span>${i/2+1}.</span><span>${pieceName(m.piece)} ${files[m.to[1]]}${8-m.to[0]}</span><span>${n?pieceName(n.piece)+" "+files[n.to[1]]+(8-n.to[0])+(n.color==="black"?(gameMode==="computer"?" · Bloom":" · Player 2"):""):""}</span></div>`} moveList.innerHTML=html;
}
function coach(text){coachMessage.innerHTML=`<span class="message-label">COACH TIP</span><p>${text}</p>`}
function showToast(text){toast.textContent=text;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2800)}
const lessonContent={
  "The art of the opening":{
    description:"A 45-second visual lecture: center, develop, castle.",
    chapters:[
      ["1 · Control the center","Start with e4 or d4. Center pawns open lines for your queen and bishops.","The center is the crossroads of the board. Influence it first."],
      ["2 · Develop your pieces","Bring out a knight, then a bishop. Avoid moving the same piece again and again.","Developed pieces are active pieces. Aim them toward the center."],
      ["3 · Castle and connect","Castle to protect your king, then connect your rooks.","Your opening recipe is simple: center, develop, castle."]
    ]
  },
  "Spot the threat":{
    description:"A visual lecture on the one question that prevents most beginner blunders.",
    chapters:[
      ["Pause after every move","Your opponent’s move changed the board. Take one calm breath before replying.","Look at checks, captures, and attacks first."],
      ["Find the attacked piece","A piece is loose when it has no defender. Loose pieces are easy targets.","Count attackers and defenders before committing."],
      ["Make a safe plan","If you are under threat, move the target or create a stronger threat.","Good chess is often choosing the move that solves the most urgent problem."],
      ["The habit to keep","Say it out loud: what changed? It turns guessing into thinking.","This tiny pause is your superpower."]
    ]
  },
  "Forks & double attacks":{
    description:"See how one piece can create two problems at the same time.",
    chapters:[
      ["What is a fork?","A fork attacks two or more pieces with one move.","Knights are famous for forks because their jumps are hard to block."],
      ["Look for targets","Forks work best against valuable pieces: a king, queen, or rook.","Scan for two targets that sit close enough to attack together."],
      ["Create the moment","Checks often force the opponent to respond while your second attack waits.","Do not rush—first make sure your forking square is safe."],
      ["Practice the pattern","When you see two targets, ask whether one knight move can reach both.","Spotting the idea is already a win for your chess brain."]
    ]
  }
};
let activeLesson=null, activeChapter=0, lectureTimer=null, voiceEnabled=false, voiceTimer=null, lectureVideoUrl=null;
const lessonModal=document.getElementById("lessonModal"), lessonTitle=document.getElementById("lessonTitle"), lessonDescription=document.getElementById("lessonDescription"), lessonTime=document.getElementById("lessonTime"), chapterProgress=document.getElementById("chapterProgress"), chapterRow=document.getElementById("chapterRow"), lectureCaption=document.getElementById("lectureCaption"), playLecture=document.getElementById("playLecture"), lectureVisual=document.querySelector(".lecture-visual"), lectureVideo=document.getElementById("lectureVideo"), videoLoading=document.getElementById("videoLoading"), transcript=document.getElementById("transcript");
function renderLesson(){
  const lesson=lessonContent[activeLesson], chapter=lesson.chapters[activeChapter];
  lessonTitle.textContent=activeLesson;lessonDescription.textContent=lesson.description;lessonTime.textContent=`${activeChapter+1} / ${lesson.chapters.length}`;chapterProgress.style.width=`${((activeChapter+1)/lesson.chapters.length)*100}%`;lectureCaption.textContent=`${chapter[0]} — ${chapter[1]}`;
  chapterRow.innerHTML=lesson.chapters.map((item,index)=>`<button class="chapter-button ${index===activeChapter?"active":""}" data-chapter="${index}">${index+1}. ${item[0]}</button>`).join("");
  chapterRow.querySelectorAll(".chapter-button").forEach(button=>button.addEventListener("click",()=>{activeChapter=Number(button.dataset.chapter);stopLecture();renderLesson();}));
  renderLectureBoard();
  updateVideoChapter();
}
function openLesson(name){activeLesson=name;activeChapter=0;lectureVisual.classList.remove("video-started");renderLesson();lessonModal.classList.add("open");lessonModal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";coach(`I’m your mentor for “${name}”. Watch one short chapter, then I’ll give you a simple practice idea.`);prepareLectureVideo()}
function closeLesson(){stopLecture();lectureVisual.classList.remove("video-started");lessonModal.classList.remove("open");lessonModal.setAttribute("aria-hidden","true");document.body.style.overflow=""}
function stopLecture(){clearInterval(lectureTimer);clearTimeout(voiceTimer);lectureTimer=null;voiceTimer=null;lectureVisual.classList.remove("lecture-playing");playLecture.innerHTML="Play lecture <span>▶</span>";if("speechSynthesis" in window)window.speechSynthesis.cancel();if(lectureVideo)lectureVideo.pause()}
function playNextChapter(){
  if(activeChapter < lessonContent[activeLesson].chapters.length-1){activeChapter++;renderLesson();speakChapter();}else{stopLecture();lectureCaption.textContent="Lesson complete — now practice your new idea!";showToast("Lesson complete");}
}
function renderLectureBoard(){
  const visual=document.getElementById("lectureBoard");if(!visual)return;
  const pieces=[
    ["♜","♞","♝","♛","♚","♝","♞","♜"],["♟","♟","♟","♟","♟","♟","♟","♟"],
    ["","","","","","","",""],["","","","","","","",""],["","","","","","","",""],["","","","","","","",""],
    ["♙","♙","♙","♙","♙","♙","♙","♙"],["♖","♘","♗","♕","♔","♗","♘","♖"]
  ].map(row=>[...row]);
  const highlights=[];
  if(activeLesson==="The art of the opening"){
    if(activeChapter===0){pieces[6][4]="";pieces[4][4]="♙";highlights.push([4,4],[6,4])}
    if(activeChapter===1){pieces[7][6]="";pieces[5][5]="♘";pieces[7][5]="";pieces[4][2]="♗";highlights.push([5,5],[4,2])}
    if(activeChapter===2){pieces[7][4]="";pieces[7][6]="♔";pieces[7][7]="♖";highlights.push([7,6],[7,7])}
  }
  visual.innerHTML="";
  pieces.forEach((row,r)=>row.forEach((piece,c)=>{const square=document.createElement("div");square.className=`lecture-square ${(r+c)%2?"dark":"light"} ${highlights.some(item=>item[0]===r&&item[1]===c)?"highlight":""}`;if(piece){const span=document.createElement("span");span.className=`lecture-piece ${whitePieces.includes(piece)?"white":"black"}`;span.textContent=piece;square.appendChild(span)}visual.appendChild(square)}));
}
function speakChapter(){
  if(!voiceEnabled||!("speechSynthesis" in window)||!activeLesson)return;
  const chapter=lessonContent[activeLesson].chapters[activeChapter];window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(`${chapter[0]}. ${chapter[1]} ${chapter[2]}`);utterance.rate=.92;utterance.pitch=1.05;window.speechSynthesis.speak(utterance);
}
function startLecture(){if(!lectureVideo||!lectureVideo.src){prepareLectureVideo();return}if(!lectureVideo.paused){lectureVideo.pause();return}lectureVisual.classList.add("lecture-playing");lectureVideo.play().catch(()=>showToast("Use the video controls to start playback"));speakChapter()}
function drawLectureFrame(ctx,time){
  const w=640,h=360;ctx.fillStyle="#3b326b";ctx.fillRect(0,0,w,h);ctx.fillStyle="#d9d3ff";ctx.font="700 18px Arial";ctx.fillText("BLOOM ACADEMY · THE ART OF THE OPENING",28,34);
  ctx.fillStyle="#fff";ctx.font="700 27px Arial";const slide=time<4?0:time<8?1:2;ctx.fillText(["1. Control the center","2. Develop your pieces","3. Castle and connect"][slide],28,78);
  const x=385,y=80,size=210;for(let r=0;r<8;r++)for(let c=0;c<8;c++){ctx.fillStyle=(r+c)%2?"#a87950":"#f2dfc4";ctx.fillRect(x+c*size/8,y+r*size/8,size/8,size/8)}
  const piece=(text,r,c,color="#fff")=>{ctx.fillStyle=color;ctx.font="24px Georgia";ctx.textAlign="center";ctx.fillText(text,x+c*size/8+size/16,y+r*size/8+size/13);ctx.textAlign="left"};
  const black=["♜","♞","♝","♛","♚","♝","♞","♜"],white=["♖","♘","♗","♕","♔","♗","♘","♖"];black.forEach((p,c)=>piece(p,0,c,"#2d2420"));black.forEach((p,c)=>piece("♟",1,c,"#2d2420"));white.forEach((p,c)=>piece(p,7,c));for(let c=0;c<8;c++)piece("♙",6,c);
  if(slide===0){ctx.fillStyle="#e2bb62";ctx.fillRect(x+4*size/8,y+4*size/8,size/8,size/8);piece("♙",4,4)}
  if(slide===1){ctx.fillStyle="#e2bb62";ctx.fillRect(x+5*size/8,y+5*size/8,size/8,size/8);piece("♘",5,5)}
  if(slide===2){ctx.fillStyle="#e2bb62";ctx.fillRect(x+6*size/8,y+7*size/8,size/8,size/8);piece("♔",7,6);piece("♖",7,7)}
  ctx.fillStyle="#eee9ff";ctx.font="16px Arial";ctx.fillText(["Move a center pawn to open lines.","Bring out knights and bishops.","Protect your king early."][slide],28,125);ctx.fillStyle="#bcb3ed";ctx.font="14px Arial";ctx.fillText("Center · Develop · Castle",28,157);
}
async function prepareLectureVideo(){
  if(!lectureVideo||lectureVideoUrl||activeLesson!=="The art of the opening")return;
  if(!window.MediaRecorder){videoLoading.textContent="Video playback is unavailable; use the transcript below.";return}
  videoLoading.hidden=false;const canvas=document.createElement("canvas");canvas.width=640;canvas.height=360;const ctx=canvas.getContext("2d");const stream=canvas.captureStream(30);const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp8")?"video/webm;codecs=vp8":"video/webm";const recorder=new MediaRecorder(stream,{mimeType:mime});const chunks=[];recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)};const started=performance.now();const draw=()=>{const elapsed=(performance.now()-started)/1000;drawLectureFrame(ctx,Math.min(elapsed,12));if(elapsed<12)requestAnimationFrame(draw)};draw();recorder.start();await new Promise(resolve=>setTimeout(resolve,12100));recorder.stop();await new Promise(resolve=>recorder.onstop=resolve);lectureVideoUrl=URL.createObjectURL(new Blob(chunks,{type:mime}));lectureVideo.src=lectureVideoUrl;videoLoading.hidden=true;showToast("Your opening lecture is ready to play");}
function updateVideoChapter(){if(!lectureVideo||activeLesson!=="The art of the opening")return;const start=activeChapter*4;if(lectureVideo.readyState>0)lectureVideo.currentTime=start;const chapter=lessonContent[activeLesson].chapters[activeChapter];transcript.querySelector("span").textContent=`${chapter[1]} ${chapter[2]}`;lectureCaption.textContent=`${chapter[0]} — ${chapter[1]}`}
document.querySelectorAll(".lesson-start").forEach(btn=>btn.addEventListener("click",()=>{openLesson(btn.dataset.lesson);}));
document.getElementById("viewAllLessons").addEventListener("click",()=>openLesson("The art of the opening"));
document.getElementById("closeLesson").addEventListener("click",closeLesson);
lessonModal.addEventListener("click",event=>{if(event.target===lessonModal)closeLesson()});
document.getElementById("prevChapter").addEventListener("click",()=>{if(activeChapter>0){activeChapter--;stopLecture();renderLesson()}});
document.getElementById("nextChapter").addEventListener("click",()=>{if(activeChapter<lessonContent[activeLesson].chapters.length-1){activeChapter++;stopLecture();renderLesson()}else{showToast("You finished this lecture");}});
playLecture.addEventListener("click",startLecture);
document.querySelector(".lecture-play-icon").addEventListener("click",startLecture);
lectureVideo.addEventListener("play",()=>{lectureVisual.classList.add("lecture-playing","video-started");playLecture.innerHTML="Pause lecture <span>Ⅱ</span>"});
lectureVideo.addEventListener("pause",()=>{lectureVisual.classList.remove("lecture-playing");playLecture.innerHTML="Play lecture <span>▶</span>"});
lectureVideo.addEventListener("timeupdate",()=>{
  if(activeLesson!=="The art of the opening")return;
  const chapter=Math.min(2,Math.floor(lectureVideo.currentTime/4));
  if(chapter!==activeChapter){activeChapter=chapter;renderLesson();speakChapter()}
});
lectureVideo.addEventListener("ended",()=>{lectureVisual.classList.remove("lecture-playing");playLecture.innerHTML="Replay lecture <span>↻</span>";lectureCaption.textContent="Lecture complete — try the opening recipe on the board.";showToast("Lecture complete")});
document.getElementById("voiceLecture").addEventListener("click",()=>{voiceEnabled=!voiceEnabled;document.getElementById("voiceLecture").textContent=voiceEnabled?"Voice on":"Voice off";if(voiceEnabled)speakChapter();else if("speechSynthesis" in window)window.speechSynthesis.cancel();});
document.getElementById("practiceLesson").addEventListener("click",()=>{closeLesson();document.getElementById("play").scrollIntoView({behavior:"smooth"});showToast("Practice board ready");});
document.getElementById("resetBoard").addEventListener("click",()=>{board=initialBoard.map(row=>[...row]);moves=[];selected=null;lastMove=null;currentTurn="white";computerThinking=false;renderBoard();renderMoves();updateTurnStatus();coach("Fresh board, fresh start. Try developing a knight toward the center.");showToast("Board reset");});
document.getElementById("analyzeGame").addEventListener("click",()=>{if(!moves.length){showToast("Make a few moves first, then I can review them.");coach("Play at least one move and I’ll give you a useful review.");return}coach(`You made ${moves.length} move${moves.length===1?"":"s"} with ${moves.filter(m=>m.captured).length} capture${moves.filter(m=>m.captured).length===1?"":"s"}. Your next focus: develop pieces before attacking.`);showToast("Quick review ready");document.getElementById("review").scrollIntoView({behavior:"smooth"});});
function answerCoach(question){
  const text=question.toLowerCase();
  if(text.includes("start")||text.includes("opening")) return "Start with a center pawn, usually e4 or d4. Then develop a knight, develop a bishop, and make your king safe. Center, develop, castle.";
  if(text.includes("look")||text.includes("before")||text.includes("move")) return "Use my three-question scan: do I have a check, can I capture something, and what is my opponent threatening? Then choose the safest useful move.";
  if(text.includes("knight")) return "Knights move in an L: two squares in one direction and one to the side. They can jump over pieces, so they are wonderful beginner explorers.";
  if(text.includes("castle")||text.includes("king")) return "Castling moves your king two squares toward a rook and brings that rook beside it. It is the easiest way to protect your king early.";
  return "That is a thoughtful question. Begin by naming the piece, its destination, and what it attacks. I’ll help you turn that observation into a plan.";
}
async function askBloom(question){
  try {
    const response=await fetch("/api/coach",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({question,moves,turn:currentTurn})});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Coach unavailable");
    coach(data.answer);
  } catch {
    coach(answerCoach(question));
    showToast("Demo coach reply used — connect your server API key for live Gemma answers.");
  }
}
document.getElementById("askCoach").addEventListener("click",()=>{const input=document.getElementById("coachInput"),question=input.value.trim();if(!question){coach("Ask me anything about the board, openings, pieces, or your next move.");return}coach("Bloom is thinking about that...");input.value="";askBloom(question);});
document.getElementById("coachInput").addEventListener("keydown",event=>{if(event.key==="Enter")document.getElementById("askCoach").click()});
document.querySelectorAll(".coach-chip").forEach(button=>button.addEventListener("click",()=>{coach(answerCoach(button.dataset.question));}));
document.getElementById("practiceFocus").addEventListener("click",()=>{document.getElementById("play").scrollIntoView({behavior:"smooth"});showToast("Practice board ready");});
document.getElementById("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark-mode");showToast("Theme updated");});
document.querySelector(".avatar").addEventListener("click",()=>showToast("Your learner profile: 7 day streak · 4 lessons complete"));
document.querySelectorAll(".mode-button").forEach(button=>button.addEventListener("click",()=>{gameMode=button.dataset.mode;document.querySelectorAll(".mode-button").forEach(item=>item.classList.toggle("active",item===button));document.getElementById("resetBoard").click();showToast(gameMode==="computer"?"Playing against Bloom":"Two-player mode enabled");}));
renderBoard();renderMoves();updateTurnStatus();
