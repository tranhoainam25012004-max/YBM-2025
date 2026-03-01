function shuffleArray(array) {
    let shuffled = [...array]; // Tạo bản sao để không làm hỏng mảng gốc
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}


function initNav() {
    const navList = document.getElementById('navList');
    allSets.forEach((set, idx) => {
        const div = document.createElement('div');
        div.className = `nav-item ${idx === 0 ? 'active' : ''}`;
        div.innerHTML = `<i class="material-icons">menu_book</i> <span>Bộ ${set.range}</span>`;
        div.onclick = (e) => { 
            loadSet(idx); 
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); 
            e.currentTarget.classList.add('active'); 
        };
        navList.appendChild(div);
    });
}

function loadSet(idx) {
 const data = allSets[idx];
    if(!data) return;

    // --- LOGIC CẬP NHẬT TIẾN ĐỘ ---
    const totalSets = allSets.length;
    const progressPercent = Math.round(((idx + 1) / totalSets) * 100);
    
    // Cập nhật độ rộng thanh Bar
    document.getElementById('progressBar').style.width = progressPercent + '%';
    // Cập nhật con số hiển thị
    document.getElementById('progressText').innerText = progressPercent + '%';
    // Cập nhật nhãn (Ví dụ: Bộ 1/4)
    document.getElementById('progressLabel').innerText = `TIẾN ĐỘ: BỘ ${idx + 1} / ${totalSets}`;
    // ------------------------------

    // QUAN TRỌNG: Reset trạng thái Ẩn/Hiện khi chuyển bộ mới
    document.getElementById('readingPanel').classList.remove('show-translation');
    document.getElementById('quizPanel').classList.remove('show-answers');
    document.getElementById('transBtn').classList.remove('active');
    document.getElementById('toggleBtn').classList.remove('active');

    // Render Flashcard
const flashArea = document.getElementById('flashcardArea');
    if (data.flashcards && data.flashcards.length > 0) {
        
        // Tạo một bản sao để không làm hỏng thứ tự gốc trong allSets
        const shuffledCards = shuffleArray([...data.flashcards]); 
        flashArea.innerHTML = shuffledCards.map(card => {
        // Tách từ và IPA, lọc bỏ các khoảng trắng thừa
        const words = card.word.split('/').map(s => s.trim()).filter(s => s !== "");
        const ipas = card.ipa.split('/').map(s => s.trim()).filter(s => s !== "");

        let wordContent = "";
        
        // Tìm đoạn này trong hàm loadSet và thay thế:
if (words.length > 1) {
    wordContent = `<div class="word-list">` + 
        words.map((w, i) => {
            const currentIpa = ipas[i] || ipas[0] || ""; 
            return `
            <div class="word-item">
                <div class="word-item-text">
                    ${card.type ? `<span class="card-type">${card.type}</span>` : ''}
                    <span class="word-main">${w}</span>
                    ${currentIpa ? `<span class="word-ipa-small">${currentIpa}</span>` : ''}
                </div>
                <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${w.replace(/'/g, "\\'")}');">
                    <i class="material-icons" style="font-size: 16px;">volume_up</i>
                </div>
            </div>`;
        }).join('') + `</div>`;
} else {
    wordContent = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
            ${card.type ? `<span class="card-type">${card.type}</span>` : ''}
            <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                <h2 class="card-word" style="margin:0; font-weight:800; color:var(--primary);">${card.word}</h2>
                <div class="speak-btn-circle" onclick="event.stopPropagation(); speak('${card.word.replace(/'/g, "\\'")}');">
                    <i class="material-icons" style="font-size: 20px;">volume_up</i>
                </div>
            </div>
        </div>
        <div class="card-ipa" style="margin-top:8px;">${card.ipa}</div>
    `;
}

        // Thay đổi nhỏ trong cấu trúc HTML trả về của Flashcard
return `
    <div class="card-container" onclick="this.classList.toggle('flipped')">
        <div class="card-inner">
            <div class="card-front">
                <span class="badge" style="position:absolute; top:20px; right:20px; background:var(--primary-light); color:var(--primary); padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:bold;">VOCAB</span>
                ${wordContent}
                
                <div style="margin-top: 20px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                        <p style="color:#64748b; font-size:0.85rem; line-height:1.6; margin:0; text-align: center; max-width: 80%;">${card.example}</p>
                        
                        <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${card.example.replace(/'/g, "\\'")}');" style="margin-left: 0; flex-shrink: 0; width: 28px; height: 28px; background: #eef2ff;">
                            <i class="material-icons" style="font-size: 16px;">volume_up</i>
                        </div>
                    </div>
                    
                    ${card.exIpa ? `<div class="card-ipa" style="font-size: 0.75rem; margin-top: 0; padding: 2px 10px; background: transparent;">${card.exIpa}</div>` : ''}
                </div>
                </div>
            <div class="card-back">
                <i class="material-icons" style="font-size:48px; margin-bottom:10px; opacity:0.8;">💡</i>
                <h4 style="font-size: 1.6rem; margin:0; text-align: center;">${card.meaning}</h4>
                <div style="width:40px; height:3px; background:white; margin:15px auto; border-radius:10px; opacity:0.5;"></div>
                <p style="font-size: 1rem; opacity: 0.9; text-align: center;">${card.exMeaning || ''}</p>
            </div>
        </div>
    </div>`;
    }).join('');
}

// Render Passages (Tìm đoạn này trong hàm loadSet)
const pBody = document.getElementById('passagesBody');
if (data.passages && data.passages.length > 0) {
    pBody.innerHTML = data.passages.map(p => {
        // Tìm đoạn render Passages trong hàm loadSet và sửa lại:
let lines = p.lines.map((l, idx) => `
    <div class="passage-line-group" style="margin-bottom:24px">
        <div class="en-header" style="display: flex; align-items: flex-start; gap: 10px;">
            <span style="color: var(--primary); font-weight: bold; font-size: 0.8rem; margin-top: 4px;">${idx + 1}.</span>
            <span class="en-text" style="font-weight:500; line-height: 1.6; flex-grow: 1;">${l.en}</span>
            
            <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${l.en.replace(/'/g, "\\'").replace(/"/g, '&quot;')}');" style="margin-left: 0; flex-shrink: 0; margin-top: 2px; width: 28px; height: 28px; background: #eef2ff;">
                <i class="material-icons" style="font-size: 16px;">volume_up</i>
            </div>
        </div>
        
        ${l.ipa ? `<div style="color: #64748b; font-size: 0.85rem; margin-left: 25px; margin-bottom: 5px; font-family: 'Inter', sans-serif;">${l.ipa}</div>` : ''}

        <span class="vi-line">${l.vi}</span>
        
        ${l.grammar ? `<div class="grammar-analysis">${l.grammar}</div>` : ''}

        <div class="input-wrapper">
            <textarea class="recall-input" style="display:none" placeholder="Dịch lại câu này..." oninput="autoHeight(this)"></textarea>
            <button class="btn-hint" style="display:none" onclick="showHint(this)">
                <i class="material-icons">lightbulb</i>
            </button>
        </div>
    </div>
`).join('');
        return `<div class="passage-block">${lines}</div>`;
    }).join('');
}

// Render Quiz
const qBody = document.getElementById('questionsBody');
if (data.questions && data.questions.length > 0) {
    qBody.innerHTML = data.questions.map((q, qIdx) => `
        <div style="margin-bottom:30px">
            <p style="font-weight:700; margin-bottom: 4px;">Q${qIdx+1}: ${q.q}</p>
            
            <div class="vi-line" style="color: var(--primary); font-weight: 600; background: #f5f3ff; border-left-color: var(--primary); margin-bottom: 15px; font-size: 0.95rem;">
                <i class="material-icons" style="font-size: 16px; vertical-align: middle;">translate</i> 
                ${q.qTrans || 'Đang cập nhật dịch câu hỏi...'}
            </div>

            ${q.options.map((opt, oIdx) => `
                <label class="option-label ${String.fromCharCode(65+oIdx) === q.ans ? 'is-correct-ans' : ''}">
                    <input type="radio" name="q${qIdx}" style="margin-right:10px"> 
                    <div style="width: 100%;">
                        <div style="font-weight: 500;">${String.fromCharCode(65+oIdx)}. ${opt}</div>
                        <div class="vi-line" style="font-size: 0.85rem; color: #64748b; background: transparent; border: none; padding: 0; margin-top: 4px;">
                            <i class="material-icons" style="font-size: 14px; vertical-align: middle;">translate</i> 
                            ${q.optTrans ? q.optTrans[oIdx] : ''}
                        </div>
                    </div>
                </label>`).join('')}
            
            <div class="explanation">
                <b>✅ Giải thích:</b> ${q.exp}<br><br>
                <b style="color:#059669">🔍 Logic:</b> ${q.logic}
                
                ${q.trap ? `
                <div class="trap-box">
                    <b>⚠️ Cẩn thận bẫy:</b> ${q.trap}
                </div>` : ''}
            </div>
        </div>`).join('');
}
// Cuộn lên đầu trang khi đổi bộ
    document.querySelector('.main-content').scrollTop = 0;

}

function toggleAllGrammar() {
    const panel = document.getElementById('readingPanel');
    const btn = document.getElementById('grammarAllBtn');
    
    // Bật/tắt class show-all-grammar tại panel chính
    const isActive = panel.classList.toggle('show-all-grammar');
    
    // Cập nhật trạng thái nút
    btn.classList.toggle('active', isActive);
    
    // Đổi icon để người dùng biết trạng thái
    btn.innerHTML = isActive ? 
        `<i class="material-icons">auto_stories</i>` : 
        `<i class="material-icons">architecture</i>`;
}


function toggleTranslation() { 
    const panel = document.getElementById('readingPanel');
    const btn = document.getElementById('transBtn');
    const isActive = panel.classList.toggle('show-translation');
    btn.classList.toggle('active', isActive);
}

function toggleAnswers() { 
    const panel = document.getElementById('quizPanel');
    const btn = document.getElementById('toggleBtn');
    const isActive = panel.classList.toggle('show-answers');
    btn.classList.toggle('active', isActive);
}

function speak(text) {
    // Kiểm tra xem trình duyệt có hỗ trợ Web Speech API không
    if ('speechSynthesis' in window) {
        // Tắt các âm thanh đang đọc dở (nếu người dùng bấm liên tục)
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Cài đặt giọng đọc tiếng Anh - Mỹ (US English)
        utterance.lang = 'en-US'; 
        
        // Bạn có thể tùy chỉnh tốc độ đọc ở đây (1 là bình thường, 0.8 là chậm hơn một chút để dễ nghe)
        utterance.rate = 0.9; 
        
        // Phát âm thanh
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
    }
}

let isAllFlipped = false;

function toggleFlipAll() {
    const cards = document.querySelectorAll('.card-container');
    const btn = document.getElementById('flipAllBtn');
    
    isAllFlipped = !isAllFlipped;
    
    cards.forEach(card => {
        if (isAllFlipped) {
            card.classList.add('flipped');
        } else {
            card.classList.remove('flipped');
        }
    });

    // Cập nhật trạng thái nút
    btn.classList.toggle('active', isAllFlipped);
    btn.innerHTML = isAllFlipped ? 
        `<i class="material-icons">unfold_less</i>` : 
        `<i class="material-icons">import_export</i>`;
}

// Cập nhật lại hàm loadSet để reset trạng thái lật khi đổi bộ từ vựng
const originalLoadSet = loadSet;
loadSet = function(idx) {
    isAllFlipped = false;
    const btn = document.getElementById('flipAllBtn');
    if(btn) {
        btn.classList.remove('active');
        btn.innerHTML = `<i class="material-icons">import_export</i>`;
    }
    originalLoadSet(idx);
}

function showHint(btn) {
    const group = btn.closest('.passage-line-group');
    const enText = group.querySelector('.en-text');
    const input = group.querySelector('.recall-input');
    const originalValue = enText.innerText.trim();

    if (input.value === originalValue) {
        input.value = "";
        input.style.borderColor = "#e2e8f0";
        input.style.background = "white";
        btn.innerHTML = `<i class="material-icons">lightbulb</i>`;
        btn.classList.remove('active-hint');
    } else {
        input.value = originalValue;
        input.style.borderColor = "#4f46e5";
        input.style.background = "#eef2ff";
        btn.innerHTML = `<i class="material-icons">lightbulb_outline</i>`;
        btn.classList.add('active-hint');
        
        // Quan trọng: Cập nhật lại chiều cao sau khi hiện đáp án
        autoHeight(input);
        
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 300);
    }
}

// Cập nhật lại hàm này để ẩn/hiện nút Hint
function toggleRecallMode() {
    const panel = document.getElementById('readingPanel');
    const btn = document.getElementById('recallBtn');
    const inputs = document.querySelectorAll('.recall-input');
    const hints = document.querySelectorAll('.btn-hint');
    
    const isRecallActive = panel.classList.toggle('recall-mode');
    btn.classList.toggle('active', isRecallActive);

    inputs.forEach(input => {
        input.style.display = isRecallActive ? 'block' : 'none';
        if (isRecallActive) input.value = ""; 
    });

    // Hiện/ẩn các nút bóng đèn
    hints.forEach(hint => {
        hint.style.display = isRecallActive ? 'grid' : 'none';
    });

    if (isRecallActive) {
        panel.classList.remove('show-translation');
        document.getElementById('transBtn').classList.remove('active');
        document.querySelector('.main-content').scrollTop = 0;
    }

    if (!isRecallActive) {
        hints.forEach(hint => {
            hint.innerHTML = `<i class="material-icons" style="font-size: 20px;">lightbulb</i>`;
            hint.classList.remove('active-hint');
        });
    }
}

function autoHeight(element) {
    element.style.height = "5px"; // Reset chiều cao để tính toán lại
    element.style.height = (element.scrollHeight) + "px";
}

function toggleGrammar(btn) {
    const group = btn.closest('.passage-line-group');
    const isActive = group.classList.toggle('show-grammar');
    btn.classList.toggle('active-grammar', isActive);
    
    // Đổi icon khi đóng/mở
    const icon = btn.querySelector('.material-icons');
    icon.innerText = isActive ? 'auto_stories' : 'architecture';
}

document.addEventListener('input', function(e) {
    if (e.target.classList.contains('recall-input')) {
        const userInput = e.target.value.trim().toLowerCase();
        // Lấy câu gốc tiếng Anh từ element ngay phía trên (class en-text)
        const originalText = e.target.parentElement.querySelector('.en-text').innerText.trim().toLowerCase();
        
        // Loại bỏ dấu câu cơ bản để so sánh dễ hơn
        const cleanOriginal = originalText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        const cleanUser = userInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        if (cleanUser === cleanOriginal) {
            e.target.style.borderColor = "#22c55e";
            e.target.style.background = "#f0fdf4";
        } else {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.background = "white";
        }
    }
});

function switchTab(tabName) {
    // 1. Chuyển đổi trạng thái Active của các nút Tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const clickedBtn = [...document.querySelectorAll('.tab-btn')].find(btn => 
        btn.getAttribute('onclick').includes(tabName)
    );
    if (clickedBtn) clickedBtn.classList.add('active');

    // 2. Hiện phần nội dung tương ứng
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`section-${tabName}`).classList.add('active');

    // 3. Ẩn tất cả các nút công cụ
    document.querySelectorAll('.btn-action').forEach(btn => btn.style.display = 'none');

    // 4. Hiện các nút dựa trên tabName (Nút grammar đã có class control-passage nên sẽ tự hiện)
    if (tabName === 'flashcard') {
        document.querySelectorAll('.control-flashcard').forEach(btn => btn.style.display = 'grid');
    } else if (tabName === 'passage') {
        document.querySelectorAll('.control-passage').forEach(btn => btn.style.display = 'grid');
    } else if (tabName === 'quiz') {
        document.querySelectorAll('.control-quiz').forEach(btn => btn.style.display = 'grid');
    }

    // 5. Cuộn nội dung lên đầu trang
    document.querySelector('.main-content').scrollTop = 0;
}

// Đảm bảo dữ liệu đã sẵn sàng trước khi chạy
window.onload = () => {
    if (typeof allSets !== 'undefined') {
        initNav();
        loadSet(0);
        switchTab('flashcard');
    }
};