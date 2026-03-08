// --- KHAI BÁO BIẾN (CẬP NHẬT CHO TRANG ĐÔI) ---
        let pdfDoc = null, pageNum = 1, pageIsRendering = false, pageNumIsPending = null,
            pageInput = document.querySelector('#page-input'), 
            wrapper = document.querySelector('#wrapper'),
            pageContainer = document.querySelector('#page-container');

        // Khởi tạo 2 trang Trái & Phải
        const canvasLeft = document.getElementById('pdf-render-left');
        const ctxLeft = canvasLeft?.getContext('2d');
        const textLayerLeft = document.getElementById('text-layer-left');
        
        const canvasRight = document.getElementById('pdf-render-right');
        const ctxRight = canvasRight?.getContext('2d');
        const textLayerRight = document.getElementById('text-layer-right');

        let cssZoom = 100, initialDistance = null, initialZoom = 100, touchStartX = 0;
        let currentViewportLeft = null, currentViewportRight = null;

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        // --- ĐÓNG / MỞ KHUNG TỪ ĐIỂN ---
        const fabBtn = document.getElementById('fab-btn');
        const dictionaryPane = document.getElementById('dictionary-pane');
        const searchInput = document.getElementById('dict-input');

        const toggleDictionary = (forceOpen = false) => {
            if (forceOpen) dictionaryPane.classList.add('show');
            else dictionaryPane.classList.toggle('show');
            
            if (dictionaryPane.classList.contains('show')) {
                searchInput.focus();
                fabBtn.innerHTML = '✖';
            } else { fabBtn.innerHTML = '🔍'; }
        };

        fabBtn.addEventListener('click', () => toggleDictionary());

        // --- TÍNH NĂNG DỊCH + IPA + ÂM THANH ---
        const searchBtn = document.getElementById('dict-search');
        const resultDiv = document.getElementById('dict-result');

        const translateWord = async (textToTranslate = null) => {
            const text = textToTranslate || searchInput.value.trim();
            if (!text) return;
            
            searchInput.value = text; 
            resultDiv.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">Đang lấy dữ liệu từ điển...</span>';
            
            try {
                // 1. Lấy nghĩa tiếng Việt từ Google Translate
                const apiURL = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
                const response = await fetch(apiURL);
                const data = await response.json();
                
                let meaning = "";
                data[0].forEach(item => { meaning += item[0]; });

                // 2. Lấy IPA từ Free Dictionary API
                let ipaHTML = "";
                const words = text.trim().split(/\s+/);
                
                if (words.length <= 2) {
                    try {
                        const wordToSearch = words[0].toLowerCase().replace(/[^a-z-]/g, ''); 
                        if (wordToSearch) {
                            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordToSearch}`);
                            if (dictRes.ok) {
                                const dictData = await dictRes.json();
                                let ipaText = dictData[0]?.phonetic;
                                if (!ipaText) {
                                    const phoneticObj = dictData[0]?.phonetics?.find(p => p.text);
                                    if (phoneticObj) ipaText = phoneticObj.text;
                                }
                                if (ipaText) {
                                    ipaHTML = `<span class="ipa-text">${ipaText}</span>`;
                                }
                            }
                        }
                    } catch (e) { console.log("Không tìm thấy IPA cho từ này."); }
                }
                
                // 3. Hiển thị Giao diện
                resultDiv.innerHTML = `
                    <div class="word-title-container">
                        <h3>${text}</h3>
                        ${ipaHTML}
                        <button id="speak-btn" class="speak-btn" title="Nghe phát âm">🔊</button>
                    </div>
                    <div class="meaning">👉 <strong>${meaning}</strong></div>
                `;

                // 4. Gắn sự kiện phát âm
                document.getElementById('speak-btn').addEventListener('click', () => {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'en-US'; 
                    utterance.rate = 0.9;    
                    window.speechSynthesis.speak(utterance);
                });

            } catch (error) {
                resultDiv.innerHTML = '<span style="color: red;">Lỗi kết nối. Vui lòng kiểm tra mạng của bạn.</span>';
            }
        };

        searchBtn.addEventListener('click', () => translateWord());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { translateWord(); searchInput.blur(); }
        });

        // --- TÍNH NĂNG BÔI ĐEN & HIỆN TOOLTIP ---
        const selectionTooltip = document.getElementById('selection-tooltip');

        const handleSelection = () => {
            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection.toString().trim();
                
                if (text.length > 0 && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    selectionTooltip.style.display = 'block';
                    selectionTooltip.style.left = `${rect.left + (rect.width / 2)}px`;
                    selectionTooltip.style.top = `${rect.top}px`;
                } else { selectionTooltip.style.display = 'none'; }
            }, 50); 
        };

        wrapper.addEventListener('mouseup', handleSelection);
        wrapper.addEventListener('touchend', handleSelection);

        document.addEventListener('mousedown', (e) => {
            if (e.target !== selectionTooltip && !selectionTooltip.contains(e.target)) {
                selectionTooltip.style.display = 'none';
            }
        });

        selectionTooltip.addEventListener('click', () => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText) {
                toggleDictionary(true); 
                translateWord(selectedText);
                selectionTooltip.style.display = 'none';
                window.getSelection().removeAllRanges();
            }
        });

        // --- ĐỒNG BỘ SCALE LỚP CHỮ VÀ ẢNH (CHO CẢ 2 TRANG) ---
        const updateTextLayerScale = () => {
            const leftWrapper = document.getElementById('page-left-wrapper');
            const rightWrapper = document.getElementById('page-right-wrapper');

            if (currentViewportLeft && leftWrapper.offsetWidth > 0) {
                const scaleLeft = leftWrapper.offsetWidth / currentViewportLeft.width;
                textLayerLeft.style.transform = `scale(${scaleLeft})`;
            }
            if (currentViewportRight && rightWrapper.offsetWidth > 0) {
                const scaleRight = rightWrapper.offsetWidth / currentViewportRight.width;
                textLayerRight.style.transform = `scale(${scaleRight})`;
            }
        };
        window.addEventListener('resize', updateTextLayerScale);

        // --- RENDER PDF (CHẾ ĐỘ TRANG ĐÔI) ---
        const playTransitionAnimation = (direction) => {
            pageContainer.classList.remove('slide-next-anim', 'slide-prev-anim');
            void pageContainer.offsetWidth; 
            pageContainer.classList.add(direction === 'next' ? 'slide-next-anim' : 'slide-prev-anim');
        };

        const renderSinglePage = async (num, canvas, ctx, textLayer, isLeft) => {
            // Xử lý nếu lật đến cuối sách mà chỉ còn 1 trang
            if (num > pdfDoc.numPages) {
                canvas.width = 0; canvas.height = 0;
                textLayer.innerHTML = '';
                if(isLeft) currentViewportLeft = null; else currentViewportRight = null;
                return;
            }

            const page = await pdfDoc.getPage(num);
            const renderScale = window.devicePixelRatio > 1 ? window.devicePixelRatio * 1.5 : 2.5; 
            const viewport = page.getViewport({ scale: renderScale });

            if(isLeft) currentViewportLeft = viewport; else currentViewportRight = viewport;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            const textContent = await page.getTextContent();

            textLayer.innerHTML = ''; 
            textLayer.style.width = viewport.width + 'px';
            textLayer.style.height = viewport.height + 'px';

            await pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: textLayer,
                viewport: viewport,
                textDivs: []
            });

        }; // Cuối hàm renderSinglePage

        const renderPage = async (num) => {
            pageIsRendering = true;
            
            // Ép trang luôn bắt đầu từ số lẻ (VD: 1, 3, 5...)
            let startPage = num % 2 === 0 ? num - 1 : num; 
            if (startPage < 1) startPage = 1;

            await Promise.all([
                renderSinglePage(startPage, canvasLeft, ctxLeft, textLayerLeft, true),
                renderSinglePage(startPage + 1, canvasRight, ctxRight, textLayerRight, false)
            ]);

updateTextLayerScale();
            pageInput.value = startPage;
            cssZoom = 100;
            pageContainer.style.width = cssZoom + '%';
            
            pageContainer.style.maxWidth = '1200px'; 
            pageContainer.style.margin = '0 auto';
            
            // --- THÊM 2 DÒNG NÀY ĐỂ FIX LỖI KẸT GÓC NHÌN KHI LẬT TRANG ---
            wrapper.scrollTop = 0;   // Cuộn lên trên cùng
            wrapper.scrollLeft = 0;  // Cuộn về sát mép trái
            
            pageNum = startPage; 
            pageIsRendering = false;
            
            if (pageNumIsPending !== null) {
                renderPage(pageNumIsPending);
                pageNumIsPending = null;
            }
        };

        const queueRenderPage = num => {
            if (pageIsRendering) { pageNumIsPending = num; } else { renderPage(num); }
        };

        const showPrevPage = () => {
            if (pageNum <= 1) return;
            pageNum -= 2; 
            if (pageNum < 1) pageNum = 1;
            playTransitionAnimation('prev'); 
            queueRenderPage(pageNum);
        };

        const showNextPage = () => {
            if (pageNum + 1 >= pdfDoc.numPages) return;
            pageNum += 2; 
            playTransitionAnimation('next'); 
            queueRenderPage(pageNum);
        };

        const goToPage = () => {
            let desiredPage = parseInt(pageInput.value);
            if (desiredPage >= 1 && desiredPage <= pdfDoc.numPages) {
                let targetPage = desiredPage % 2 === 0 ? desiredPage - 1 : desiredPage;
                if(targetPage !== pageNum) {
                    playTransitionAnimation(targetPage > pageNum ? 'next' : 'prev');
                    pageNum = targetPage; 
                    queueRenderPage(pageNum);
                }
            } else { 
                pageInput.value = pageNum; 
            }
        };

        pageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { goToPage(); pageInput.blur(); }
        });
        pageInput.addEventListener('change', goToPage);

        // --- CỬ CHỈ ZOOM VÀ VUỐT ---
        let touchStartTime = 0;
        let isSelecting = false;

        wrapper.addEventListener('touchstart', (e) => {
            isSelecting = window.getSelection().toString().trim().length > 0;

            if (e.touches.length === 2) {
                if (isSelecting) return; 

                initialDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                initialZoom = cssZoom;
                pageContainer.style.transition = 'none'; 
            } else if (e.touches.length === 1) { 
                touchStartX = e.touches[0].screenX; 
                touchStartTime = Date.now(); 
            }
        }, { passive: false });

wrapper.addEventListener('touchmove', (e) => {
            if (window.getSelection().toString().trim().length > 0 || isSelecting) {
                return; 
            }

            if (e.touches.length === 2) {
                e.preventDefault(); 
                const currentDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                if (initialDistance) {
                    const scale = currentDistance / initialDistance;
                    let newZoom = initialZoom * scale;
                    if (newZoom < 100) newZoom = 100;
                    if (newZoom > 800) newZoom = 800;

                    const zoomRatio = newZoom / cssZoom;
                    const scrollCenterX = wrapper.scrollLeft + wrapper.clientWidth / 2;
                    const scrollCenterY = wrapper.scrollTop + wrapper.clientHeight / 2;

                    cssZoom = newZoom;
                    
                    // --- 2 DÒNG QUAN TRỌNG ĐỂ MỞ KHÓA ZOOM ---
                    pageContainer.style.maxWidth = 'none'; 
                    pageContainer.style.margin = cssZoom > 100 ? '0' : '0 auto';
                    
                    pageContainer.style.width = cssZoom + '%'; 
                    updateTextLayerScale();
                    wrapper.scrollLeft = scrollCenterX * zoomRatio - wrapper.clientWidth / 2;
                    wrapper.scrollTop = scrollCenterY * zoomRatio - wrapper.clientHeight / 2;
                }
            }
        }, { passive: false });

        wrapper.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialDistance = null; 
                pageContainer.style.transition = 'width 0.1s ease-out'; 
            }
            
            if (e.changedTouches.length === 1 && cssZoom === 100) {
                let touchEndX = e.changedTouches[0].screenX;
                let touchDuration = Date.now() - touchStartTime; 

                if (
                    document.activeElement === searchInput || 
                    document.activeElement === pageInput || 
                    window.getSelection().toString().trim().length > 0 || 
                    isSelecting || 
                    touchDuration > 400 
                ) {
                    return; 
                }

                if (touchEndX < touchStartX - 60) showNextPage(); 
                if (touchEndX > touchStartX + 60) showPrevPage(); 
            }
        });

        // --- ZOOM BẰNG CHUỘT LĂN ---
wrapper.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); 
                pageContainer.style.transition = 'none';
                let newZoom = cssZoom;
                if (e.deltaY < 0) newZoom += 15; else newZoom -= 15; 
                if (newZoom < 100) newZoom = 100;
                if (newZoom > 800) newZoom = 800;

                const zoomRatio = newZoom / cssZoom;
                const scrollCenterX = wrapper.scrollLeft + wrapper.clientWidth / 2;
                const scrollCenterY = wrapper.scrollTop + wrapper.clientHeight / 2;

                cssZoom = newZoom;
                
                // --- 2 DÒNG QUAN TRỌNG ĐỂ MỞ KHÓA ZOOM ---
                pageContainer.style.maxWidth = 'none'; 
                pageContainer.style.margin = cssZoom > 100 ? '0' : '0 auto';
                
                pageContainer.style.width = cssZoom + '%';
                updateTextLayerScale();
                wrapper.scrollLeft = scrollCenterX * zoomRatio - wrapper.clientWidth / 2;
                wrapper.scrollTop = scrollCenterY * zoomRatio - wrapper.clientHeight / 2;
            }
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            if (document.activeElement === pageInput || document.activeElement === searchInput) return;
            if (e.key === 'ArrowRight') showNextPage();
            if (e.key === 'ArrowLeft') showPrevPage();
        });

        // --- 1. TẢI FILE PDF (TỐI ƯU HÓA BỘ NHỚ CHỐNG VĂNG APP) ---
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            disableAutoFetch: true,   // Tắt tự động tải trước toàn bộ file
            disableStream: false,     // Cho phép tải từng phần nhỏ (chunk)
        });

        loadingTask.promise.then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            const countEl = document.querySelector('#page-count');
            if(countEl) countEl.textContent = pdfDoc.numPages;
            renderPage(pageNum);
        }).catch(err => { 
            console.error(err);
            alert('Lỗi: Không tìm thấy file PDF!'); 
        });

        // --- KẾT NỐI NÚT LẬT TRANG NỔI ---
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        if(prevBtn) prevBtn.addEventListener('click', showPrevPage);
        if(nextBtn) nextBtn.addEventListener('click', showNextPage);