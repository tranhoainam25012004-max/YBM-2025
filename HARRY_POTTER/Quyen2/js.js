        // --- 1. TÁCH DỮ LIỆU VÀ CHUYỂN TRANG THEO SỨC CHỨA KÝ TỰ ---
        const allParagraphs = rawText.trim().split(/\n\s*\n/);
        
        // Cài đặt "sức chứa" của 1 trang (khoảng 600 - 800 ký tự là đẹp cho mobile)
        const MAX_CHARS_PER_PAGE = 5000; 
        
        const pages = []; // Mảng 2 chiều chứa các trang, mỗi trang chứa nhiều đoạn văn
        let currentPageContent = [];
        let currentCharCount = 0;

        // Thuật toán nhét đoạn văn vào trang
        allParagraphs.forEach(p => {
            // Nếu thêm đoạn này vào mà vượt quá giới hạn VÀ trang hiện tại đã có ít nhất 1 đoạn
            if (currentCharCount + p.length > MAX_CHARS_PER_PAGE && currentPageContent.length > 0) {
                pages.push(currentPageContent); // Chốt trang cũ
                currentPageContent = [];        // Tạo trang mới
                currentCharCount = 0;           // Reset bộ đếm chữ
            }
            currentPageContent.push(p);
            currentCharCount += p.length;
        });
        
        // Đẩy phần còn sót lại vào trang cuối cùng
        if (currentPageContent.length > 0) {
            pages.push(currentPageContent);
        }

        // Khởi tạo trang hiện tại và tổng số trang
        let currentPage = 1;
        const totalPages = pages.length;

        function renderPage(page) {
            const paragraphsToRender = pages[page - 1]; // Lấy các đoạn văn của trang tương ứng

            const regex = /([^\(\)]+)\s*\(([^\(\)]+)\)/g;
            let html = '';
            paragraphsToRender.forEach(p => {
                let parsed = p.replace(regex, (match, en, vi) => {
                    return `<span class="interactive-group"><span class="en-text">${en.trim()}</span><span class="vi-text">(${vi.trim()})</span></span>`;
                });
                html += `<p>${parsed}</p>`;
            });

            document.getElementById('story-content').innerHTML = html;
            document.getElementById('page-info').innerText = `Trang ${page} / ${totalPages}`;
            
            document.getElementById('prev-page').disabled = (page === 1);
            document.getElementById('next-page').disabled = (page === totalPages);

            // Xóa rác khi chuyển trang
            document.getElementById('dict-panel').classList.remove('active');
            window.getSelection().removeAllRanges();
            currentWord = ""; 
        }

        renderPage(currentPage);

        // Nút lật trang
        document.getElementById('prev-page').addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderPage(currentPage); window.scrollTo(0,0); }
        });
        document.getElementById('next-page').addEventListener('click', () => {
            if (currentPage < totalPages) { currentPage++; renderPage(currentPage); window.scrollTo(0,0); }
        });

        // --- 2. XỬ LÝ SỰ KIỆN CLICK VÀ TRA TỪ ---

        // Xử lý Click Song Ngữ
        document.getElementById('story-content').addEventListener('click', (e) => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) return;

            const group = e.target.closest('.interactive-group');
            if (group) {
                group.classList.toggle('active-highlight');
                const vi = group.querySelector('.vi-text');
                if(vi) vi.classList.toggle('show');
            }
        });

        // Xử lý Tra Từ Điển
        const panel = document.getElementById('dict-panel');
        const wordEl = document.getElementById('dict-word');
        const ipaEl = document.getElementById('dict-ipa');
        const meanEl = document.getElementById('dict-meaning');
        const audioBtn = document.getElementById('dict-audio-btn');

        function triggerLookup() {
            clearTimeout(lookupTimer);
            lookupTimer = setTimeout(handleLookup, 300);
        }

        document.addEventListener('selectionchange', triggerLookup);
        document.addEventListener('mouseup', triggerLookup);
        document.addEventListener('touchend', triggerLookup);

        async function handleLookup() {
            const selectionText = window.getSelection().toString().trim();
            
            if (!selectionText) return;

            // Chỉ tra nếu bôi đen 1 từ (không chứa khoảng trắng) và là chữ cái
            if (!selectionText.includes(' ') && /^[a-zA-Z]+$/.test(selectionText)) {
                if (selectionText.toLowerCase() === currentWord.toLowerCase()) return;
                currentWord = selectionText;
                
                panel.classList.add('active');
                wordEl.innerText = selectionText;
                ipaEl.innerText = "Đang tra cứu...";
                meanEl.innerHTML = "Đang tải dữ liệu..."; // Chuyển sang innerHTML để dùng thẻ <br>

                try {
                    // Chạy song song 2 API bằng Promise.all để tăng tốc độ
                    const [dictRes, transRes] = await Promise.all([
                        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectionText}`),
                        fetch(`https://api.mymemory.translated.net/get?q=${selectionText}&langpair=en|vi`)
                    ]);

                    // 1. Xử lý dữ liệu từ điển (Lấy IPA và Audio)
                    let ipa = "";
                    let audio = "";
                    let engDef = "";

                    if (dictRes.ok) {
                        const dictData = await dictRes.json();
                        const entry = dictData[0];
                        
                        // Lấy giải nghĩa tiếng Anh dự phòng
                        engDef = entry.meanings[0]?.definitions[0]?.definition || "";

                        if (entry.phonetics) {
                            const aObj = entry.phonetics.find(p => p.audio);
                            if (aObj) audio = aObj.audio;
                            
                            // Tìm IPA
                            const iObj = entry.phonetics.find(p => p.text);
                            if (iObj) ipa = iObj.text;
                        }
                        if(!ipa && entry.phonetic) ipa = entry.phonetic;
                    }

                    // 2. Xử lý dữ liệu dịch thuật (Lấy nghĩa Tiếng Việt)
                    let viMeaning = "Không tìm thấy nghĩa tiếng Việt.";
                    if (transRes.ok) {
                        const transData = await transRes.json();
                        if (transData.responseData && transData.responseData.translatedText) {
                            viMeaning = transData.responseData.translatedText;
                        }
                    }

                    // 3. Hiển thị lên giao diện
                    ipaEl.innerText = ipa ? ipa : "/.../";
                    audioUrl = audio;

                    // Trình bày nghĩa Tiếng Việt in đậm, kèm nghĩa tiếng Anh mờ bên dưới (chuẩn style giáo viên)
                    meanEl.innerHTML = `
                        <strong style="color: var(--vi-color); font-size: 1.1rem;">${viMeaning}</strong>
                        ${engDef ? `<div style="margin-top: 8px; font-size: 0.9rem; color: #7f8c8d;"><i>en: ${engDef}</i></div>` : ''}
                    `;

                } catch (error) {
                    ipaEl.innerText = "";
                    meanEl.innerText = "Lỗi kết nối mạng hoặc API từ chối phục vụ.";
                    audioUrl = "";
                    console.error("Lỗi tra từ:", error);
                }
            }
        }

        // Phát âm thanh
        audioBtn.addEventListener('click', () => {
            if (audioUrl) {
                new Audio(audioUrl).play();
            } else {
                const ut = new SpeechSynthesisUtterance(currentWord);
                ut.lang = 'en-US';
                window.speechSynthesis.speak(ut);
            }
        });

        // Đóng panel
        document.getElementById('close-panel').addEventListener('click', () => {
            panel.classList.remove('active');
            window.getSelection().removeAllRanges(); 
            currentWord = "";
        });

        // ==========================================
        // --- 3. XỬ LÝ AUDIO PLAYER CHUYÊN NGHIỆP ---
        // ==========================================
        const audioElement = document.getElementById('chapter-audio');
        const playBtn = document.getElementById('play-pause-btn');
        const progressBar = document.getElementById('progress-bar');
        const currentTimeEl = document.getElementById('current-time');
        const durationTimeEl = document.getElementById('duration-time');
        const speedSelect = document.getElementById('speed-select');

        let isPlaying = false;

        // Hàm format thời gian (từ giây sang mm:ss)
        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }

        // 1. Khi file tải xong thông tin, set độ dài thanh cuộn
        audioElement.addEventListener('loadedmetadata', () => {
            progressBar.max = Math.floor(audioElement.duration);
            durationTimeEl.innerText = formatTime(audioElement.duration);
        });

        // 2. Xử lý nút Play/Pause
        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                audioElement.pause();
                playBtn.innerText = '▶';
            } else {
                audioElement.play();
                playBtn.innerText = '⏸'; // Ký hiệu Pause
            }
            isPlaying = !isPlaying;
        });

        // 3. Cập nhật thanh tiến trình liên tục khi đang chạy
        audioElement.addEventListener('timeupdate', () => {
            progressBar.value = Math.floor(audioElement.currentTime);
            currentTimeEl.innerText = formatTime(audioElement.currentTime);
        });

        // 4. Tua âm thanh khi người dùng kéo thanh trượt
        progressBar.addEventListener('input', () => {
            audioElement.currentTime = progressBar.value;
        });

        // 5. Thay đổi tốc độ giọng đọc
        speedSelect.addEventListener('change', (e) => {
            audioElement.playbackRate = parseFloat(e.target.value);
        });

        // 6. Tự động reset giao diện khi đọc hết truyện
        audioElement.addEventListener('ended', () => {
            isPlaying = false;
            playBtn.innerText = '▶';
            progressBar.value = 0;
            currentTimeEl.innerText = '0:00';
        });